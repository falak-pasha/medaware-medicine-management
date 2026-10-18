// MEDAWARE account deletion. Runs inside a Supabase Edge Function (Deno), written without
// Deno-only APIs so it can also be tested under Node.
//
// The caller is identified only from their own access token (never from the request body).
// Steps: confirm the token belongs to a signed-in user, remove that user's files from the
// private "avatars" and "medical-documents" buckets, then delete the auth user. Every table
// references auth.users with ON DELETE CASCADE, so the user's records go with it.

type FetchFn = typeof fetch;
type Env = (name: string) => string | undefined;

const BUCKETS = ["avatars", "medical-documents"];
const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const LIST_LIMIT = 100;
const MAX_ROUNDS = 50; // up to 5000 files per bucket; far above the app's limits

const CORS = {
  "Access-Control-Allow-Origin": "*", // the token, not a cookie, authenticates the request
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function serviceHeaders(serviceKey: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: serviceKey, "Content-Type": "application/json" };
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys do not.
  if (serviceKey.startsWith("eyJ")) headers.Authorization = `Bearer ${serviceKey}`;
  return headers;
}

async function currentUserId(base: string, apiKey: string, token: string, fetchFn: FetchFn): Promise<string | null> {
  const response = await fetchFn(`${base}/auth/v1/user`, {
    headers: { apikey: apiKey, Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const user = await response.json().catch(() => null);
  return typeof user?.id === "string" && user.id ? user.id : null;
}

// Removes every object under "<userId>/" in one bucket, a page at a time.
async function emptyUserFolder(base: string, headers: Record<string, string>, bucket: string, userId: string, fetchFn: FetchFn) {
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const list = await fetchFn(`${base}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ prefix: `${userId}/`, limit: LIST_LIMIT, offset: 0 })
    });
    if (!list.ok) throw new Error(`Listing ${bucket} failed: HTTP ${list.status}`);
    const objects: { name?: string }[] = await list.json();
    const paths = objects
      .map((object) => object.name)
      .filter((name): name is string => typeof name === "string" && name.length > 0)
      .map((name) => `${userId}/${name}`);
    if (paths.length === 0) return;
    const removed = await fetchFn(`${base}/storage/v1/object/${bucket}`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ prefixes: paths })
    });
    if (!removed.ok) throw new Error(`Removing files from ${bucket} failed: HTTP ${removed.status}`);
  }
  throw new Error(`Too many files in ${bucket}`);
}

export async function handleRequest(request: Request, env: Env, fetchFn: FetchFn = fetch): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  const missing = REQUIRED_ENV.filter((name) => !env(name)?.trim());
  if (missing.length) {
    console.error(`Missing function secrets: ${missing.join(", ")}`);
    return json(500, { error: "Account deletion is not configured" });
  }
  const base = env("SUPABASE_URL")!.replace(/\/+$/, "");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey = env("SUPABASE_ANON_KEY")?.trim() || serviceKey;

  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json(401, { error: "Sign in again, then try once more." });

  const body = await request.json().catch(() => null);
  if (body?.confirm !== "DELETE") return json(400, { error: "Type DELETE to confirm." });

  let userId: string | null;
  try {
    userId = await currentUserId(base, apiKey, token, fetchFn);
  } catch (error) {
    console.error("Checking the session failed:", error);
    return json(502, { error: "Could not check your session. Try again." });
  }
  if (!userId) return json(401, { error: "Your session has expired. Sign in again, then try once more." });

  const headers = serviceHeaders(serviceKey);
  try {
    for (const bucket of BUCKETS) await emptyUserFolder(base, headers, bucket, userId, fetchFn);
    const deleted = await fetchFn(`${base}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers
    });
    if (!deleted.ok && deleted.status !== 404) throw new Error(`Deleting the user failed: HTTP ${deleted.status}`);
  } catch (error) {
    // Log the user id only; nothing else about the account.
    console.error(`Account deletion for ${userId} failed:`, error);
    return json(500, { error: "Your account could not be fully deleted. Try again, or contact us." });
  }

  console.log(`Account ${userId} deleted`);
  return json(200, { deleted: true });
}
