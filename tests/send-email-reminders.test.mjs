// Tests the Edge Function logic with a fake fetch standing in for PostgREST and Brevo.
// Node 22.18+ / 23.6+ runs the TypeScript module directly. Run with `node --test tests/`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildEmail,
  handleRequest,
  secretsMatch
} from "../supabase/functions/send-email-reminders/reminders.ts";

const SECRET = "cron-secret-value";
const ENV = {
  SUPABASE_URL: "https://project.supabase.co/",
  SUPABASE_SERVICE_ROLE_KEY: "eyJservice.role.jwt",
  BREVO_API_KEY: "xkeysib-test-key",
  REMINDER_FROM_EMAIL: "reminders@example.org",
  REMINDER_CRON_SECRET: SECRET,
  MEDAWARE_APP_URL: "https://medaware.example.com"
};

function reminder(id, overrides = {}) {
  return {
    log_id: id,
    attempts: 1,
    recipient: `${id}@example.com`,
    medicine_name: "Paracetamol",
    dose_instructions: "1 tablet",
    reminder_time: "08:30:00",
    reminder_date: "2026-10-17",
    timezone: "Asia/Kolkata",
    ...overrides
  };
}

// brevoResponses: per log id, a function returning a Response or throwing.
function fakeFetch({ claimed = [], claimStatus = 200, brevoResponses = {} } = {}) {
  const calls = [];
  const fetchFn = async (url, init = {}) => {
    const call = { url, method: init.method, headers: init.headers, body: init.body ? JSON.parse(init.body) : null };
    calls.push(call);
    if (url.endsWith("/rest/v1/rpc/claim_due_email_reminders")) {
      return new Response(claimStatus === 200 ? JSON.stringify(claimed) : "db down", { status: claimStatus });
    }
    if (url.includes("/rest/v1/reminder_email_log")) return new Response(null, { status: 204 });
    if (url === "https://api.brevo.com/v3/smtp/email") {
      const id = call.body.headers["Idempotency-Key"].replace("medaware-reminder-", "");
      const respond = brevoResponses[id] || (() => new Response(JSON.stringify({ messageId: `<msg-${id}@relay>` }), { status: 201 }));
      return respond();
    }
    throw new Error(`Unexpected fetch ${url}`);
  };
  return { fetchFn, calls };
}

const post = (headers = { "x-cron-secret": SECRET }) =>
  new Request("https://fn.example/send-email-reminders", { method: "POST", headers });
const env = (overrides = {}) => (name) => ({ ...ENV, ...overrides })[name];
const noSleep = async () => {};
const logPatches = (calls) => calls.filter((c) => c.method === "PATCH");
const brevoCalls = (calls) => calls.filter((c) => c.url === "https://api.brevo.com/v3/smtp/email");

test("rejects non-POST requests", async () => {
  const response = await handleRequest(new Request("https://fn.example", { method: "GET" }), env());
  assert.equal(response.status, 405);
});

test("reports missing secrets by name without leaking values", async () => {
  const response = await handleRequest(post(), env({ BREVO_API_KEY: undefined, REMINDER_FROM_EMAIL: "", REMINDER_CRON_SECRET: " " }));
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.deepEqual(body.missing, ["BREVO_API_KEY", "REMINDER_FROM_EMAIL", "REMINDER_CRON_SECRET"]);
  assert.ok(!JSON.stringify(body).includes("eyJ"));
});

test("rejects requests without the correct cron secret", async () => {
  const { fetchFn, calls } = fakeFetch();
  for (const headers of [{}, { "x-cron-secret": "wrong" }, { "x-cron-secret": `${SECRET}x` }]) {
    const response = await handleRequest(post(headers), env(), fetchFn);
    assert.equal(response.status, 401);
  }
  assert.equal(calls.length, 0, "nothing is claimed or sent");
});

test("sends each claimed reminder once and marks it sent", async () => {
  const sleeps = [];
  const { fetchFn, calls } = fakeFetch({ claimed: [reminder("a"), reminder("b")] });
  const response = await handleRequest(post(), env(), fetchFn, async (ms) => sleeps.push(ms));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { claimed: 2, sent: 2, failed: 0, willRetry: 0 });

  const claim = calls[0];
  assert.equal(claim.url, "https://project.supabase.co/rest/v1/rpc/claim_due_email_reminders");
  assert.deepEqual(claim.body, { p_window_minutes: 10, p_max_attempts: 3, p_limit: 60 });
  assert.equal(claim.headers.apikey, ENV.SUPABASE_SERVICE_ROLE_KEY);
  assert.equal(claim.headers.Authorization, `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`);

  const sends = brevoCalls(calls);
  assert.equal(sends.length, 2);
  assert.equal(sends[0].headers["api-key"], "xkeysib-test-key");
  assert.equal(sends[0].headers.Authorization, undefined);
  assert.equal(sends[0].body.headers["Idempotency-Key"], "medaware-reminder-a");
  assert.deepEqual(sends[0].body.to, [{ email: "a@example.com" }]);
  assert.deepEqual(sends[0].body.sender, { name: "MEDAWARE", email: "reminders@example.org" });
  assert.equal(sends[0].body.subject, "MEDAWARE medicine reminder");
  assert.ok(sends[0].body.htmlContent.includes("Paracetamol"));
  assert.ok(sends[0].body.textContent.includes("Paracetamol"));
  assert.deepEqual(sleeps, [600], "Brevo calls are spaced out");

  const patches = logPatches(calls);
  assert.equal(patches.length, 2);
  assert.equal(patches[0].url, "https://project.supabase.co/rest/v1/reminder_email_log?id=eq.a");
  assert.equal(patches[0].body.status, "sent");
  assert.equal(patches[0].body.provider_message_id, "<msg-a@relay>");
  assert.ok(patches[0].body.sent_at);
});

