// Runs the real js/pages/app.js against a minimal DOM stub and a fake Supabase client.
// No dependencies: run with `node --test tests/`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const appSource = readFileSync(new URL("../js/pages/app.js", import.meta.url), "utf8");
const TEST_USER = { id: "user-1", email: "user@example.com" };

function createElement() {
  const classes = new Set();
  const listeners = {};
  const element = {
    value: "",
    textContent: "",
    innerHTML: "",
    checked: false,
    disabled: false,
    className: "",
    dataset: {},
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, force) => {
        const on = force ?? !classes.has(name);
        on ? classes.add(name) : classes.delete(name);
        return on;
      }
    },
    addEventListener: (type, handler) => {
      (listeners[type] ||= []).push(handler);
    },
    dispatch: (type) => Promise.all(
      (listeners[type] || []).map((handler) => handler({ preventDefault() {}, target: element }))
    ),
    setAttribute() {},
    removeAttribute() {},
    focus() {},
    scrollIntoView() {},
    reset() {},
    replaceChildren() {},
    append() {},
    add() {},
    querySelectorAll: () => [],
    querySelector: () => submitButton
  };
  return element;
}
const submitButton = createElement();

// Fake Supabase query builder: records the call chain and resolves to a configurable result.
function createFakeDb(respond, user = TEST_USER) {
  const calls = [];
  const db = {
    calls,
    from(table) {
      const call = { table, ops: [] };
      calls.push(call);
      const builder = {};
      for (const op of ["select", "insert", "update", "delete", "eq", "order", "gte", "lt", "maybeSingle"]) {
        builder[op] = (...args) => {
          call.ops.push([op, ...args]);
          return builder;
        };
      }
      builder.then = (resolve, reject) => Promise.resolve(respond(call)).then(resolve, reject);
      return builder;
    },
    auth: {
      onAuthStateChange(callback) {
        db.authCallback = callback;
      },
      getSession: () => Promise.resolve({ data: { session: { user } }, error: null }),
      signInWithPassword: async () => ({}),
      signUp: async () => ({}),
      signOut: async () => ({})
    }
  };
  return db;
}

const COMPLETE_PROFILE = { full_name: "Test User", gender: "female", dob: "1990-05-01" };

const isWrite = (call) => call.ops.some(([op]) => ["insert", "update", "delete"].includes(op));

function defaultResponse(call) {
  if (call.table === "reminder_settings") return { data: null, error: null };
  // A finished profile, so the dashboard opens (see "profile setup gate" tests).
  if (call.table === "profiles") return { data: COMPLETE_PROFILE, error: null };
  if (isWrite(call)) return { data: [{ id: "new-id" }], error: null };
  return { data: [], error: null };
}

// A Date whose "now" is fixed, so schedule tests do not depend on the time they run.
function fixedClock(localDateTime) {
  const fixed = new Date(localDateTime).getTime();
  return class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [fixed]));
    }
    static now() {
      return fixed;
    }
  };
}

const bookSources = ["js/data/medicines.js", "js/shared/medicine-chat.js"]
  .map((file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));

async function loadApp(respond = defaultResponse, { now, user, withBook = false } = {}) {
  const elements = new Map();
  const $ = (id) => {
    if (!elements.has(id)) elements.set(id, createElement());
    return elements.get(id);
  };
  const db = createFakeDb(respond, user);
  const consoleErrors = [];
  const themeCalls = [];
  const redirects = [];
  const context = {
    location: { replace: (url) => redirects.push(url) },
    sessionStorage: { store: {}, setItem(key, value) { this.store[key] = value; }, getItem(key) { return this.store[key] ?? null; } },
    MEDAWARE_THEME: {
      applyGender: (gender) => themeCalls.push(["applyGender", gender]),
      reset: () => themeCalls.push(["reset"])
    },
    document: {
      getElementById: $,
      querySelectorAll: () => [],
      createElement: () => createElement()
    },
    supabase: { createClient: () => db },
    MEDAWARE_CONFIG: { supabaseUrl: "https://example.supabase.co", supabaseAnonKey: "test-key" },
    Option: function Option(text, value) {
      this.text = text;
      this.value = value;
    },
    localStorage: { getItem: () => null, setItem() {} },
    confirm: () => true,
    setTimeout,
    clearTimeout,
    setInterval: () => 0,
    clearInterval() {},
    Intl,
    URL,
    console: { ...console, error: (...args) => consoleErrors.push(args) }
  };
  if (now) context.Date = fixedClock(now);
  context.window = context;
  vm.createContext(context);
  if (withBook) bookSources.forEach((source) => vm.runInContext(source, context));
  vm.runInContext(appSource, context);
  await new Promise((resolve) => setTimeout(resolve, 10)); // let getSession resolve
  return { $, db, consoleErrors, themeCalls, redirects, context };
}

