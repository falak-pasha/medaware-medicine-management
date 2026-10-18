// MEDAWARE email reminder sender. Runs inside a Supabase Edge Function (Deno), and is
// written without Deno-only APIs so it can also be tested under Node.
//
// Each run:
//   1. claims due reminders through public.claim_due_email_reminders (service role),
//      which inserts 'pending' rows into reminder_email_log so nothing is sent twice;
//   2. sends each claimed reminder through Resend;
//   3. marks each log row 'sent' or 'failed' (failed rows are retried by later runs).

export type ClaimedReminder = {
  log_id: string;
  attempts: number;
  recipient: string;
  medicine_name: string;
  dose_instructions: string | null;
  reminder_time: string; // "HH:MM:SS"
  reminder_date: string; // "YYYY-MM-DD"
  timezone: string;
};

export type ReminderConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
  resendApiKey: string;
  fromAddress: string;
  appUrl: string | null;
  windowMinutes: number;
  maxAttempts: number;
  batchLimit: number;
  sendDelayMs: number; // spacing between Resend calls, to stay under its rate limit
};

export type RunSummary = {
  claimed: number;
  sent: number;
  failed: number;
  willRetry: number;
};

type FetchFn = typeof fetch;
type SleepFn = (ms: number) => Promise<void>;

const RESEND_URL = "https://api.resend.com/emails";
// Resend's shared test domain: it only delivers to the Resend account owner's address.
// Switch to an address on your own verified domain to email other users.
const FROM_ADDRESS = "MEDAWARE <onboarding@resend.dev>";
const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "REMINDER_CRON_SECRET"];

export function loadConfig(env: (name: string) => string | undefined): ReminderConfig | { missing: string[] } {
  const missing = REQUIRED_ENV.filter((name) => !env(name)?.trim());
  if (missing.length) return { missing };
  const int = (name: string, fallback: number) => {
    const value = Number.parseInt(env(name) ?? "", 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };
  return {
    supabaseUrl: env("SUPABASE_URL")!.replace(/\/+$/, ""),
    serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY")!,
    resendApiKey: env("RESEND_API_KEY")!,
    fromAddress: FROM_ADDRESS,
    appUrl: env("MEDAWARE_APP_URL")?.trim() || null,
    windowMinutes: int("REMINDER_WINDOW_MINUTES", 10),
    maxAttempts: int("REMINDER_MAX_ATTEMPTS", 3),
    batchLimit: int("REMINDER_BATCH_LIMIT", 60),
    sendDelayMs: int("REMINDER_SEND_DELAY_MS", 600)
  };
}

// Constant-time comparison so the cron secret cannot be guessed byte by byte.
export function secretsMatch(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  let difference = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) difference |= (a[i] ?? 0) ^ b[i];
  return difference === 0;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]!);
}

