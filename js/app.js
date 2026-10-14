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

  function showUnexpectedError(error, messageId) {
    const message = error instanceof Error ? error.message : String(error);
    if (messageId) {
      setMessage(messageId, `Request failed: ${message}`, true);
    } else {
      showToast(`Request failed: ${message}`, true);
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

  async function submitAuthentication() {
    const email = $("email").value.trim();
    const password = $("password").value;
    const result = authMode === "login"
      ? await db.auth.signInWithPassword({ email, password })
      : await db.auth.signUp({ email, password });

    if (result.error) {
      setMessage("authMsg", result.error.message, true);
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
    $("auth").classList.toggle("hidden", Boolean(user));
    $("app").classList.toggle("hidden", !user);
    $("signOut").classList.toggle("hidden", !user);

    if (!user) {
      window.clearInterval(reminderTimer);
      reminderTimer = null;
      clearAccountData();
      $("medList").textContent = "Log in to load medicines.";
      $("rxList").textContent = "Log in to load prescription records.";
      $("userEmail").textContent = "";
      return;
    }

    $("userEmail").textContent = user.email || "";
    updateReminderStatus();
    if (nextUserId !== previousUserId) {
      clearAccountData();
      loadRecords();
      startReminders();
    }
  }

  function clearAccountData() {
    medicines = [];
    prescriptions = [];
    logs = [];
    clearMedicineForm();
    $("rxForm").reset();
    $("doseForm").reset();
    $("doseList").replaceChildren();
    renderMedicineOptions();
    renderStatistics();
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

    try {
      const [medicineResult, prescriptionResult, doseResult] = await Promise.all([
        db.from("medicines").select("*").order("created_at", { ascending: false }),
        db.from("prescriptions").select("*").order("created_at", { ascending: false }),
        db.from("dose_logs")
          .select("*")
          .gte("taken_at", dayStart.toISOString())
          .lt("taken_at", dayEnd.toISOString())
          .order("taken_at", { ascending: false })
      ]);

      if (user?.id !== requestedUserId) return;
      const error = medicineResult.error || prescriptionResult.error || doseResult.error;
      if (error) {
        showLoadError();
        showToast(`Could not load records: ${error.message}`, true);
        return;
      }

      medicines = medicineResult.data || [];
      prescriptions = prescriptionResult.data || [];
      logs = doseResult.data || [];
      renderMedicines();
      renderPrescriptions();
      renderDoseLogs();
      renderStatistics();
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

  async function saveMedicine() {
    if (!user) return;
    const id = $("medId").value;
    const name = $("medName").value.trim();
    if (!name) {
      setMessage("medMsg", "Enter a medicine name.", true);
      return;
    }
    const payload = {
      user_id: user.id,
      name,
      dose_instructions: $("dose").value.trim() || null,
      frequency: $("frequency").value.trim() || null,
      reminder_time: $("reminder").value || null,
      start_date: $("startDate").value || null,
      notes: $("medNotes").value.trim() || null
    };
    const query = id
      ? db.from("medicines").update(payload).eq("id", id)
      : db.from("medicines").insert(payload);
    const result = await query;
    if (result.error) {
      setMessage("medMsg", result.error.message, true);
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
        const result = await db.from("medicines").delete().eq("id", id);
        if (result.error) {
          showToast(`Could not delete medicine: ${result.error.message}`, true);
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
          <button type="button" data-edit="${escapeHtml(medicine.id)}">Edit</button>
          <button type="button" class="danger" data-delete-medicine="${escapeHtml(medicine.id)}">Delete</button>
        </div>
      </article>
    `).join("");

    list.querySelectorAll("[data-edit]").forEach((button) => {
      button.addEventListener("click", () => beginMedicineEdit(button.dataset.edit));
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
    const [hours, minutes] = $("doseTime").value.split(":").map(Number);
    const takenAt = new Date();
    takenAt.setHours(hours, minutes, 0, 0);
    const result = await db.from("dose_logs").insert({
      user_id: user.id,
      medicine_id: $("doseMedicine").value,
      taken_at: takenAt.toISOString()
    });

    if (result.error) {
      setMessage("doseMsg", result.error.message, true);
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

  async function savePrescription() {
    if (!user) return;
    const title = $("rxTitle").value.trim();
    if (!title) {
      setMessage("rxMsg", "Enter a prescription title.", true);
      return;
    }
    const result = await db.from("prescriptions").insert({
      user_id: user.id,
      title,
      prescription_date: $("rxDate").value || null,
      doctor_or_clinic: $("rxDoctor").value.trim() || null,
      notes: $("rxNotes").value.trim() || null
    });

    if (result.error) {
      setMessage("rxMsg", result.error.message, true);
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
        const result = await db.from("prescriptions").delete().eq("id", id);
        if (result.error) {
          showToast(`Could not delete prescription: ${result.error.message}`, true);
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

  function renderInformation(query = "") {
    const normalizedQuery = query.toLocaleLowerCase();
    const matches = info.filter((item) => item.join(" ").toLocaleLowerCase().includes(normalizedQuery));
    const results = $("infoResults");
    if (matches.length === 0) {
      results.replaceChildren();
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "muted";
      emptyMessage.textContent = "No matching notes. Ask a pharmacist for medicine-specific information.";
      results.append(emptyMessage);
      return;
    }

    results.innerHTML = matches.map((item) => `
      <article class="info-card">
        <span class="tag">${escapeHtml(item[1])}</span>
        <h3>${escapeHtml(item[0])}</h3>
        <p>${escapeHtml(item[2])}</p>
      </article>
    `).join("");
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

  db.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => updateDashboardVisibility(session?.user || null), 0);
  });
  db.auth.getSession().then(({ data, error }) => {
    if (error) {
      showSetupMessage(`Could not restore your session: ${error.message}`);
      return;
    }
    updateDashboardVisibility(data.session?.user || null);
  }).catch((error) => {
    showSetupMessage(`Could not restore your session: ${error instanceof Error ? error.message : String(error)}`);
  });

  setAuthMode("login");
  renderInformation();
})();