async function submitMedicine(app, name, extra = {}) {
  app.db.calls.length = 0;
  app.$("medName").value = name;
  for (const [id, value] of Object.entries(extra)) app.$(id).value = value;
  await app.$("medForm").dispatch("submit");
  await new Promise((resolve) => setTimeout(resolve, 10));
  return {
    message: app.$("medMsg").textContent,
    isError: app.$("medMsg").classList.contains("error"),
    writes: app.db.calls.filter((call) => call.table === "medicines" && isWrite(call))
  };
}

test("blank name is rejected without calling the database", async () => {
  const app = await loadApp();
  const result = await submitMedicine(app, "");
  assert.equal(result.message, "Enter a medicine name.");
  assert.equal(result.isError, true);
  assert.equal(result.writes.length, 0);
});

test("whitespace-only name is rejected without calling the database", async () => {
  const app = await loadApp();
  const result = await submitMedicine(app, "   \t  \n ");
  assert.equal(result.message, "Enter a medicine name.");
  assert.equal(result.isError, true);
  assert.equal(result.writes.length, 0);
});

test("120-character name is saved", async () => {
  const app = await loadApp();
  const name = "A".repeat(120);
  const result = await submitMedicine(app, name);
  assert.equal(result.message, "Medicine saved.");
  assert.equal(result.isError, false);
  assert.equal(result.writes.length, 1);
  const insertOp = result.writes[0].ops.find(([op]) => op === "insert");
  assert.equal(insertOp[1].name, name);
});

test("121-character name is rejected without calling the database", async () => {
  const app = await loadApp();
  const result = await submitMedicine(app, "A".repeat(121));
  assert.equal(result.message, "Medicine name must be 120 characters or fewer (currently 121).");
  assert.equal(result.isError, true);
  assert.equal(result.writes.length, 0);
});

test("surrounding spaces are trimmed before the length check", async () => {
  const app = await loadApp();
  const result = await submitMedicine(app, `   ${"B".repeat(120)}   `);
  assert.equal(result.message, "Medicine saved.");
  const insertOp = result.writes[0].ops.find(([op]) => op === "insert");
  assert.equal(insertOp[1].name, "B".repeat(120));
});

test("length is counted in characters like Postgres, not UTF-16 units", async () => {
  const app = await loadApp();
  const ok = await submitMedicine(app, "💊".repeat(120)); // JS .length would be 240
  assert.equal(ok.message, "Medicine saved.");
  const tooLong = await submitMedicine(app, "💊".repeat(121));
  assert.match(tooLong.message, /currently 121/);
  assert.equal(tooLong.writes.length, 0);
});

test("other over-long medicine fields are rejected with a field-specific message", async () => {
  const app = await loadApp();
  const result = await submitMedicine(app, "Paracetamol", { dose: "x".repeat(301) });
  assert.equal(result.message, "Dose / instructions must be 300 characters or fewer.");
  assert.equal(result.writes.length, 0);
  app.$("dose").value = "";
});

test("database name constraint error shows the name message, others show a generic one", async () => {
  let error = { code: "23514", message: 'new row violates check constraint "medicines_name_check"' };
  const app = await loadApp((call) =>
    isWrite(call) && call.table === "medicines" ? { data: null, error } : defaultResponse(call)
  );
  let result = await submitMedicine(app, "Paracetamol");
  assert.equal(result.message, "Medicine name must be between 1 and 120 characters.");
  assert.equal(result.isError, true);

  error = { code: "23514", message: 'new row violates check constraint "medicines_notes_check"' };
  result = await submitMedicine(app, "Paracetamol");
  assert.equal(result.message, "Some of the details entered are too long or invalid. Shorten them and try again.");
  assert.ok(!/constraint|medicines_/.test(result.message), "raw database text must not be shown");
  assert.ok(app.consoleErrors.length > 0, "raw error is logged for debugging");
});

test("network failure shows a connection message", async () => {
  const app = await loadApp((call) =>
    isWrite(call) ? { data: null, error: { message: "TypeError: Failed to fetch" } } : defaultResponse(call)
  );
  const result = await submitMedicine(app, "Paracetamol");
  assert.equal(result.message, "Could not reach the server. Check your internet connection and try again.");
});

