(() => {
  const $ = (id) => document.getElementById(id);
  const config = window.MEDAWARE_CONFIG || {};
  const supabaseAvailable = Boolean(window.supabase?.createClient);
  const supabaseUrl = typeof config.supabaseUrl === "string" ? config.supabaseUrl.trim() : "";
  const supabaseKey = typeof config.supabaseAnonKey === "string" ? config.supabaseAnonKey.trim() : "";
  const placeholderValues = ["PASTE_", "YOUR_"];
  const configIsPresent = [supabaseUrl, supabaseKey].every(
    (value) => value && !placeholderValues.some((placeholder) => value.includes(placeholder))
  );

  function showSetupMessage(message) {
    $("setup").classList.remove("hidden");
    $("setup").textContent = message;
    $("authMsg").textContent = message;
    $("authMsg").classList.add("error");
  }

  if (!configIsPresent || !supabaseAvailable) {
    showSetupMessage(
      !supabaseAvailable
        ? "The Supabase client could not be loaded. Check your internet connection and refresh."
        : "Add your Supabase project URL and anon/publishable key in js/config.js, then refresh."
    );
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    showSetupMessage("The Supabase project URL in js/config.js is not a valid URL.");
    return;
  }

  if (
    !["https:", "http:"].includes(parsedUrl.protocol) ||
    (parsedUrl.protocol === "http:" && !["localhost", "127.0.0.1"].includes(parsedUrl.hostname))
  ) {
    showSetupMessage("Use your Supabase HTTPS project URL in js/config.js.");
    return;
  }

  // Read before the Supabase client consumes and clears the link: a password-reset
  // link that lands here must go to the reset page, never the dashboard.
  const arrivedWithRecoveryLink = (() => {
    try {
      return new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    } catch {
      return false;
    }
  })();

  function goToPasswordReset() {
    try {
      window.sessionStorage.setItem("medaware_password_recovery", "1");
    } catch {
      // Without storage the reset page asks for a new link, which is still safe.
    }
    window.location.replace("reset-password.html");
  }

  const db = window.supabase.createClient(supabaseUrl, supabaseKey);
  const info = [
    [
      "Understanding medicine labels",
      "Good habit",
      "Check the medicine name, strength, directions, expiry date and storage instructions. If any part is unclear, ask a pharmacist or prescriber before taking it."
    ],
    [
      "What if I miss a dose?",
      "Ask first",
      "What to do depends on the medicine and how late the dose is. Check its patient leaflet or ask a pharmacist. Do not double a dose unless your prescriber specifically tells you to."
    ],
    [
      "Antibiotics",
      "General information",
      "Antibiotics treat certain bacterial infections, not viral illnesses such as colds. Use them only as prescribed and ask a healthcare professional about concerns or possible side effects."
    ],
    [
      "Medication precautions",
      "Safety",
      "Medicines can interact with other medicines, supplements, foods or health conditions. Check the leaflet and ask a pharmacist or prescriber before combining medicines or if you have concerns."
    ],
    [
      "Possible side effects",
      "Safety",
      "Side effects differ by medicine and person. Check the leaflet and ask a pharmacist or prescriber about concerning symptoms. Seek urgent help for a severe allergic reaction or other emergency."
    ],
    [
      "Ask a pharmacist or healthcare professional",
      "When in doubt",
      "Ask for help if directions are unclear, you are concerned about a side effect, a dose is missed, or you are considering starting, stopping or combining medicines."
    ],
    [
      "Keep a medication list",
      "Organization",
      "Record medicine names, strengths, directions, prescribers and relevant allergies or reactions. Keep the list updated and share it with your healthcare team when appropriate."
    ]
  ];

  let user = null;
  let medicines = [];
  let prescriptions = [];
  let logs = [];
  // Local dates (YYYY-MM-DD) with at least one dose logged in the streak window.
  let loggedDays = new Set();
  let loadedDateKey = null;
  let todayTimer = null;
  let readyUserId = null; // user whose onboarding check passed; the dashboard is shown for them
  const STREAK_WINDOW_DAYS = 90;
  let authMode = "login";
  let reminderTimer = null;
  let reminderStorageWarningShown = false;
  const notifiedReminders = new Set();

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function setMessage(id, text, isError = false) {
    const element = $(id);
    element.textContent = text || "";
    element.classList.toggle("error", isError);
  }

  function showToast(text, isError = false) {
    const toast = $("toast");
    toast.textContent = text;
    toast.classList.remove("hidden");
    toast.classList.toggle("toast-error", isError);
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => toast.classList.add("hidden"), 4000);
  }

  // Limits mirror the CHECK constraints in supabase/sql/schema.sql. Postgres char_length counts
  // code points, so count the same way here (an emoji is 1 character, not 2).
  const LIMITS = {
    medicineName: 120,
    doseInstructions: 300,
    frequency: 200,
    notes: 2000,
    prescriptionTitle: 140,
    doctorOrClinic: 160
  };

  function characterCount(value) {
    return [...value].length;
  }

  function isNetworkError(error) {
    const text = error instanceof Error ? error.message : String(error?.message ?? error ?? "");
    return /failed to fetch|networkerror|network request failed|load failed/i.test(text);
  }

  // Turns a Supabase/PostgREST error into a message that is safe to show to users.
  // Raw details are logged for debugging but never shown, as they can expose schema names.
  function databaseErrorMessage(error, action) {
    console.error(`Could not ${action}:`, error);
    const code = error?.code || "";
    const detail = `${error?.message || ""} ${error?.details || ""}`;

    if (isNetworkError(error)) {
      return "Could not reach the server. Check your internet connection and try again.";
    }
    if (code === "23514") {
      if (detail.includes("medicines_name_check")) {
        return `Medicine name must be between 1 and ${LIMITS.medicineName} characters.`;
      }
      if (detail.includes("prescriptions_title_check")) {
        return `Prescription title must be between 1 and ${LIMITS.prescriptionTitle} characters.`;
      }
      return "Some of the details entered are too long or invalid. Shorten them and try again.";
    }
    if (code === "22023" && /time zone/i.test(detail)) {
      return "Your device's time zone was not recognised. Check your device's date and time settings, then try again.";
    }
    if (code === "23503") {
      return "The linked medicine no longer exists. Refresh the page and try again.";
    }
    if (code === "42501" || code === "PGRST301" || code === "PGRST303" || /jwt/i.test(detail)) {
      return "Your session may have expired. Sign out, sign in again, and retry.";
    }
    return `Could not ${action}. Please try again.`;
  }

  function showUnexpectedError(error, messageId) {
    console.error("Unexpected error:", error);
    const message = isNetworkError(error)
      ? "Could not reach the server. Check your internet connection and try again."
      : "Something went wrong. Please try again.";
    if (messageId) {
      setMessage(messageId, message, true);
    } else {
      showToast(message, true);
    }
  }

  async function withButton(button, action, onError) {
    const originalText = button.textContent;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Working…";
    try {
      await action();
    } catch (error) {
      onError(error);
    } finally {
      button.textContent = originalText;
      button.removeAttribute("aria-busy");
      button.disabled = false;
    }
  }

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDate(value) {
    if (!value) return "Date not set";
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  }

  function setAuthMode(mode) {
    authMode = mode;
    $("loginTab").classList.toggle("active", mode === "login");
    $("signupTab").classList.toggle("active", mode === "signup");
    $("authTitle").textContent = mode === "login" ? "Welcome back" : "Create your account";
    $("authSub").textContent = mode === "login"
      ? "Log in to see your dashboard."
      : "Create a private account for your records.";
    $("authSubmit").textContent = mode === "login" ? "Log in" : "Create account";
    $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
    setMessage("authMsg", "");
  }

  const authCaptcha = window.MEDAWARE_CAPTCHA?.mount($("authCaptcha")) ?? { getToken: async () => undefined, reset() {} };

  async function submitAuthentication() {
    const email = $("email").value.trim();
    const password = $("password").value;
    let result;
    try {
      const captchaToken = await authCaptcha.getToken();
      result = authMode === "login"
        ? await db.auth.signInWithPassword({ email, password, options: { captchaToken } })
        : await db.auth.signUp({ email, password, options: { captchaToken } });
    } catch (error) {
      const captchaMessage = window.MEDAWARE_CAPTCHA?.describe(error);
      if (!captchaMessage) throw error;
      setMessage("authMsg", captchaMessage, true);
      return;
    } finally {
      authCaptcha.reset(); // tokens are single-use
    }

    if (result.error) {
      setMessage("authMsg", window.MEDAWARE_CAPTCHA?.describe(result.error) || result.error.message, true);
      return;
    }

    if (authMode === "signup" && !result.data.session) {
      setMessage("authMsg", "Account created. Check your email to confirm it, then log in.");
      return;
    }

    setMessage("authMsg", "");
    showToast(authMode === "login" ? "Signed in successfully." : "Account created successfully.");
  }

  function updateDashboardVisibility(nextUser) {
    const nextUserId = nextUser?.id || null;
    const previousUserId = user?.id || null;
    user = nextUser;
    // The dashboard only appears once the onboarding check has passed for this user.
    const ready = Boolean(user) && readyUserId === user.id;
    $("auth").classList.toggle("hidden", Boolean(user));
    $("app").classList.toggle("hidden", !ready);
    $("dashboardGate").classList.toggle("hidden", !user || ready);
    $("signOut").classList.toggle("hidden", !user);
    $("profileLink").classList.toggle("hidden", !ready);

    if (!user) {
      readyUserId = null;
      // The next person on this device should see the neutral theme, not this user's.
      window.MEDAWARE_THEME?.reset();
      window.clearInterval(reminderTimer);
      reminderTimer = null;
      window.clearInterval(todayTimer);
      todayTimer = null;
      clearAccountData();
      $("medList").textContent = "Log in to load medicines.";
      $("rxList").textContent = "Log in to load prescription records.";
      $("userEmail").textContent = "";
      $("welcomeEyebrow").textContent = "YOUR PERSONAL DASHBOARD";
      return;
    }

    $("userEmail").textContent = user.email || "";
    setWelcomeName(user.user_metadata?.full_name);
    updateReminderStatus();
    if (nextUserId !== previousUserId) {
      clearAccountData();
      openDashboard(user.id);
    }
  }

  // Same rule as isComplete() in js/shared/profile-common.js: these are the fields the
  // profile setup page (profile-setup.html) requires.
  function profileIsComplete(profile) {
    return Boolean(profile?.full_name && profile?.dob && profile?.gender);
  }

  // New users (no profile, or an incomplete one) must finish profile setup first.
  // If the profile cannot be checked (network or database error), the dashboard
  // opens anyway: nobody should be locked out of their medicine list.
  async function openDashboard(userId) {
    const summary = await loadProfileSummary();
    if (user?.id !== userId) return;
    if (summary.status === "incomplete") {
      window.location.replace("profile-setup.html");
      return;
    }
    readyUserId = userId;
    $("dashboardGate").classList.add("hidden");
    $("app").classList.remove("hidden");
    $("profileLink").classList.remove("hidden");
    loadRecords();
    loadEmailReminderSettings();
    startReminders();
    startTodayRefresh();
  }

  function setWelcomeName(fullName) {
    const firstName = String(fullName || "").trim().split(/\s+/)[0];
    $("welcomeEyebrow").textContent = firstName
      ? `WELCOME BACK, ${firstName.toLocaleUpperCase()}`
      : "YOUR PERSONAL DASHBOARD";
  }

  // The profile decides the theme and may hold a newer name than the one given at
  // sign-up. Returns { status: "complete" | "incomplete" | "error" }.
  async function loadProfileSummary() {
    if (!user) return { status: "error" };
    const requestedUserId = user.id;
    try {
      const result = await db
        .from("profiles")
        .select("gender, full_name, dob")
        .eq("user_id", requestedUserId)
        .maybeSingle();
      if (user?.id !== requestedUserId) return { status: "error" };
      if (result.error) {
        console.error("Could not load profile:", result.error);
        return { status: "error" };
      }
      window.MEDAWARE_THEME?.applyGender(result.data?.gender ?? null);
      if (result.data?.full_name) setWelcomeName(result.data.full_name);
      return { status: profileIsComplete(result.data) ? "complete" : "incomplete" };
    } catch (error) {
      console.error("Could not load profile:", error);
      return { status: "error" };
    }
  }

  // Keeps "Upcoming" / "Not logged yet" current as time passes, and reloads after
  // midnight so today's schedule and dose log move to the new day.
  function startTodayRefresh() {
    window.clearInterval(todayTimer);
    todayTimer = window.setInterval(() => {
      if (!user) return;
      if (loadedDateKey && loadedDateKey !== localDateKey(new Date())) {
        loadRecords();
      } else {
        renderToday();
      }
    }, 60000);
  }

  function clearAccountData() {
    medicines = [];
    prescriptions = [];
    logs = [];
    loggedDays = new Set();
    loadedDateKey = null;
    clearMedicineForm();
    $("rxForm").reset();
    $("doseForm").reset();
    $("doseList").replaceChildren();
    renderMedicineOptions();
    renderStatistics();
    renderToday();
    reminderSettingsExists = false;
    fillEmailReminderForm(null);
    setMessage("emailRemMsg", "");
  }

  async function loadRecords() {
    if (!user) return;
    $("medList").className = "empty";
    $("medList").textContent = "Loading medicines…";
    $("rxList").className = "empty";
    $("rxList").textContent = "Loading prescription records…";
    $("doseList").textContent = "Loading today's dose log…";
    const requestedUserId = user.id;
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const streakStart = new Date(dayStart);
    streakStart.setDate(streakStart.getDate() - STREAK_WINDOW_DAYS);

    try {
      const [medicineResult, prescriptionResult, doseResult, historyResult] = await Promise.all([
        db.from("medicines").select("*").order("created_at", { ascending: false }),
        db.from("prescriptions").select("*").order("created_at", { ascending: false }),
        db.from("dose_logs")
          .select("*")
          .gte("taken_at", dayStart.toISOString())
          .lt("taken_at", dayEnd.toISOString())
          .order("taken_at", { ascending: false }),
        db.from("dose_logs")
          .select("taken_at")
          .gte("taken_at", streakStart.toISOString())
          .lt("taken_at", dayEnd.toISOString())
      ]);

      if (user?.id !== requestedUserId) return;
      const error = medicineResult.error || prescriptionResult.error || doseResult.error;
      if (error) {
        showLoadError();
        showToast(databaseErrorMessage(error, "load your records"), true);
        return;
      }

      medicines = medicineResult.data || [];
      prescriptions = prescriptionResult.data || [];
      logs = doseResult.data || [];
      // The streak is a nice-to-have: if its query fails, show the rest of the dashboard.
      if (historyResult.error) console.error("Could not load dose history:", historyResult.error);
      loggedDays = new Set(
        (historyResult.data || []).map((log) => localDateKey(new Date(log.taken_at)))
      );
      loadedDateKey = localDateKey(dayStart);
      renderMedicines();
      renderPrescriptions();
      renderDoseLogs();
      renderStatistics();
      renderToday();
      renderMedicineOptions();
    } catch (error) {
      if (user?.id === requestedUserId) {
        showLoadError();
        showUnexpectedError(error, null);
      }
    }
  }

  function showLoadError() {
    $("medList").className = "empty";
    $("medList").textContent = "Could not load records. Refresh the page to try again.";
    $("rxList").className = "empty";
    $("rxList").textContent = "Could not load records. Refresh the page to try again.";
    $("doseList").textContent = "Could not load records. Refresh the page to try again.";
  }

  function clearMedicineForm() {
    $("medForm").reset();
    $("medId").value = "";
    $("medFormTitle").textContent = "Add a medicine";
    $("cancelEdit").classList.add("hidden");
    setMessage("medMsg", "");
  }

  // Returns an error message, or "" when the medicine details are valid.
  function validateMedicine(payload) {
    if (!payload.name) return "Enter a medicine name.";
    const nameLength = characterCount(payload.name);
    if (nameLength > LIMITS.medicineName) {
      return `Medicine name must be ${LIMITS.medicineName} characters or fewer (currently ${nameLength}).`;
    }
    if (payload.dose_instructions && characterCount(payload.dose_instructions) > LIMITS.doseInstructions) {
      return `Dose / instructions must be ${LIMITS.doseInstructions} characters or fewer.`;
    }
    if (payload.frequency && characterCount(payload.frequency) > LIMITS.frequency) {
      return `Schedule note must be ${LIMITS.frequency} characters or fewer.`;
    }
    if (payload.notes && characterCount(payload.notes) > LIMITS.notes) {
      return `Personal notes must be ${LIMITS.notes} characters or fewer.`;
    }
    return "";
  }

  async function saveMedicine() {
    if (!user) return;
    setMessage("medMsg", "");

    const id = $("medId").value;
    const payload = {
      user_id: user.id,
      name: $("medName").value.trim(),
      dose_instructions: $("dose").value.trim() || null,
      frequency: $("frequency").value.trim() || null,
      reminder_time: $("reminder").value || null,
      start_date: $("startDate").value || null,
      notes: $("medNotes").value.trim() || null
    };

    const validationError = validateMedicine(payload);
    if (validationError) {
      setMessage("medMsg", validationError, true);
      $("medName").focus();
      return;
    }

    // Selecting the affected row lets us detect an update that matched nothing
    // (deleted elsewhere, or blocked by RLS), which Supabase does not report as an error.
    const result = id
      ? await db.from("medicines").update(payload).eq("id", id).select("id")
      : await db.from("medicines").insert(payload).select("id");

    if (result.error) {
      setMessage("medMsg", databaseErrorMessage(result.error, "save this medicine"), true);
      return;
    }
    if (!result.data?.length) {
      setMessage(
        "medMsg",
        "This medicine could not be saved because it no longer exists. Refresh the page and try again.",
        true
      );
      return;
    }

    clearMedicineForm();
    setMessage("medMsg", id ? "Medicine updated." : "Medicine saved.");
    await loadRecords();
  }

  function beginMedicineEdit(id) {
    const medicine = medicines.find((item) => item.id === id);
    if (!medicine) return;
    $("medId").value = medicine.id;
    $("medName").value = medicine.name || "";
    $("dose").value = medicine.dose_instructions || "";
    $("frequency").value = medicine.frequency || "";
    $("reminder").value = medicine.reminder_time?.slice(0, 5) || "";
    $("startDate").value = medicine.start_date || "";
    $("medNotes").value = medicine.notes || "";
    $("medFormTitle").textContent = "Edit medicine";
    $("cancelEdit").classList.remove("hidden");
    $("medForm").scrollIntoView({ behavior: "smooth", block: "start" });
    $("medName").focus({ preventScroll: true });
  }

  async function deleteMedicine(id, button) {
    if (!window.confirm("Delete this medicine? Its related dose logs will also be deleted.")) return;
    await withButton(
      button,
      async () => {
        const result = await db.from("medicines").delete().eq("id", id).select("id");
        if (result.error) {
          showToast(databaseErrorMessage(result.error, "delete this medicine"), true);
          return;
        }
        if (!result.data?.length) {
          showToast("This medicine was already deleted. The list has been refreshed.", true);
          await loadRecords();
          return;
        }
        if ($("medId").value === id) clearMedicineForm();
        showToast("Medicine deleted.");
        await loadRecords();
      },
      (error) => showUnexpectedError(error)
    );
  }

  function renderMedicines() {
    const list = $("medList");
    if (medicines.length === 0) {
      list.className = "empty";
      list.textContent = "No medicines yet. Add your first medicine using the form.";
      return;
    }

    list.className = "";
    list.innerHTML = medicines.map((medicine) => `
      <article class="record">
        <div class="record-title">
          ${escapeHtml(medicine.name)}
          ${medicine.reminder_time
            ? `<span class="tag">${escapeHtml(medicine.reminder_time.slice(0, 5))}</span>`
            : ""}
        </div>
        <div class="record-meta">${escapeHtml(medicine.dose_instructions || "Dose not entered")} · ${escapeHtml(medicine.frequency || "Schedule not entered")}</div>
        ${medicine.start_date
          ? `<div class="record-meta">Start: ${escapeHtml(formatDate(medicine.start_date))}</div>`
          : ""}
        ${medicine.notes ? `<p>${escapeHtml(medicine.notes)}</p>` : ""}
        <div class="record-actions">
          ${bookEntriesFor(medicine.name).map((entry) => `
            <button type="button" data-book-info="${escapeHtml(entry.id)}">Book info: ${escapeHtml(entry.name)}</button>`).join("")}
          <button type="button" data-edit="${escapeHtml(medicine.id)}">Edit</button>
          <button type="button" class="danger" data-delete-medicine="${escapeHtml(medicine.id)}">Delete</button>
        </div>
      </article>
    `).join("");

    list.querySelectorAll("[data-edit]").forEach((button) => {
      button.addEventListener("click", () => beginMedicineEdit(button.dataset.edit));
    });
    list.querySelectorAll("[data-book-info]").forEach((button) => {
      button.addEventListener("click", () => showBookEntry(button.dataset.bookInfo));
    });
    list.querySelectorAll("[data-delete-medicine]").forEach((button) => {
      button.addEventListener("click", () => deleteMedicine(button.dataset.deleteMedicine, button));
    });
  }

  function renderMedicineOptions() {
    const select = $("doseMedicine");
    const currentValue = select.value;
    select.replaceChildren(new Option("Choose medicine", ""));
    medicines.forEach((medicine) => {
      select.add(new Option(medicine.name, medicine.id));
    });
    if (medicines.some((medicine) => medicine.id === currentValue)) {
      select.value = currentValue;
    }
  }

  async function saveDoseLog() {
    if (!user) return;
    setMessage("doseMsg", "");
    const medicineId = $("doseMedicine").value;
    if (!medicineId) {
      setMessage("doseMsg", "Choose a medicine.", true);
      return;
    }
    const [hours, minutes] = $("doseTime").value.split(":").map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
      setMessage("doseMsg", "Enter the time the dose was taken.", true);
      return;
    }
    const takenAt = new Date();
    takenAt.setHours(hours, minutes, 0, 0);
    const result = await db.from("dose_logs").insert({
      user_id: user.id,
      medicine_id: medicineId,
      taken_at: takenAt.toISOString()
    });

    if (result.error) {
      setMessage("doseMsg", databaseErrorMessage(result.error, "save this dose log"), true);
      return;
    }

    setMessage("doseMsg", "Dose log saved.");
    await loadRecords();
  }

  function renderDoseLogs() {
    const list = $("doseList");
    if (logs.length === 0) {
      list.replaceChildren();
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "muted";
      emptyMessage.textContent = "No doses logged today.";
      list.append(emptyMessage);
      return;
    }

    list.innerHTML = logs.map((log) => {
      const medicine = medicines.find((item) => item.id === log.medicine_id);
      const time = new Date(log.taken_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      return `<div class="record"><strong>${escapeHtml(medicine?.name || "Medicine")}</strong> · ${escapeHtml(time)} <span class="tag">Logged</span></div>`;
    }).join("");
  }

  function renderStatistics() {
    $("medCount").textContent = String(medicines.length);
    $("todayCount").textContent = String(
      medicines.filter((medicine) => medicine.reminder_time).length
    );
    $("rxCount").textContent = String(prescriptions.length);
  }

  function formatClockTime(timeValue) {
    const [hours, minutes] = timeValue.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Consecutive days, ending today (or yesterday if nothing is logged yet today),
  // with at least one dose logged. Limited to the loaded history window.
  function loggingStreak() {
    const day = new Date();
    if (!loggedDays.has(localDateKey(day))) day.setDate(day.getDate() - 1);
    let streak = 0;
    while (loggedDays.has(localDateKey(day)) && streak <= STREAK_WINDOW_DAYS) {
      streak++;
      day.setDate(day.getDate() - 1);
    }
    return streak;
  }

  // Today's schedule: medicines with a reminder time that have started, with a status
  // from today's dose logs. Statuses never say "missed": MEDAWARE only knows what was
  // logged, and a "missed" label could prompt someone to take an extra dose.
  function renderToday() {
    const now = new Date();
    const today = localDateKey(now);
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const scheduled = medicines
      .filter((medicine) => medicine.reminder_time && (!medicine.start_date || medicine.start_date <= today))
      .sort((a, b) => a.reminder_time.localeCompare(b.reminder_time) || a.name.localeCompare(b.name));
    const loggedTimes = new Map();
    // logs are newest first, so the first match is the latest dose today.
    logs.forEach((log) => {
      if (!loggedTimes.has(log.medicine_id)) loggedTimes.set(log.medicine_id, log.taken_at);
    });

    $("todayDate").textContent = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });

    const grid = $("todayGrid");
    if (scheduled.length === 0) {
      delete grid.dataset.rendered;
      grid.className = "today-grid empty";
      grid.textContent = medicines.length === 0
        ? "No medicines yet. Add one in Medicines & tracking below."
        : "No medicines have a reminder time for today. Add a reminder time to a medicine to see it here.";
    } else {
      grid.className = "today-grid";
      const html = scheduled.map((medicine) => {
        const reminderTime = medicine.reminder_time.slice(0, 5);
        const loggedAt = loggedTimes.get(medicine.id);
        const status = loggedAt
          ? {
              className: "status-logged",
              text: `Logged at ${new Date(loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            }
          : reminderTime > currentTime
            ? { className: "status-upcoming", text: "Upcoming" }
            : { className: "status-due", text: "Not logged yet" };
        return `
          <article class="medicine-card">
            <div class="medicine-icon" aria-hidden="true">💊</div>
            <h3 class="medicine-name">${escapeHtml(medicine.name)}</h3>
            <p class="medicine-dosage">${escapeHtml(medicine.dose_instructions || "Dose not entered")}</p>
            <p class="medicine-time">${escapeHtml(formatClockTime(reminderTime))}</p>
            <p class="medicine-status ${status.className}">${escapeHtml(status.text)}</p>
          </article>
        `;
      }).join("");
      // Called every minute; only touch the DOM when something actually changed.
      if (grid.dataset.rendered !== html) {
        grid.innerHTML = html;
        grid.dataset.rendered = html;
      }
    }

    const unscheduled = medicines.length - medicines.filter((medicine) => medicine.reminder_time).length;
    $("todayNote").textContent = unscheduled > 0
      ? `${unscheduled} ${unscheduled === 1 ? "medicine has" : "medicines have"} no reminder time and ${unscheduled === 1 ? "is" : "are"} not shown here.`
      : "";

    $("dosesLoggedToday").textContent = String(logs.length);
    $("dosesToLog").textContent = String(scheduled.filter((medicine) => !loggedTimes.has(medicine.id)).length);
    const streak = loggingStreak();
    $("loggingStreak").textContent = streak > STREAK_WINDOW_DAYS ? `${STREAK_WINDOW_DAYS}+` : String(streak);
  }

  async function savePrescription() {
    if (!user) return;
    setMessage("rxMsg", "");
    const payload = {
      user_id: user.id,
      title: $("rxTitle").value.trim(),
      prescription_date: $("rxDate").value || null,
      doctor_or_clinic: $("rxDoctor").value.trim() || null,
      notes: $("rxNotes").value.trim() || null
    };
    if (!payload.title) {
      setMessage("rxMsg", "Enter a prescription title.", true);
      return;
    }
    if (characterCount(payload.title) > LIMITS.prescriptionTitle) {
      setMessage("rxMsg", `Prescription title must be ${LIMITS.prescriptionTitle} characters or fewer.`, true);
      return;
    }
    if (payload.doctor_or_clinic && characterCount(payload.doctor_or_clinic) > LIMITS.doctorOrClinic) {
      setMessage("rxMsg", `Doctor or clinic must be ${LIMITS.doctorOrClinic} characters or fewer.`, true);
      return;
    }
    if (payload.notes && characterCount(payload.notes) > LIMITS.notes) {
      setMessage("rxMsg", `Notes must be ${LIMITS.notes} characters or fewer.`, true);
      return;
    }
    const result = await db.from("prescriptions").insert(payload);

    if (result.error) {
      setMessage("rxMsg", databaseErrorMessage(result.error, "save this prescription record"), true);
      return;
    }

    $("rxForm").reset();
    setMessage("rxMsg", "Prescription record saved.");
    await loadRecords();
  }

  async function deletePrescription(id, button) {
    if (!window.confirm("Delete this prescription record?")) return;
    await withButton(
      button,
      async () => {
        const result = await db.from("prescriptions").delete().eq("id", id).select("id");
        if (result.error) {
          showToast(databaseErrorMessage(result.error, "delete this prescription record"), true);
          return;
        }
        if (!result.data?.length) {
          showToast("This prescription record was already deleted. The list has been refreshed.", true);
          await loadRecords();
          return;
        }
        showToast("Prescription record deleted.");
        await loadRecords();
      },
      (error) => showUnexpectedError(error)
    );
  }

  function renderPrescriptions() {
    const list = $("rxList");
    if (prescriptions.length === 0) {
      list.className = "empty";
      list.textContent = "No prescription records yet.";
      return;
    }

    list.className = "";
    list.innerHTML = prescriptions.map((prescription) => `
      <article class="record">
        <p class="record-title">${escapeHtml(prescription.title)}</p>
        <p class="record-meta">
          ${escapeHtml(prescription.doctor_or_clinic || "No clinic entered")}
          · ${escapeHtml(formatDate(prescription.prescription_date))}
        </p>
        ${prescription.notes ? `<p>${escapeHtml(prescription.notes)}</p>` : ""}
        <div class="record-actions">
          <button type="button" class="danger" data-delete-prescription="${escapeHtml(prescription.id)}">Delete record</button>
        </div>
      </article>
    `).join("");

    list.querySelectorAll("[data-delete-prescription]").forEach((button) => {
      button.addEventListener("click", () => {
        deletePrescription(button.dataset.deletePrescription, button);
      });
    });
  }
  // ---------- EMAIL REMINDER SETTINGS ----------
  let reminderSettingsExists = false;
  // Off until a verification email exists: an unverified custom address never receives reminders.
  const CUSTOM_EMAIL_ENABLED = false;

  function fillEmailReminderForm(settings) {
    $("emailEnabled").checked = Boolean(settings?.email_enabled);
    $("sendToAccount").checked = settings ? settings.send_to_account : true;
    $("sendToCustom").checked = Boolean(settings?.send_to_custom);
    $("customEmail").value = settings?.custom_email || "";
    $("emailOptions").classList.toggle("hidden", !$("emailEnabled").checked);
    $("customEmailOption").hidden = !CUSTOM_EMAIL_ENABLED;
    if (!CUSTOM_EMAIL_ENABLED) {
      // The account email is the only destination for now, so it cannot be unticked.
      $("sendToAccount").checked = true;
      $("sendToAccount").disabled = true;
    }
    $("accountEmailText").textContent = user?.email || "your account email";
    $("customEmailStatus").textContent = settings?.custom_email
      ? (settings.custom_email_verified
          ? "This custom email is verified."
          : "This custom email is not verified yet. Verification comes in a later step.")
      : "";
  }

  async function loadEmailReminderSettings() {
    if (!user) return;
    const requestedUserId = user.id;
    try {
      const result = await db
        .from("reminder_settings")
        .select("*")
        .eq("user_id", requestedUserId)
        .maybeSingle();

      if (user?.id !== requestedUserId) return;
      if (result.error) {
        console.error("Load reminder settings failed:", result.error);
        setMessage("emailRemMsg", "Could not load your email reminder settings.", true);
        return;
      }
      reminderSettingsExists = Boolean(result.data);
      fillEmailReminderForm(result.data);
    } catch (error) {
      console.error("Load reminder settings failed:", error);
    }
  }

  async function saveEmailReminderSettings() {
    if (!user) return;

    const emailEnabled = $("emailEnabled").checked;
    const toAccount = CUSTOM_EMAIL_ENABLED ? $("sendToAccount").checked : true;
    const toCustom = CUSTOM_EMAIL_ENABLED && $("sendToCustom").checked;
    const customEmail = CUSTOM_EMAIL_ENABLED ? $("customEmail").value.trim().toLowerCase() : "";

    if (customEmail && (customEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmail))) {
      setMessage("emailRemMsg", "Enter a valid custom email address.", true);
      return;
    }
    if (emailEnabled && !toAccount && !toCustom) {
      setMessage("emailRemMsg", "Choose at least one email address.", true);
      return;
    }
    if (emailEnabled && toCustom && !customEmail) {
      setMessage("emailRemMsg", "Enter your custom email, or untick it.", true);
      return;
    }

    const values = {
      email_enabled: emailEnabled,
      send_to_account: toAccount,
      send_to_custom: toCustom,
      // Keep any saved custom address while the option is hidden.
      ...(CUSTOM_EMAIL_ENABLED ? { custom_email: customEmail || null } : {}),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata"
    };

    const result = reminderSettingsExists
      ? await db.from("reminder_settings").update(values).eq("user_id", user.id)
      : await db.from("reminder_settings").insert({ user_id: user.id, ...values });

    if (result.error) {
      setMessage("emailRemMsg", databaseErrorMessage(result.error, "save your email settings"), true);
      return;
    }

    reminderSettingsExists = true;
    setMessage("emailRemMsg", "Email reminder settings saved.");
    await loadEmailReminderSettings();
  }

  $("emailEnabled").addEventListener("change", () => {
    $("emailOptions").classList.toggle("hidden", !$("emailEnabled").checked);
  });
  $("emailRemForm").addEventListener("submit", (event) => {
    event.preventDefault();
    withButton(
      $("emailRemForm").querySelector('[type="submit"]'),
      saveEmailReminderSettings,
      (error) => showUnexpectedError(error, "emailRemMsg")
    );
  });
  // Book-extracted entries from js/data/medicines.js; missing data leaves only the general notes.
  const medicineBook = window.MEDAWARE_MEDICINES || { source: null, entries: [] };
  const BOOK_SECTIONS = [
    ["uses", "Used for"],
    ["sideEffects", "Possible side effects"],
    ["warnings", "Warnings and precautions"],
    ["contraindications", "Should not be used when"],
    ["interactions", "Interactions"],
    ["dosage", "Usual adult dose in the book"]
  ];

  const STRENGTH_WORD = /^(\d+([.,]\d+)?(mg|mcg|µg|g|ml|iu|%)?|mg|mcg|µg|ml|iu|tab|tabs|tablet|tablets|cap|caps|capsule|capsules|syrup)$/;

  // Brand names from outside the book (each group carries its own source).
  function otherBrandNames(entry) {
    return (entry.otherBrands || []).flatMap((group) => group.names || []);
  }

  function medicineSearchText(entry) {
    const sectionText = [
      ...Object.values(entry.sections || {}),
      ...(entry.otherBooks || [])
    ].flatMap((section) => section.items || []);
    return [
      entry.name,
      ...(entry.aliases || []),
      ...(entry.brands || []),
      ...otherBrandNames(entry),
      entry.drugClass,
      entry.summary,
      ...sectionText
    ].join(" ").toLocaleLowerCase();
  }

  const medicineIndex = medicineBook.entries.map((entry) => ({
    entry,
    nameText: [entry.name, ...(entry.aliases || []), ...(entry.brands || []), ...otherBrandNames(entry)].join(" ").toLocaleLowerCase(),
    fullText: medicineSearchText(entry)
  }));

  // Book entries named in a saved medicine ("Glycomet 500" -> Metformin). Group words such as
  // "statin" match several entries and are left out, so only unambiguous names get a link.
  const bookLookup = window.MedawareChat?.createChatEngine(medicineBook);

  function bookEntriesFor(name) {
    return bookLookup ? bookLookup.findMedicines(name || "").definite : [];
  }

  function showBookEntry(id) {
    const entry = medicineBook.entries.find((item) => item.id === id);
    if (!entry) return;
    $("infoSearch").value = entry.name;
    document.querySelector('[data-panel="infoPanel"]')?.click();
    renderInformation(entry.name);
    // Name matches are listed first, so the first card is this entry.
    const card = $("medicineInfoResults").querySelector(".medicine-info-card");
    card?.querySelector("details")?.setAttribute("open", "");
    card?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function formatPages(pages = []) {
    if (pages.length === 0) return "";
    return `${pages.length === 1 ? "p." : "pp."} ${pages.join(", ")}`;
  }

  function safeExternalUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
    } catch {
      return null;
    }
  }

  function bookCitation(bookKey, pages) {
    const book = medicineBook.sources?.[bookKey];
    const name = book ? `${book.short} (${book.year})` : bookKey;
    return `${name}, ${formatPages(pages)}`;
  }

  function renderMedicineEntry(entry) {
    const sections = BOOK_SECTIONS
      .map(([key, label]) => {
        const main = entry.sections?.[key];
        const extra = (entry.otherBooks || []).filter((block) => block.section === key && block.items?.length);
        if (!main?.items?.length && !extra.length) return "";
        const mainList = main?.items?.length
          ? `<p class="book-cite">${escapeHtml(bookCitation("tripathi", main.pages))}</p>
            <ul>${main.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
          : "";
        const extraLists = extra.map((block) => `
            <p class="book-cite">${escapeHtml(bookCitation(block.book, block.pages))}</p>
            <ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`).join("");
        return `
          <details class="book-section">
            <summary>${escapeHtml(label)}${extra.length ? ` <span class="book-pages">(${extra.length + (main?.items?.length ? 1 : 0)} books)</span>` : main?.pages?.length ? ` <span class="book-pages">(${escapeHtml(formatPages(main.pages))})</span>` : ""}</summary>
            ${key === "dosage" ? `<p class="book-dose-note">General adult reference only, not a prescription. Always follow your own prescription.</p>` : ""}
            ${mainList}${extraLists}
          </details>`;
      }).join("");

    const otherNames = [...(entry.aliases || []), ...(entry.brands || [])];
    const otherBrands = (entry.otherBrands || []).map((group) => {
      const url = safeExternalUrl(group.url);
      const source = url
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(group.source)}</a>`
        : escapeHtml(group.source);
      return `${escapeHtml((group.names || []).join(", "))} (source: ${source})`;
    });
    const flags = (entry.flags || []).map((flag) => `<p class="book-flag"><strong>Reviewer note:</strong> ${escapeHtml(flag)}</p>`).join("");
    const updates = (entry.updates || []).map((update) => {
      const url = safeExternalUrl(update.url);
      const source = url
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(update.source)}</a>`
        : escapeHtml(update.source);
      return `
        <div class="book-update">
          <strong>Update since the book${update.date ? ` (${escapeHtml(formatDate(update.date))})` : ""}:</strong>
          ${escapeHtml(update.text)}
          <span class="book-update-source">Source: ${source}</span>
        </div>`;
    }).join("");

    const reviewed = entry.review === "reviewed";
    return `
      <article class="info-card medicine-info-card">
        <span class="tag ${reviewed ? "" : "tag-unreviewed"}">${reviewed ? "Reviewed" : "Not yet reviewed by a pharmacist"}</span>
        <h3>${escapeHtml(entry.name)}</h3>
        ${otherNames.length ? `<p class="record-meta">Also known as: ${escapeHtml(otherNames.join(", "))}</p>` : ""}
        ${otherBrands.length ? `<p class="record-meta">Other brand names (not from the book): ${otherBrands.join("; ")}</p>` : ""}
        <p class="record-meta">${escapeHtml(entry.drugClass)}</p>
        <p>${escapeHtml(entry.summary)}</p>
        ${updates}
        ${sections}
        ${flags}
      </article>`;
  }

  function renderInformation(query = "") {
    // Every word must appear somewhere, so "missed dose" matches "...a dose is missed".
    const allWords = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    // Strengths and forms ("500mg", "10 mg", "tab") are left out of medicine matching,
    // so "Paracetamol 500mg" still finds Paracetamol.
    const medicineWords = allWords.filter((word) => !STRENGTH_WORD.test(word));
    const matchesAll = (text, words = allWords) => words.every((word) => text.includes(word));
    const generalMatches = info.filter((item) => matchesAll(item.join(" ").toLocaleLowerCase()));
    // The exact name comes first, then name, alias and brand matches, then matches anywhere in the text.
    const exactName = medicineWords.join(" ");
    const rank = (item) => (item.entry.name.toLocaleLowerCase() === exactName ? 2 : matchesAll(item.nameText, medicineWords) ? 1 : 0);
    let medicineMatches = (medicineWords.length ? medicineIndex.filter((item) => matchesAll(item.fullText, medicineWords)) : allWords.length ? [] : medicineIndex)
      .sort((a, b) => rank(b) - rank(a))
      .map((item) => item.entry);
    // Text such as "Glycomet SR 500 twice daily" falls back to the names and brands it contains.
    if (!medicineMatches.length && query) medicineMatches = bookEntriesFor(query);

    const results = $("infoResults");
    const medicineResults = $("medicineInfoResults");
    $("medicineInfoCount").textContent = query
      ? `${medicineMatches.length} of ${medicineBook.entries.length} medicines match.`
      : `${medicineBook.entries.length} medicines.`;

    if (generalMatches.length === 0 && medicineMatches.length === 0) {
      $("generalInfoHeading").hidden = false;
      results.replaceChildren();
      medicineResults.replaceChildren();
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "muted";
      emptyMessage.textContent = "No matching notes or medicines. Ask a pharmacist for medicine-specific information.";
      results.append(emptyMessage);
      return;
    }

    $("generalInfoHeading").hidden = generalMatches.length === 0;
    results.innerHTML = generalMatches.map((item) => `
      <article class="info-card">
        <span class="tag">${escapeHtml(item[1])}</span>
        <h3>${escapeHtml(item[0])}</h3>
        <p>${escapeHtml(item[2])}</p>
      </article>
    `).join("");
    medicineResults.innerHTML = medicineMatches.map(renderMedicineEntry).join("");
  }

  function renderBookSource() {
    const source = medicineBook.source;
    const sourceLine = $("medicineInfoSource");
    if (!source) {
      $("medicineInfoGroup").hidden = true;
      return;
    }
    const others = Object.entries(medicineBook.sources || {}).filter(([key]) => key !== "tripathi").map(([, book]) => book);
    sourceLine.textContent = `Main source: ${source.author}, ${source.title}, ${source.edition} (${source.publisher}, ${source.year}).`
      + (others.length ? ` Cross-checked with: ${others.map((book) => `${book.author}, ${book.title}, ${book.edition} (${book.year})`).join("; ")}.` : "")
      + " Page numbers are each book's printed pages.";
  }

  function updateReminderStatus() {
    const status = $("reminderStatus");
    if (!("Notification" in window)) {
      status.textContent = "This browser does not support notifications. Your saved medicines are still available.";
      return;
    }
    if (Notification.permission === "granted") {
      status.textContent = "Notifications are allowed. Reminders are checked while MEDAWARE is open.";
    } else if (Notification.permission === "denied") {
      status.textContent = "Notifications are blocked by your browser. Change this site's notification permission in browser settings if you want reminders.";
    } else {
      status.textContent = "Notifications are off until you choose Enable reminders.";
    }
  }

  function reminderWasSent(storageKey, reminderKey) {
    if (notifiedReminders.has(reminderKey)) return true;
    try {
      if (window.localStorage.getItem(storageKey) === reminderKey) {
        notifiedReminders.add(reminderKey);
        return true;
      }
      return false;
    } catch (error) {
      if (!reminderStorageWarningShown) {
        reminderStorageWarningShown = true;
        showToast("Browser storage is unavailable; reminder de-duplication may not survive a refresh.", true);
      }
      return notifiedReminders.has(reminderKey);
    }
  }

  function rememberReminder(storageKey, reminderKey) {
    notifiedReminders.add(reminderKey);
    try {
      window.localStorage.setItem(storageKey, reminderKey);
    } catch (error) {
      if (!reminderStorageWarningShown) {
        reminderStorageWarningShown = true;
        showToast("Browser storage is unavailable; reminder de-duplication may not survive a refresh.", true);
      }
    }
  }

  function checkReminders() {
    if (!user || !("Notification" in window) || Notification.permission !== "granted") return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const today = localDateKey(now);

    medicines.forEach((medicine) => {
      const reminderTime = medicine.reminder_time?.slice(0, 5);
      if (!reminderTime || reminderTime !== time || (medicine.start_date && medicine.start_date > today)) return;

      const storageKey = `medaware-reminder:${user.id}:${medicine.id}`;
      const reminderKey = `${storageKey}:${today}:${time}`;
      if (reminderWasSent(storageKey, reminderKey)) return;

      new Notification("MEDAWARE medication reminder", {
        body: `Scheduled reminder for ${medicine.name}. Follow your prescribed instructions.`
      });
      rememberReminder(storageKey, reminderKey);
    });
  }

  function startReminders() {
    window.clearInterval(reminderTimer);
    updateReminderStatus();
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      checkReminders();
    } catch (error) {
      showUnexpectedError(error);
    }
    reminderTimer = window.setInterval(() => {
      try {
        checkReminders();
      } catch (error) {
        window.clearInterval(reminderTimer);
        reminderTimer = null;
        showUnexpectedError(error);
      }
    }, 15000);
  }

  $("loginTab").addEventListener("click", () => setAuthMode("login"));
  $("signupTab").addEventListener("click", () => setAuthMode("signup"));
  $("authForm").addEventListener("submit", (event) => {
    event.preventDefault();
    withButton($("authSubmit"), submitAuthentication, (error) => {
      showUnexpectedError(error, "authMsg");
    });
  });
  $("signOut").addEventListener("click", () => {
    withButton($("signOut"), async () => {
      const result = await db.auth.signOut();
      if (result.error) {
        showToast(`Could not sign out: ${result.error.message}`, true);
        return;
      }
      showToast("Signed out.");
    }, (error) => showUnexpectedError(error));
  });
  $("medForm").addEventListener("submit", (event) => {
    event.preventDefault();
    withButton($("medForm").querySelector('[type="submit"]'), saveMedicine, (error) => {
      showUnexpectedError(error, "medMsg");
    });
  });
  $("cancelEdit").addEventListener("click", clearMedicineForm);
  $("doseForm").addEventListener("submit", (event) => {
    event.preventDefault();
    withButton($("doseForm").querySelector('[type="submit"]'), saveDoseLog, (error) => {
      showUnexpectedError(error, "doseMsg");
    });
  });
  $("rxForm").addEventListener("submit", (event) => {
    event.preventDefault();
    withButton($("rxForm").querySelector('[type="submit"]'), savePrescription, (error) => {
      showUnexpectedError(error, "rxMsg");
    });
  });
  $("infoSearch").addEventListener("input", (event) => renderInformation(event.target.value.trim()));
  document.querySelectorAll("[data-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-panel]").forEach((navButton) => {
        const active = navButton === button;
        navButton.classList.toggle("active", active);
        navButton.setAttribute("aria-pressed", String(active));
      });
      document.querySelectorAll(".content").forEach((panel) => {
        panel.classList.toggle("hidden", panel.id !== button.dataset.panel);
      });
    });
  });
  $("enableNotifications").addEventListener("click", () => {
    withButton($("enableNotifications"), async () => {
      if (!("Notification" in window)) {
        updateReminderStatus();
        return;
      }
      const permission = await Notification.requestPermission();
      updateReminderStatus();
      if (permission !== "granted") {
        showToast("Notifications were not enabled. You can change this in browser settings.", true);
        return;
      }
      showToast("Reminders enabled while MEDAWARE is open.");
      startReminders();
    }, (error) => showUnexpectedError(error));
  });

  db.auth.onAuthStateChange((event, session) => {
    // A password-reset link that landed here (for example when the reset page is not
    // in Supabase's allowed redirect URLs) must not open the dashboard: send the
    // user to set a new password instead.
    if (event === "PASSWORD_RECOVERY") {
      goToPasswordReset();
      return;
    }
    if (arrivedWithRecoveryLink) return;
    window.setTimeout(() => updateDashboardVisibility(session?.user || null), 0);
  });
  db.auth.getSession().then(({ data, error }) => {
    if (error) {
      showSetupMessage(`Could not restore your session: ${error.message}`);
      return;
    }
    if (arrivedWithRecoveryLink && data.session) {
      goToPasswordReset();
      return;
    }
    updateDashboardVisibility(data.session?.user || null);
  }).catch((error) => {
    showSetupMessage(`Could not restore your session: ${error instanceof Error ? error.message : String(error)}`);
  });

  setAuthMode("login");
  if (window.location.hash === "#account-deleted") {
    setMessage("authMsg", "Your account and all its data have been deleted.");
    window.history.replaceState(null, "", window.location.pathname);
  }
  renderBookSource();
  window.MedawareChat?.mount($("medicineChat"), medicineBook);
  renderInformation();
})();
