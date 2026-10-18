/**
 * MEDAWARE | Profile page (profile.html)
 *
 * - Personal details and self-reported medical records in public.profiles (RLS:
 *   owner only). Saved with the Save profile button.
 * - Gender is saved immediately and switches the theme through js/shared/theme.js.
 * - Profile photo: private "avatars" bucket at <user_id>/avatar, shown through a
 *   signed URL. Medical documents: private "medical-documents" bucket plus a row in
 *   public.medical_documents; opened through signed URLs that expire in 60 seconds.
 * - Everything typed by the user is escaped before it is put into the page.
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const P = window.MEDAWARE_PROFILE; // js/shared/profile-common.js

  function showGate(message) {
    $("profileGate").textContent = message;
    $("profileGate").classList.remove("hidden");
    $("profileApp").classList.add("hidden");
  }

  const client = P.createClient();
  if (!client.db) {
    showGate(client.message);
    return;
  }
  const db = client.db;
  const { describeError, localDateKey, characterCount } = P;

  // Limits mirror the CHECK constraints and bucket settings in supabase/sql/schema.sql.
  const LIMITS = {
    tagLength: 100,
    tagCount: 50,
    surgeryName: 150,
    surgeryCount: 50,
    fileName: 200,
    documentBytes: 5 * 1024 * 1024
  };
  const DOCUMENT_TYPES = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
  const SIGNED_URL_SECONDS = 60;

  let user = null;
  let profile = null; // the last saved profile row (null until one exists)
  let allergies = [];
  let conditions = [];
  let surgeries = [];
  let documents = [];
  let dirty = false;
  let leavingOnPurpose = false;
  let genderRequest = 0;
  let avatarPreviewUrl = null;

  // ---------- Small helpers ----------

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
    $(id).textContent = text || "";
    $(id).classList.toggle("error", isError);
  }

  function showToast(text, isError = false) {
    const toast = $("toast");
    toast.textContent = text;
    toast.classList.remove("hidden");
    toast.classList.toggle("toast-error", isError);
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => toast.classList.add("hidden"), 4000);
  }

  function formatDate(value) {
    if (!value) return "Date not set";
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  }

  function formatSize(bytes) {
    return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  function randomId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  async function withBusy(button, busyText, action) {
    const originalText = button.textContent;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    if (busyText) button.textContent = busyText;
    try {
      await action();
    } catch (error) {
      showToast(describeError(error, "complete that action"), true);
    } finally {
      button.textContent = originalText;
      button.removeAttribute("aria-busy");
      button.disabled = false;
    }
  }

  function markDirty() {
    dirty = true;
    setMessage("saveStatus", "Unsaved changes");
  }

  // ---------- Header: name, photo and gender ----------

  function displayName() {
    return profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "My profile";
  }

  function renderHeader() {
    const name = displayName();
    $("profileName").textContent = name;
    $("profileEmail").textContent = user.email || "";
    $("avatarInitials").textContent = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => [...part][0].toLocaleUpperCase())
      .join("");
  }

  function checkGenderRadio(gender) {
    document.querySelectorAll('input[name="gender"]').forEach((radio) => {
      radio.checked = radio.value === gender;
    });
  }

  async function onGenderChange(event) {
    const gender = event.target.value;
    const previous = profile?.gender ?? null;
    const request = ++genderRequest;
    window.MEDAWARE_THEME?.applyGender(gender); // instant preview across the page
    setMessage("genderMsg", "Saving…");
    try {
      const result = await db
        .from("profiles")
        .upsert({ user_id: user.id, gender }, { onConflict: "user_id" })
        .select("*")
        .single();
      if (request !== genderRequest) return; // a newer choice is in flight
      if (result.error) throw result.error;
      profile = result.data;
      setMessage("genderMsg", "Saved.");
    } catch (error) {
      if (request !== genderRequest) return;
      window.MEDAWARE_THEME?.applyGender(previous);
      checkGenderRadio(previous);
      setMessage("genderMsg", describeError(error, "save your gender"), true);
    }
  }

  function showInitials() {
    $("avatarImg").hidden = true;
    $("avatarImg").removeAttribute("src");
    $("avatarImg").alt = "";
    $("avatarInitials").hidden = false;
  }

  function showPhoto(url) {
    $("avatarImg").src = url;
    $("avatarImg").alt = "Your profile photo";
    $("avatarImg").hidden = false;
    $("avatarInitials").hidden = true;
  }

  async function loadAvatar() {
    $("removePhoto").classList.toggle("hidden", !profile?.avatar_path);
    if (!profile?.avatar_path) {
      showInitials();
      return;
    }
    const url = await P.avatarUrl(db, profile.avatar_path);
    if (url) showPhoto(url);
    else showInitials();
  }

  function setPreview(file) {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    avatarPreviewUrl = file ? URL.createObjectURL(file) : null;
    if (avatarPreviewUrl) showPhoto(avatarPreviewUrl);
  }

  async function onPhotoSelected(event) {
    const file = event.target.files[0];
    event.target.value = ""; // allow choosing the same file again
    if (!file) return;
    const hadPhoto = Boolean(profile?.avatar_path);
    setPreview(file);
    setMessage("photoMsg", "Uploading…");
    await withBusy($("changePhoto"), "Uploading…", async () => {
      const result = await P.uploadAvatar(db, user.id, file, hadPhoto);
      if (result.message) {
        setPreview(null);
        await loadAvatar();
        setMessage("photoMsg", result.message, true);
        return;
      }
      profile = result.profile;
      $("removePhoto").classList.remove("hidden");
      setMessage("photoMsg", "Photo updated.");
    });
  }

  async function onRemovePhoto() {
    if (!profile?.avatar_path) return;
    if (!window.confirm("Remove your profile photo?")) return;
    const path = profile.avatar_path;
    await withBusy($("removePhoto"), "Removing…", async () => {
      // Unlink first, so the profile never points at a missing file.
      const result = await db
        .from("profiles")
        .update({ avatar_path: null })
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (result.error) {
        setMessage("photoMsg", describeError(result.error, "remove your photo"), true);
        return;
      }
      profile = result.data;
      setPreview(null);
      await loadAvatar();
      const removal = await db.storage.from("avatars").remove([path]);
      if (removal.error) {
        console.error("Photo unlinked, but the stored file could not be deleted:", removal.error);
        setMessage("photoMsg", "Photo removed from your profile. The stored copy could not be deleted; try removing it again later.", true);
        return;
      }
      setMessage("photoMsg", "Photo removed.");
    });
  }

  // ---------- Personal details and vitals ----------

  function fillForm() {
    $("fullName").value = profile?.full_name ?? user.user_metadata?.full_name ?? "";
    $("dob").value = profile?.dob ?? "";
    $("dob").max = localDateKey();
    $("surgeryDate").max = localDateKey();
    $("phone").value = profile?.phone ?? "";
    $("emergencyContact").value = profile?.emergency_contact ?? "";
    $("bloodGroup").value = profile?.blood_group ?? "";
    $("height").value = profile?.height ?? "";
    $("weight").value = profile?.weight ?? "";
    allergies = [...(profile?.allergies ?? [])];
    conditions = [...(profile?.conditions ?? [])];
    surgeries = [...(profile?.surgeries ?? [])];
    checkGenderRadio(profile?.gender ?? null);
  }

  function numberField(id, label, min, max, errors) {
    const input = $(id);
    if (input.validity.badInput) {
      errors.push([input, `${label} must be a number.`]);
      return null;
    }
    if (input.value === "") return null;
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < min || value > max) {
      errors.push([input, `${label} must be between ${min} and ${max}.`]);
      return null;
    }
    return Math.round(value * 10) / 10;
  }

  function collectProfile() {
    const errors = [];
    document.querySelectorAll("#profileForm .invalid").forEach((element) => element.classList.remove("invalid"));

    const fullName = $("fullName").value.trim().replace(/\s+/g, " ");
    // Name and date of birth are required: profile setup needs them.
    const nameProblem = P.nameError(fullName, true);
    if (nameProblem) errors.push([$("fullName"), nameProblem]);

    const dob = $("dob").value;
    const dobProblem = P.dobError(dob, true);
    if (dobProblem) errors.push([$("dob"), dobProblem]);

    const phone = $("phone").value.trim();
    const phoneProblem = P.phoneError(phone, "Phone number");
    if (phoneProblem) errors.push([$("phone"), phoneProblem]);
    const emergency = $("emergencyContact").value.trim();
    const emergencyProblem = P.phoneError(emergency, "Emergency contact");
    if (emergencyProblem) errors.push([$("emergencyContact"), emergencyProblem]);

    const bloodGroup = $("bloodGroup").value;
    if (bloodGroup && !P.BLOOD_GROUPS.includes(bloodGroup)) errors.push([$("bloodGroup"), "Choose a blood group from the list."]);

    const height = numberField("height", "Height", 30, 272, errors);
    const weight = numberField("weight", "Weight", 1, 500, errors);

    errors.forEach(([input]) => input.classList.add("invalid"));
    return {
      error: errors[0] || null,
      values: {
        full_name: fullName || null,
        dob: dob || null,
        phone: phone || null,
        emergency_contact: emergency || null,
        blood_group: bloodGroup || null,
        height,
        weight
      }
    };
  }

  async function saveProfile(event) {
    event.preventDefault();
    const { error, values } = collectProfile();
    if (error) {
      setMessage("saveStatus", error[1], true);
      error[0].focus();
      return;
    }
    await withBusy($("saveProfile"), "Saving…", async () => {
      const result = await db
        .from("profiles")
        .upsert({ user_id: user.id, ...values, allergies, conditions, surgeries }, { onConflict: "user_id" })
        .select("*")
        .single();
      if (result.error) {
        setMessage("saveStatus", describeError(result.error, "save your profile"), true);
        return;
      }
      profile = result.data;
      dirty = false;
      renderHeader();
      setMessage("saveStatus", "Saved ✓");
      window.setTimeout(() => {
        if (!dirty) setMessage("saveStatus", "");
      }, 2500);
    });
  }

  // ---------- Allergies, conditions and surgeries ----------

  function renderChips(listId, items, label) {
    $(listId).innerHTML = items.map((item, index) => `
      <li class="chip">
        <span>${escapeHtml(item)}</span>
        <button type="button" data-index="${index}" aria-label="Remove ${escapeHtml(label)}: ${escapeHtml(item)}">×</button>
      </li>
    `).join("");
  }

  function renderSurgeries() {
    $("surgeriesList").innerHTML = surgeries.map((surgery, index) => `
      <li class="record-item">
        <span>
          <span class="record-name">${escapeHtml(surgery.name)}</span><br>
          <span class="record-date">${escapeHtml(formatDate(surgery.date))}</span>
        </span>
        <button type="button" class="danger" data-index="${index}" aria-label="Remove procedure: ${escapeHtml(surgery.name)}">Remove</button>
      </li>
    `).join("");
  }

  function renderRecords() {
    renderChips("allergiesList", allergies, "allergy");
    renderChips("conditionsList", conditions, "condition");
    renderSurgeries();
  }

  function addTag(items, inputId, label) {
    const input = $(inputId);
    const value = input.value.trim().replace(/\s+/g, " ");
    if (!value) {
      setMessage("recordsMsg", `Type the ${label} first.`, true);
      input.focus();
      return;
    }
    if (characterCount(value) > LIMITS.tagLength) {
      setMessage("recordsMsg", `Each ${label} must be ${LIMITS.tagLength} characters or fewer.`, true);
      return;
    }
    if (items.length >= LIMITS.tagCount) {
      setMessage("recordsMsg", `You can list up to ${LIMITS.tagCount} entries.`, true);
      return;
    }
    if (items.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      setMessage("recordsMsg", `“${value}” is already listed.`, true);
      return;
    }
    items.push(value);
    input.value = "";
    setMessage("recordsMsg", "");
    renderRecords();
    markDirty();
    input.focus();
  }

  function addSurgery() {
    const name = $("surgeryName").value.trim().replace(/\s+/g, " ");
    const date = $("surgeryDate").value || null;
    if (!name) {
      setMessage("recordsMsg", "Type the procedure name first.", true);
      $("surgeryName").focus();
      return;
    }
    if (characterCount(name) > LIMITS.surgeryName) {
      setMessage("recordsMsg", `Procedure names must be ${LIMITS.surgeryName} characters or fewer.`, true);
      return;
    }
    if (date && (date < "1900-01-01" || date > localDateKey())) {
      setMessage("recordsMsg", "The procedure date must be between 1900 and today.", true);
      return;
    }
    if (surgeries.length >= LIMITS.surgeryCount) {
      setMessage("recordsMsg", `You can list up to ${LIMITS.surgeryCount} procedures.`, true);
      return;
    }
    surgeries.push({ name, date });
    // Newest first; undated entries last.
    surgeries.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    $("surgeryName").value = "";
    $("surgeryDate").value = "";
    setMessage("recordsMsg", "");
    renderRecords();
    markDirty();
  }

  // Takes a getter: the lists are replaced when the profile loads.
  function onRemoveFrom(getItems) {
    return (event) => {
      const button = event.target.closest("button[data-index]");
      if (!button) return;
      getItems().splice(Number(button.dataset.index), 1);
      renderRecords();
      markDirty();
    };
  }

  // ---------- Current medications (read-only, from the medicines table) ----------

  function renderMedications(medicines, error) {
    const list = $("medicationsList");
    if (error) {
      list.dataset.empty = describeError(error, "load your medicines");
      list.replaceChildren();
      return;
    }
    list.innerHTML = medicines.map((medicine) => `
      <li class="medication-chip">
        <span class="med-icon" aria-hidden="true">💊</span>
        <span>
          <span class="med-name">${escapeHtml(medicine.name)}</span><br>
          <span class="med-dose">${escapeHtml(medicine.dose_instructions || "Dose not entered")}</span>
        </span>
      </li>
    `).join("");
  }

  // ---------- Medical documents ----------

  function renderDocuments() {
    $("documentsList").innerHTML = documents.map((doc) => `
      <li class="doc-card">
        <span class="doc-icon" aria-hidden="true">${doc.mime_type === "application/pdf" ? "📄" : "🖼️"}</span>
        <span class="doc-name">${escapeHtml(doc.file_name)}</span>
        <span class="doc-meta">${escapeHtml(new Date(doc.created_at).toLocaleDateString())} · ${escapeHtml(formatSize(doc.size_bytes))}</span>
        <span class="doc-actions">
          <button type="button" data-action="view" data-id="${escapeHtml(doc.id)}">View</button>
          <button type="button" data-action="download" data-id="${escapeHtml(doc.id)}">Download</button>
          <button type="button" class="danger" data-action="delete" data-id="${escapeHtml(doc.id)}"
            aria-label="Delete ${escapeHtml(doc.file_name)}">Delete</button>
        </span>
      </li>
    `).join("");
  }

  async function onDocumentSelected(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    const extension = DOCUMENT_TYPES[file.type];
    if (!extension) {
      setMessage("documentsMsg", "Choose a PDF, JPG or PNG file.", true);
      return;
    }
    if (file.size === 0 || file.size > LIMITS.documentBytes) {
      setMessage("documentsMsg", file.size === 0 ? "That file is empty." : "That file is larger than 5 MB.", true);
      return;
    }

    const path = `${user.id}/${randomId()}.${extension}`;
    const fileName = [...file.name.trim()].slice(0, LIMITS.fileName).join("") || `document.${extension}`;
    setMessage("documentsMsg", `Uploading ${fileName}…`);
    await withBusy($("uploadDocument"), null, async () => {
      const upload = await db.storage.from("medical-documents").upload(path, file, { contentType: file.type, upsert: false });
      if (upload.error) {
        setMessage("documentsMsg", describeError(upload.error, "upload that document"), true);
        return;
      }
      const result = await db
        .from("medical_documents")
        .insert({ user_id: user.id, storage_path: path, file_name: fileName, mime_type: file.type, size_bytes: file.size })
        .select("*")
        .single();
      if (result.error) {
        // The record failed, so remove the uploaded file rather than leave it orphaned.
        const cleanup = await db.storage.from("medical-documents").remove([path]);
        if (cleanup.error) console.error("Could not remove the unrecorded upload:", path, cleanup.error);
        setMessage("documentsMsg", describeError(result.error, "save that document"), true);
        return;
      }
      documents.unshift(result.data);
      renderDocuments();
      setMessage("documentsMsg", `Uploaded ${fileName}.`);
    });
  }

  async function openDocument(doc, download) {
    // Open the tab inside the click handler, before any await, so pop-up blockers allow it.
    const tab = download ? null : window.open("", "_blank");
    const { data, error } = await db.storage
      .from("medical-documents")
      .createSignedUrl(doc.storage_path, SIGNED_URL_SECONDS, download ? { download: doc.file_name } : undefined);
    if (error) {
      tab?.close();
      setMessage("documentsMsg", describeError(error, "open that document"), true);
      return;
    }
    if (tab) {
      tab.opener = null;
      tab.location.href = data.signedUrl;
      return;
    }
    leavingOnPurpose = true; // a download, not leaving the page
    window.location.assign(data.signedUrl);
    window.setTimeout(() => {
      leavingOnPurpose = false;
    }, 1000);
  }

  async function deleteDocument(doc, button) {
    if (!window.confirm(`Delete “${doc.file_name}”? This cannot be undone.`)) return;
    await withBusy(button, "Deleting…", async () => {
      // Remove the record first: if the file deletion then fails, nothing points at it.
      const result = await db.from("medical_documents").delete().eq("id", doc.id).select("id");
      if (result.error) {
        setMessage("documentsMsg", describeError(result.error, "delete that document"), true);
        return;
      }
      documents = documents.filter((item) => item.id !== doc.id);
      renderDocuments();
      if (!result.data?.length) {
        setMessage("documentsMsg", "That document was already deleted.");
        return;
      }
      const removal = await db.storage.from("medical-documents").remove([doc.storage_path]);
      if (removal.error) {
        console.error("Document record deleted, but the stored file could not be:", doc.storage_path, removal.error);
        setMessage("documentsMsg", "Document deleted from your list. The stored file could not be removed and is no longer linked.", true);
        return;
      }
      setMessage("documentsMsg", `Deleted ${doc.file_name}.`);
    });
  }

  function onDocumentAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const doc = documents.find((item) => item.id === button.dataset.id);
    if (!doc) return;
    if (button.dataset.action === "delete") deleteDocument(doc, button);
    else openDocument(doc, button.dataset.action === "download");
  }

  // ---------- Loading ----------

  async function loadAll() {
    const [profileResult, medicinesResult, documentsResult] = await Promise.all([
      db.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      db.from("medicines").select("id, name, dose_instructions").order("name", { ascending: true }),
      db.from("medical_documents").select("*").order("created_at", { ascending: false })
    ]);

    if (profileResult.error) {
      showGate(describeError(profileResult.error, "load your profile"));
      return;
    }
    profile = profileResult.data;
    if (!P.isComplete(profile)) {
      // New or incomplete profile: onboarding comes first.
      leavingOnPurpose = true;
      window.location.replace("profile-setup.html");
      return;
    }
    window.MEDAWARE_THEME?.applyGender(profile?.gender ?? null);

    renderHeader();
    fillForm();
    renderRecords();
    renderMedications(medicinesResult.data || [], medicinesResult.error);

    if (documentsResult.error) {
      $("documentsList").dataset.empty = describeError(documentsResult.error, "load your documents");
    } else {
      documents = documentsResult.data || [];
      renderDocuments();
    }

    $("profileGate").classList.add("hidden");
    $("profileApp").classList.remove("hidden");
    await loadAvatar();
  }

  // ---------- Events ----------

  $("profileForm").addEventListener("submit", saveProfile);
  $("profileForm").addEventListener("input", (event) => {
    if (event.target.closest(".add-row")) return; // typing a new tag is not a change yet
    markDirty();
  });
  document.querySelectorAll('input[name="gender"]').forEach((radio) => radio.addEventListener("change", onGenderChange));

  $("changePhoto").addEventListener("click", () => $("photoInput").click());
  $("photoInput").addEventListener("change", onPhotoSelected);
  $("removePhoto").addEventListener("click", onRemovePhoto);

  $("addAllergy").addEventListener("click", () => addTag(allergies, "allergyInput", "allergy"));
  $("addCondition").addEventListener("click", () => addTag(conditions, "conditionInput", "condition"));
  $("addSurgery").addEventListener("click", addSurgery);
  // Enter in an "add" field adds the entry instead of submitting the whole form.
  [["allergyInput", () => addTag(allergies, "allergyInput", "allergy")],
    ["conditionInput", () => addTag(conditions, "conditionInput", "condition")],
    ["surgeryName", addSurgery],
    ["surgeryDate", addSurgery]].forEach(([id, add]) => {
    $(id).addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      add();
    });
  });
  $("allergiesList").addEventListener("click", onRemoveFrom(() => allergies));
  $("conditionsList").addEventListener("click", onRemoveFrom(() => conditions));
  $("surgeriesList").addEventListener("click", onRemoveFrom(() => surgeries));

  $("uploadDocument").addEventListener("click", () => $("documentInput").click());
  $("documentInput").addEventListener("change", onDocumentSelected);
  $("documentsList").addEventListener("click", onDocumentAction);

  $("signOut").addEventListener("click", () => {
    if (dirty && !window.confirm("You have unsaved changes. Sign out anyway?")) return;
    withBusy($("signOut"), "Signing out…", async () => {
      const result = await db.auth.signOut();
      if (result.error) {
        showToast(describeError(result.error, "sign out"), true);
        return;
      }
      leavingOnPurpose = true;
      window.MEDAWARE_THEME?.reset();
      window.location.replace("index.html");
    });
  });

  // ---------- Delete account ----------

  $("deleteForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const password = $("deletePassword").value;
    if ($("deleteConfirm").value.trim() !== "DELETE") {
      setMessage("deleteMsg", "Type DELETE in capital letters to confirm.", true);
      return;
    }
    if (!password) {
      setMessage("deleteMsg", "Enter your password.", true);
      return;
    }
    withBusy($("deleteAccount"), "Deleting…", async () => {
      setMessage("deleteMsg", "");
      // Re-check the password so an unattended signed-in device cannot delete the account.
      const check = await db.auth.signInWithPassword({ email: user.email, password });
      if (check.error) {
        setMessage("deleteMsg", "That password is not correct.", true);
        return;
      }
      const { error } = await db.functions.invoke("delete-account", { body: { confirm: "DELETE" } });
      if (error) {
        let message = "Your account could not be deleted. Try again, or contact us.";
        try {
          message = (await error.context?.json())?.error || message;
        } catch {
          // Keep the general message.
        }
        setMessage("deleteMsg", message, true);
        return;
      }
      leavingOnPurpose = true;
      user = null; // the auth listener must not treat this as an ordinary sign-out
      await db.auth.signOut({ scope: "local" }).catch(() => {});
      window.MEDAWARE_THEME?.reset();
      window.location.replace("index.html#account-deleted");
    });
  });

  // Keyboard focus must not land behind the fixed save bar. CSS scroll-padding covers
  // this in some browsers; Chrome ignores it for focus scrolling, so nudge the page.
  // Measured a frame later, after the browser's own scroll-to-focus has happened.
  document.addEventListener("focusin", (event) => {
    const bar = document.querySelector(".save-bar");
    if (!bar || bar.contains(event.target)) return;
    window.requestAnimationFrame(() => {
      const hiddenBy = event.target.getBoundingClientRect().bottom - bar.getBoundingClientRect().top + 12;
      // "instant": style.css sets smooth scrolling, which would lag behind the focus.
      if (hiddenBy > 0) window.scrollBy({ top: hiddenBy, behavior: "instant" });
    });
  });

  window.addEventListener("beforeunload", (event) => {
    if (!dirty || leavingOnPurpose) return;
    event.preventDefault();
    event.returnValue = "";
  });

  // ---------- Start ----------

  db.auth.onAuthStateChange((_event, session) => {
    if (!session && user) {
      // Signed out here or in another tab.
      leavingOnPurpose = true;
      window.MEDAWARE_THEME?.reset();
      window.location.replace("index.html");
    }
  });

  db.auth.getSession().then(async ({ data, error }) => {
    if (error) {
      showGate("Could not restore your session. Refresh the page to try again.");
      return;
    }
    if (!data.session) {
      window.location.replace("index.html");
      return;
    }
    user = data.session.user;
    await loadAll();
  }).catch((error) => {
    showGate(describeError(error, "load your profile"));
  });
})();