test("an update that matches no row is reported instead of showing 'updated'", async () => {
  const app = await loadApp((call) =>
    call.ops.some(([op]) => op === "update") ? { data: [], error: null } : defaultResponse(call)
  );
  app.$("medId").value = "deleted-elsewhere";
  const result = await submitMedicine(app, "Paracetamol");
  assert.match(result.message, /no longer exists/);
  assert.equal(result.isError, true);
  const updateCall = result.writes[0];
  assert.deepEqual(updateCall.ops.find(([op]) => op === "eq"), ["eq", "id", "deleted-elsewhere"]);
  assert.ok(updateCall.ops.some(([op]) => op === "select"), "update requests the affected rows");
});

test("prescription title over 140 characters is rejected", async () => {
  const app = await loadApp();
  app.db.calls.length = 0;
  app.$("rxTitle").value = "T".repeat(141);
  await app.$("rxForm").dispatch("submit");
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(app.$("rxMsg").textContent, "Prescription title must be 140 characters or fewer.");
  assert.equal(app.db.calls.filter(isWrite).length, 0);
});

test("email settings: an unrecognised time zone shows a clear message", async () => {
  const app = await loadApp((call) =>
    call.table === "reminder_settings" && isWrite(call)
      ? { data: null, error: { code: "22023", message: "Unknown time zone: Etc/Unknown" } }
      : defaultResponse(call)
  );
  app.$("emailEnabled").checked = true;
  app.$("sendToAccount").checked = true;
  await app.$("emailRemForm").dispatch("submit");
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.match(app.$("emailRemMsg").textContent, /time zone was not recognised/);
});

// ---------- Today's schedule and logging streak ----------

const NOW = "2026-10-17T13:00:00"; // local time
const at = (localDateTime) => new Date(localDateTime).toISOString();

function dashboardResponse({ medicines = [], todayLogs = [], history = [], historyError = null }) {
  return (call) => {
    if (call.table === "medicines" && !isWrite(call)) return { data: medicines, error: null };
    if (call.table === "dose_logs") {
      const columns = call.ops.find(([op]) => op === "select")?.[1];
      if (columns === "taken_at") return historyError ? { data: null, error: historyError } : { data: history, error: null };
      return { data: todayLogs, error: null };
    }
    return defaultResponse(call);
  };
}

const MEDICINES = [
  { id: "late", name: "Evening tablet", reminder_time: "20:00:00", dose_instructions: "1 tablet" },
  { id: "logged", name: "Morning tablet", reminder_time: "08:00:00", dose_instructions: "2 tablets" },
  { id: "due", name: "Lunch capsule", reminder_time: "12:30:00", dose_instructions: null },
  { id: "notime", name: "As needed cream", reminder_time: null },
  { id: "future", name: "Starts tomorrow", reminder_time: "09:00:00", start_date: "2026-10-18" }
];

