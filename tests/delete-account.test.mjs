// Tests the delete-account Edge Function with a fake fetch standing in for Supabase.
// Run with `node --test tests/` (Node 22.18+ runs the TypeScript module directly).
import { test } from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../supabase/functions/delete-account/account.ts";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const ENV = {
  SUPABASE_URL: "https://project.supabase.co/",
  SUPABASE_SERVICE_ROLE_KEY: "eyJservice.role.jwt",
  SUPABASE_ANON_KEY: "anon-key"
};
const env = (overrides = {}) => (name) => ({ ...ENV, ...overrides })[name];

// files: bucket -> list of names inside the user's folder.
function fakeSupabase({ files = {}, userStatus = 200, deleteStatus = 200, removeStatus = 200 } = {}) {
  const calls = [];
  const remaining = Object.fromEntries(Object.entries(files).map(([b, names]) => [b, [...names]]));
  const fetchFn = async (url, init = {}) => {
    const call = { url, method: init.method || "GET", headers: init.headers || {}, body: init.body ? JSON.parse(init.body) : null };
    calls.push(call);
    const reply = (status, data) => new Response(data === undefined ? null : JSON.stringify(data), { status });
    if (url.endsWith("/auth/v1/user")) {
      return userStatus === 200 ? reply(200, { id: USER_ID, email: "a@example.com" }) : reply(userStatus, { msg: "bad jwt" });
    }
    const list = url.match(/\/storage\/v1\/object\/list\/([^/]+)$/);
    if (list) {
      const names = remaining[list[1]] || [];
      return reply(200, names.slice(0, call.body.limit).map((name) => ({ name })));
    }
    const remove = url.match(/\/storage\/v1\/object\/([^/]+)$/);
    if (remove && call.method === "DELETE") {
      if (removeStatus !== 200) return reply(removeStatus, {});
      const bucket = remove[1];
      remaining[bucket] = (remaining[bucket] || []).filter((name) => !call.body.prefixes.includes(`${USER_ID}/${name}`));
      return reply(200, []);
    }
    if (url.includes("/auth/v1/admin/users/")) return reply(deleteStatus, {});
    throw new Error(`Unexpected fetch ${url}`);
  };
  return { fetchFn, calls, remaining };
}

const post = (body = { confirm: "DELETE" }, token = "user-token") =>
  new Request("https://fn.example/delete-account", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });

test("answers the browser's CORS preflight", async () => {
  const response = await handleRequest(new Request("https://fn.example", { method: "OPTIONS" }), env());
  assert.equal(response.status, 204);
  assert.match(response.headers.get("access-control-allow-headers"), /authorization/);
});

test("rejects other methods", async () => {
  const response = await handleRequest(new Request("https://fn.example", { method: "GET" }), env());
  assert.equal(response.status, 405);
});

test("requires a token and the typed confirmation, before touching anything", async () => {
  const { fetchFn, calls } = fakeSupabase();
  assert.equal((await handleRequest(post(undefined, null), env(), fetchFn)).status, 401);
  assert.equal((await handleRequest(post({ confirm: "delete" }), env(), fetchFn)).status, 400);
  assert.equal((await handleRequest(post({}), env(), fetchFn)).status, 400);
  assert.equal(calls.length, 0);
});

test("an invalid or expired session deletes nothing", async () => {
  const { fetchFn, calls } = fakeSupabase({ userStatus: 401 });
  const response = await handleRequest(post(), env(), fetchFn);
  assert.equal(response.status, 401);
  assert.equal(calls.length, 1, "only the session check ran");
});

test("deletes only the caller's files, then the account", async () => {
  const { fetchFn, calls, remaining } = fakeSupabase({
    files: { avatars: ["avatar"], "medical-documents": ["a.pdf", "b.png"] }
  });
  const response = await handleRequest(post(), env(), fetchFn);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { deleted: true });

  const session = calls[0];
  assert.equal(session.headers.Authorization, "Bearer user-token");
  assert.equal(session.headers.apikey, "anon-key");

  for (const call of calls.filter((c) => c.url.includes("/storage/"))) {
    if (call.body.prefix) assert.equal(call.body.prefix, `${USER_ID}/`);
    if (call.body.prefixes) for (const path of call.body.prefixes) assert.ok(path.startsWith(`${USER_ID}/`), path);
    assert.equal(call.headers.Authorization, `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`);
  }
  assert.deepEqual(remaining, { avatars: [], "medical-documents": [] });

  const last = calls.at(-1);
  assert.equal(last.method, "DELETE");
  assert.equal(last.url, `https://project.supabase.co/auth/v1/admin/users/${USER_ID}`);
});

test("the user id comes from the session, never from the request body", async () => {
  const { fetchFn, calls } = fakeSupabase();
  await handleRequest(post({ confirm: "DELETE", user_id: "22222222-2222-2222-2222-222222222222" }), env(), fetchFn);
  assert.ok(calls.every((c) => !c.url.includes("22222222")));
  assert.ok(calls.at(-1).url.endsWith(USER_ID));
});

test("folders with more than one page of files are fully emptied", async () => {
  const many = Array.from({ length: 250 }, (_, i) => `${String(i).padStart(3, "0")}.pdf`);
  const { fetchFn, remaining } = fakeSupabase({ files: { "medical-documents": many } });
  const response = await handleRequest(post(), env(), fetchFn);
  assert.equal(response.status, 200);
  assert.equal(remaining["medical-documents"].length, 0);
});

test("if files cannot be removed, the account is kept and an error is returned", async () => {
  const { fetchFn, calls } = fakeSupabase({ files: { avatars: ["avatar"] }, removeStatus: 500 });
  const response = await handleRequest(post(), env(), fetchFn);
  assert.equal(response.status, 500);
  assert.ok(!calls.some((c) => c.url.includes("/auth/v1/admin/users/")), "user not deleted");
});

test("an already-deleted user counts as done", async () => {
  const { fetchFn } = fakeSupabase({ deleteStatus: 404 });
  assert.equal((await handleRequest(post(), env(), fetchFn)).status, 200);
});

test("new-style sb_secret_ keys are sent only as apikey", async () => {
  const { fetchFn, calls } = fakeSupabase({ files: { avatars: ["avatar"] } });
  await handleRequest(post(), env({ SUPABASE_SERVICE_ROLE_KEY: "sb_secret_abc" }), fetchFn);
  const admin = calls.at(-1);
  assert.equal(admin.headers.apikey, "sb_secret_abc");
  assert.equal(admin.headers.Authorization, undefined);
});

test("missing configuration is reported without details", async () => {
  const response = await handleRequest(post(), env({ SUPABASE_SERVICE_ROLE_KEY: "" }));
  assert.equal(response.status, 500);
  assert.ok(!JSON.stringify(await response.json()).includes("SERVICE"));
});