test("no due reminders means no emails", async () => {
  const { fetchFn, calls } = fakeFetch({ claimed: [] });
  const response = await handleRequest(post(), env(), fetchFn, noSleep);
  assert.deepEqual(await response.json(), { claimed: 0, sent: 0, failed: 0, willRetry: 0 });
  assert.equal(brevoCalls(calls).length, 0);
});

test("temporary failures (5xx, 429, network) are marked failed for retry", async () => {
  const { fetchFn, calls } = fakeFetch({
    claimed: [reminder("s5"), reminder("r429"), reminder("net")],
    brevoResponses: {
      s5: () => new Response("server error", { status: 503 }),
      r429: () => new Response("slow down", { status: 429 }),
      net: () => { throw new TypeError("fetch failed"); }
    }
  });
  const response = await handleRequest(post(), env(), fetchFn, noSleep);
  assert.deepEqual(await response.json(), { claimed: 3, sent: 0, failed: 3, willRetry: 3 });
  for (const patch of logPatches(calls)) {
    assert.equal(patch.body.status, "failed");
    assert.ok(!("attempts" in patch.body), "attempt count is left for the next claim to increment");
    assert.ok(patch.body.error_message);
  }
});

test("permanent failures (bad address, unverified sender, bad key) are not retried", async () => {
  const { fetchFn, calls } = fakeFetch({
    claimed: [reminder("bad"), reminder("key")],
    brevoResponses: {
      bad: () => new Response('{"code":"invalid_parameter","message":"email is not valid in to"}', { status: 400 }),
      key: () => new Response('{"code":"unauthorized","message":"Key not found"}', { status: 401 })
    }
  });
  const response = await handleRequest(post(), env(), fetchFn, noSleep);
  assert.deepEqual(await response.json(), { claimed: 2, sent: 0, failed: 2, willRetry: 0 });
  const [bad, key] = logPatches(calls);
  assert.equal(bad.body.status, "failed");
  assert.equal(bad.body.attempts, 3);
  assert.match(bad.body.error_message, /Brevo HTTP 400/);
  assert.match(key.body.error_message, /Brevo HTTP 401/);
});

test("a duplicate_request reply counts as already sent", async () => {
  const { fetchFn, calls } = fakeFetch({
    claimed: [reminder("dup", { attempts: 2 })],
    brevoResponses: { dup: () => new Response('{"code":"duplicate_request","message":"Request already processed"}', { status: 400 }) }
  });
  const response = await handleRequest(post(), env(), fetchFn, noSleep);
  assert.deepEqual(await response.json(), { claimed: 1, sent: 1, failed: 0, willRetry: 0 });
  assert.equal(logPatches(calls)[0].body.status, "sent");
});

test("REMINDER_FROM_NAME overrides the sender name", async () => {
  const { fetchFn, calls } = fakeFetch({ claimed: [reminder("n")] });
  await handleRequest(post(), env({ REMINDER_FROM_NAME: "MEDAWARE Reminders" }), fetchFn, noSleep);
  assert.equal(brevoCalls(calls)[0].body.sender.name, "MEDAWARE Reminders");
});

test("a temporary failure on the final attempt is reported as final", async () => {
  const { fetchFn } = fakeFetch({
    claimed: [reminder("last", { attempts: 3 })],
    brevoResponses: { last: () => new Response("server error", { status: 500 }) }
  });
  const response = await handleRequest(post(), env(), fetchFn, noSleep);
  assert.deepEqual(await response.json(), { claimed: 1, sent: 0, failed: 1, willRetry: 0 });
});

test("a database failure while claiming returns 500 and sends nothing", async () => {
  const { fetchFn, calls } = fakeFetch({ claimStatus: 503 });
  const response = await handleRequest(post(), env(), fetchFn, noSleep);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Reminder run failed" });
  assert.equal(brevoCalls(calls).length, 0);
});

test("new-style sb_secret_ keys are sent only as apikey", async () => {
  const { fetchFn, calls } = fakeFetch({ claimed: [] });
  await handleRequest(post(), env({ SUPABASE_SERVICE_ROLE_KEY: "sb_secret_abc" }), fetchFn, noSleep);
  assert.equal(calls[0].headers.apikey, "sb_secret_abc");
  assert.equal(calls[0].headers.Authorization, undefined);
});

test("email content escapes HTML, includes the dose, and keeps the subject generic", () => {
  const email = buildEmail(
    reminder("x", { medicine_name: "<script>alert(1)</script>", dose_instructions: "2 & food" }),
    "https://medaware.example.com"
  );
  assert.equal(email.subject, "MEDAWARE medicine reminder");
  assert.ok(!email.html.includes("<script>"));
  assert.ok(email.html.includes("&lt;script&gt;"));
  assert.ok(email.html.includes("2 &amp; food"));
  assert.match(email.text, /scheduled for 08:30 on 2026-10-17 \(Asia\/Kolkata\)/);
  assert.match(email.text, /Dose \/ instructions you saved: 2 & food/);
  assert.match(email.text, /https:\/\/medaware\.example\.com/);

  const noDose = buildEmail(reminder("y", { dose_instructions: null }), null);
  assert.ok(!noDose.text.includes("Dose / instructions"));
  assert.match(noDose.text, /turn off email reminders in MEDAWARE\.$/);
});

test("secretsMatch compares exactly", () => {
  assert.equal(secretsMatch("abc", "abc"), true);
  assert.equal(secretsMatch("abd", "abc"), false);
  assert.equal(secretsMatch("ab", "abc"), false);
  assert.equal(secretsMatch("abcd", "abc"), false);
  assert.equal(secretsMatch(null, "abc"), false);
  assert.equal(secretsMatch("", "abc"), false);
});