test("today's schedule: sorted by time, with logged / not logged / upcoming statuses", async () => {
  const app = await loadApp(dashboardResponse({
    medicines: MEDICINES,
    todayLogs: [{ id: "l1", medicine_id: "logged", taken_at: at("2026-10-17T08:05:00") }],
    history: [{ taken_at: at("2026-10-17T08:05:00") }]
  }), { now: NOW });
  const html = app.$("todayGrid").innerHTML;

  const order = ["Morning tablet", "Lunch capsule", "Evening tablet"].map((name) => html.indexOf(name));
  assert.ok(order.every((index) => index >= 0), "all scheduled medicines are shown");
  assert.deepEqual([...order].sort((a, b) => a - b), order, "sorted by reminder time");
  assert.ok(!html.includes("As needed cream"), "medicines without a reminder time are not cards");
  assert.ok(!html.includes("Starts tomorrow"), "medicines that have not started are not shown");

  assert.match(html, /status-logged">Logged at 08:05/);
  assert.match(html, /status-due">Not logged yet/);
  assert.match(html, /status-upcoming">Upcoming/);
  assert.ok(!/missed/i.test(html), "never labelled missed");
  assert.match(html, /Dose not entered/);
  assert.equal(app.$("todayNote").textContent, "1 medicine has no reminder time and is not shown here.");

  assert.equal(app.$("dosesLoggedToday").textContent, "1");
  assert.equal(app.$("dosesToLog").textContent, "2");
});

test("logging streak counts consecutive days, starting yesterday if nothing is logged today", async () => {
  const history = ["2026-10-16T09:00:00", "2026-10-15T21:00:00", "2026-10-14T08:00:00", "2026-10-12T08:00:00"]
    .map((time) => ({ taken_at: at(time) }));
  let app = await loadApp(dashboardResponse({ medicines: MEDICINES, history }), { now: NOW });
  assert.equal(app.$("loggingStreak").textContent, "3", "16th, 15th, 14th; the 13th breaks it");

  app = await loadApp(dashboardResponse({
    medicines: MEDICINES,
    history: [{ taken_at: at("2026-10-17T08:05:00") }, ...history]
  }), { now: NOW });
  assert.equal(app.$("loggingStreak").textContent, "4", "today extends the streak");

  app = await loadApp(dashboardResponse({ medicines: MEDICINES, history: [{ taken_at: at("2026-10-15T08:00:00") }] }), { now: NOW });
  assert.equal(app.$("loggingStreak").textContent, "0", "no dose yesterday or today means no streak");
});

test("the streak query asks only for recent dose times", async () => {
  const app = await loadApp(dashboardResponse({ medicines: MEDICINES }), { now: NOW });
  const history = app.db.calls.find((call) =>
    call.table === "dose_logs" && call.ops.some(([op, columns]) => op === "select" && columns === "taken_at"));
  assert.ok(history, "history query made");
  const from = new Date(history.ops.find(([op]) => op === "gte")[2]);
  assert.equal(Math.round((new Date("2026-10-17T00:00:00") - from) / 86400000), 90);
});

test("a failed streak query still shows the rest of the dashboard", async () => {
  const app = await loadApp(dashboardResponse({
    medicines: MEDICINES,
    historyError: { code: "500", message: "boom" }
  }), { now: NOW });
  assert.match(app.$("todayGrid").innerHTML, /Morning tablet/);
  assert.equal(app.$("loggingStreak").textContent, "0");
  assert.equal(app.$("toast").textContent, "", "no error toast for the optional streak");
});

test("schedule escapes medicine names and shows helpful empty states", async () => {
  let app = await loadApp(dashboardResponse({
    medicines: [{ id: "x", name: '<img src=x onerror="alert(1)">', reminder_time: "07:00:00" }]
  }), { now: NOW });
  assert.ok(!app.$("todayGrid").innerHTML.includes("<img"));
  assert.match(app.$("todayGrid").innerHTML, /&lt;img/);

  app = await loadApp(dashboardResponse({ medicines: [] }), { now: NOW });
  assert.match(app.$("todayGrid").textContent, /No medicines yet/);

  app = await loadApp(dashboardResponse({ medicines: [{ id: "n", name: "Cream", reminder_time: null }] }), { now: NOW });
  assert.match(app.$("todayGrid").textContent, /No medicines have a reminder time/);
});

test("welcome line uses the first name from the profile", async () => {
  const app = await loadApp(
    (call) => call.table === "profiles"
      ? { data: { ...COMPLETE_PROFILE, full_name: "  Falak   Pasha " }, error: null }
      : defaultResponse(call),
    { user: { id: "u2", email: "f@example.com", user_metadata: {} } }
  );
  assert.equal(app.$("welcomeEyebrow").textContent, "WELCOME BACK, FALAK");
});

// ---------- Profile summary: theme and name ----------

function profileResponse(profile, error = null) {
  return (call) => call.table === "profiles" ? { data: profile, error } : defaultResponse(call);
}

test("signing in applies the theme from the profile's gender", async () => {
  for (const gender of ["female", "male", "other", "prefer_not_to_say"]) {
    const app = await loadApp(profileResponse({ ...COMPLETE_PROFILE, gender }));
    assert.deepEqual(app.themeCalls.at(-1), ["applyGender", gender]);
    assert.deepEqual(app.redirects, []);
  }
});

test("the profile query is limited to the signed-in user's row", async () => {
  const app = await loadApp(profileResponse({ ...COMPLETE_PROFILE, gender: "male" }));
  const call = app.db.calls.find((c) => c.table === "profiles");
  assert.deepEqual(call.ops.find(([op]) => op === "eq"), ["eq", "user_id", "user-1"]);
  assert.ok(call.ops.some(([op]) => op === "maybeSingle"));
});

test("the profile name overrides the sign-up name in the welcome line", async () => {
  const app = await loadApp(profileResponse({ ...COMPLETE_PROFILE, full_name: "Ravi Kumar" }), {
    user: { id: "u3", email: "r@example.com", user_metadata: { full_name: "Old Name" } }
  });
  assert.equal(app.$("welcomeEyebrow").textContent, "WELCOME BACK, RAVI");
  assert.equal(app.$("profileLink").classList.contains("hidden"), false, "profile link shown when signed in");
});

test("if the profile cannot be loaded, the theme is left alone and the dashboard still loads", async () => {
  const app = await loadApp(profileResponse(null, { code: "42P01", message: "relation does not exist" }));
  assert.ok(!app.themeCalls.some(([name]) => name === "applyGender"));
  assert.match(app.$("medList").textContent, /No medicines yet/);
});

// ---------- Profile setup gate (onboarding) ----------

test("a new user with no profile is sent to profile setup, and the dashboard never opens", async () => {
  const app = await loadApp(profileResponse(null));
  assert.deepEqual(app.redirects, ["profile-setup.html"]);
  assert.equal(app.$("app").classList.contains("hidden"), true);
  assert.equal(app.$("profileLink").classList.contains("hidden"), true);
  assert.ok(!app.db.calls.some((call) => call.table === "medicines"), "no medicine data is loaded");
});

test("a profile missing its name, date of birth or gender also goes to setup", async () => {
  for (const missing of ["full_name", "dob", "gender"]) {
    const app = await loadApp(profileResponse({ ...COMPLETE_PROFILE, [missing]: null }));
    assert.deepEqual(app.redirects, ["profile-setup.html"], missing);
  }
});

test("a complete profile opens the dashboard directly", async () => {
  const app = await loadApp(profileResponse(COMPLETE_PROFILE));
  assert.deepEqual(app.redirects, []);
  assert.equal(app.$("app").classList.contains("hidden"), false);
  assert.equal(app.$("dashboardGate").classList.contains("hidden"), true);
  assert.equal(app.$("profileLink").classList.contains("hidden"), false);
});

test("if the profile check fails, the dashboard opens anyway (nobody is locked out)", async () => {
  const app = await loadApp(profileResponse(null, { code: "XX000", message: "boom" }));
  assert.deepEqual(app.redirects, []);
  assert.equal(app.$("app").classList.contains("hidden"), false);
  assert.ok(app.db.calls.some((call) => call.table === "medicines"));
});

// ---------- Password recovery ----------

test("a password-reset link that lands on the login page goes to the reset page, not the dashboard", async () => {
  const app = await loadApp();
  app.db.authCallback("PASSWORD_RECOVERY", { user: TEST_USER });
  assert.deepEqual(app.redirects, ["reset-password.html"]);
  assert.equal(app.context.sessionStorage.getItem("medaware_password_recovery"), "1");
});

// The names of the book cards shown in the information panel, in order.
const shownCards = (app) => [...app.$("medicineInfoResults").innerHTML.matchAll(/<h3>([^<]*)<\/h3>/g)].map((m) => m[1]);

test("saved medicines link to their book entry by name or brand, and group words or unknown names do not", async () => {
  const app = await loadApp(dashboardResponse({
    medicines: [
      { id: "a", name: "Glycomet 500", reminder_time: null },
      { id: "b", name: "Crocin", reminder_time: null },
      { id: "c", name: "Vitamin D3", reminder_time: null },
      { id: "d", name: "Statin", reminder_time: null }
    ]
  }), { now: NOW, withBook: true });
  const html = app.$("medList").innerHTML;
  assert.match(html, /data-book-info="metformin">Book info: Metformin</);
  assert.match(html, /data-book-info="paracetamol">Book info: Paracetamol</);
  assert.equal((html.match(/data-book-info=/g) || []).length, 2);
});

test("medicine search ignores strengths and falls back to names and brands in longer text", async () => {
  const app = await loadApp(defaultResponse, { withBook: true });
  for (const [query, first] of [
    ["paracetamol 500mg", "Paracetamol"],
    ["Cetirizine 10 mg", "Cetirizine"],
    ["Telma 40", "Telmisartan"],
    ["metformin 500 mg twice daily", "Metformin"],
    ["Glycomet SR 500", "Metformin"]
  ]) {
    app.$("infoSearch").value = query;
    await app.$("infoSearch").dispatch("input");
    assert.equal(shownCards(app)[0], first, query);
  }
});

test("searching any medicine's name shows that medicine first", async () => {
  const app = await loadApp(defaultResponse, { withBook: true });
  for (const entry of app.context.MEDAWARE_MEDICINES.entries) {
    app.$("infoSearch").value = entry.name;
    await app.$("infoSearch").dispatch("input");
    assert.equal(shownCards(app)[0], entry.name);
  }
});

test("brands from outside the book are found and shown with their source", async () => {
  const app = await loadApp(defaultResponse, { withBook: true });
  app.$("infoSearch").value = "Dolo 650";
  await app.$("infoSearch").dispatch("input");
  assert.equal(shownCards(app)[0], "Paracetamol");
  assert.match(app.$("medicineInfoResults").innerHTML, /Other brand names \(not from the book\): Dolo, Dolo 650, Dolopar \(source: <a href="https:\/\/www\.pacehospital\.com\//);
});