// The subject stays generic so medicine names are not shown on lock screens or
// in notification previews. Content is deterministic per log row, which Resend's
// idempotency check requires when a send is retried with the same key.
export function buildEmail(reminder: ClaimedReminder, appUrl: string | null) {
  const time = reminder.reminder_time.slice(0, 5);
  const when = `${time} on ${reminder.reminder_date} (${reminder.timezone})`;
  const dose = reminder.dose_instructions?.trim();
  const text = [
    `This is your MEDAWARE reminder for ${reminder.medicine_name}, scheduled for ${when}.`,
    dose ? `Dose / instructions you saved: ${dose}` : null,
    "Follow the directions from your doctor or pharmacist. MEDAWARE does not record a dose as taken; log it in the app after you take it.",
    appUrl
      ? `Manage or turn off email reminders in MEDAWARE: ${appUrl}`
      : "You can turn off email reminders in MEDAWARE."
  ].filter(Boolean).join("\n\n");

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1f2d24">
<p>This is your MEDAWARE reminder for <strong>${escapeHtml(reminder.medicine_name)}</strong>, scheduled for ${escapeHtml(when)}.</p>
${dose ? `<p>Dose / instructions you saved: ${escapeHtml(dose)}</p>` : ""}
<p>Follow the directions from your doctor or pharmacist. MEDAWARE does not record a dose as taken; log it in the app after you take it.</p>
<p style="color:#5c6b61;font-size:13px">${appUrl
    ? `<a href="${escapeHtml(appUrl)}">Manage or turn off email reminders in MEDAWARE</a>.`
    : "You can turn off email reminders in MEDAWARE."}</p>
</div>`;

  return { subject: "MEDAWARE medicine reminder", text, html };
}

function supabaseHeaders(config: ReminderConfig): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: config.serviceRoleKey,
    "Content-Type": "application/json"
  };
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys do not.
  if (config.serviceRoleKey.startsWith("eyJ")) headers.Authorization = `Bearer ${config.serviceRoleKey}`;
  return headers;
}

async function claimReminders(config: ReminderConfig, fetchFn: FetchFn): Promise<ClaimedReminder[]> {
  const response = await fetchFn(`${config.supabaseUrl}/rest/v1/rpc/claim_due_email_reminders`, {
    method: "POST",
    headers: supabaseHeaders(config),
    body: JSON.stringify({
      p_window_minutes: config.windowMinutes,
      p_max_attempts: config.maxAttempts,
      p_limit: config.batchLimit
    })
  });
  if (!response.ok) {
    throw new Error(`claim_due_email_reminders failed: HTTP ${response.status} ${await response.text()}`);
  }
  return await response.json();
}

async function updateLog(config: ReminderConfig, fetchFn: FetchFn, logId: string, values: Record<string, unknown>) {
  const response = await fetchFn(
    `${config.supabaseUrl}/rest/v1/reminder_email_log?id=eq.${encodeURIComponent(logId)}`,
    {
      method: "PATCH",
      headers: { ...supabaseHeaders(config), Prefer: "return=minimal" },
      body: JSON.stringify(values)
    }
  );
  if (!response.ok) {
    // The row stays 'pending' and is reclaimed after 10 minutes; the retry reuses the
    // same Resend idempotency key, so an email that did go out is not sent again.
    console.error(`Could not update reminder log ${logId}: HTTP ${response.status}`);
  }
}

type SendResult =
  | { ok: true; messageId: string | null }
  | { ok: false; permanent: boolean; error: string };

async function sendEmail(config: ReminderConfig, fetchFn: FetchFn, reminder: ClaimedReminder): Promise<SendResult> {
  const email = buildEmail(reminder, config.appUrl);
  let response: Response;
  try {
    response = await fetchFn(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `medaware-reminder-${reminder.log_id}`
      },
      body: JSON.stringify({ from: config.fromAddress, to: [reminder.recipient], ...email })
    });
  } catch (error) {
    return { ok: false, permanent: false, error: `Network error: ${error instanceof Error ? error.message : String(error)}` };
  }

  const body = await response.text();
  if (response.ok) {
    let messageId: string | null = null;
    try {
      messageId = JSON.parse(body).id ?? null;
    } catch {
      // A 2xx without a JSON body still means Resend accepted the email.
    }
    return { ok: true, messageId };
  }
  // 429 (rate limit), 409 (same idempotency key still in progress) and 5xx are temporary.
  // Other 4xx errors (invalid address, unverified domain, bad key) will not fix themselves.
  const permanent = response.status >= 400 && response.status < 500 && ![409, 429].includes(response.status);
  return { ok: false, permanent, error: `Resend HTTP ${response.status}: ${body.slice(0, 400)}` };
}

export async function runReminders(
  config: ReminderConfig,
  fetchFn: FetchFn = fetch,
  sleep: SleepFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
): Promise<RunSummary> {
  const reminders = await claimReminders(config, fetchFn);
  const summary: RunSummary = { claimed: reminders.length, sent: 0, failed: 0, willRetry: 0 };

  for (const [index, reminder] of reminders.entries()) {
    if (index > 0 && config.sendDelayMs > 0) await sleep(config.sendDelayMs);
    const result = await sendEmail(config, fetchFn, reminder);

    if (result.ok) {
      summary.sent++;
      await updateLog(config, fetchFn, reminder.log_id, {
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: result.messageId,
        error_message: null
      });
      continue;
    }

    summary.failed++;
    const retry = !result.permanent && reminder.attempts < config.maxAttempts;
    if (retry) summary.willRetry++;
    // Log ids only: recipient addresses and medicine names are personal data.
    console.error(`Reminder ${reminder.log_id} attempt ${reminder.attempts} failed (${retry ? "will retry" : "final"}): ${result.error}`);
    await updateLog(config, fetchFn, reminder.log_id, {
      status: "failed",
      error_message: result.error.slice(0, 500),
      // Permanent failures are marked as out of attempts so they are not retried.
      ...(result.permanent ? { attempts: config.maxAttempts } : {})
    });
  }
  return summary;
}

export async function handleRequest(
  request: Request,
  env: (name: string) => string | undefined,
  fetchFn: FetchFn = fetch,
  sleep?: SleepFn
): Promise<Response> {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  const config = loadConfig(env);
  if ("missing" in config) {
    console.error(`Missing function secrets: ${config.missing.join(", ")}`);
    return json(500, { error: "Reminder function is not configured", missing: config.missing });
  }
  if (!secretsMatch(request.headers.get("x-cron-secret"), env("REMINDER_CRON_SECRET")!)) {
    return json(401, { error: "Unauthorized" });
  }

  try {
    const summary = await runReminders(config, fetchFn, sleep);
    console.log(`Email reminders: ${JSON.stringify(summary)}`);
    return json(200, summary);
  } catch (error) {
    console.error("Email reminder run failed:", error);
    return json(500, { error: "Reminder run failed" });
  }
}
