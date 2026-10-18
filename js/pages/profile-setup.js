/**
 * MEDAWARE | First-time profile setup (profile-setup.html)
 *
 * New users land here after sign-up, and js/pages/app.js sends anyone whose profile is
 * incomplete (no name, date of birth or gender) here before the dashboard.
 * Step 1: photo (optional), full name, date of birth, gender.
 * Step 2: blood group, phone, emergency contact (all optional).
 * Save & continue writes only these fields, so existing records are never wiped,
 * then opens the dashboard. There is no skip; signing out is always possible.
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const P = window.MEDAWARE_PROFILE; // js/shared/profile-common.js

  function showGate(message) {
    $("setupGate").textContent = message;
    $("setupGate").classList.remove("hidden");
    $("setupApp").classList.add("hidden");
  }

  const client = P.createClient();
  if (!client.db) {
    showGate(client.message);
    return;
  }
  const db = client.db;

  let user = null;
  let profile = null;
  let avatarPreviewUrl = null;

  function setMessage(id, text, isError = false) {
    $(id).textContent = text || "";
    $(id).classList.toggle("error", isError);
  }

  function selectedGender() {
    return document.querySelector('input[name="gender"]:checked')?.value ?? null;
  }

  function clearInvalid() {
    document.querySelectorAll("#setupForm .invalid").forEach((element) => element.classList.remove("invalid"));
  }

  function fail(element, message) {
    element.classList.add("invalid");
    setMessage("setupMsg", message, true);
    (element.matches("fieldset") ? element.querySelector("input") : element).focus();
    return false;
  }

  // ---------- Steps ----------

  function validateStepOne() {
    clearInvalid();
    const fullName = $("fullName").value.trim().replace(/\s+/g, " ");
    const nameProblem = P.nameError(fullName, true);
    if (nameProblem) return fail($("fullName"), nameProblem);
    const dobProblem = P.dobError($("dob").value, true);
    if (dobProblem) return fail($("dob"), dobProblem);
    if (!P.GENDERS.includes(selectedGender())) return fail($("genderField"), "Choose a gender option, or “Prefer not to say”.");
    setMessage("setupMsg", "");
    return true;
  }

  function validateStepTwo() {
    clearInvalid();
    const bloodGroup = $("bloodGroup").value;
    if (bloodGroup && !P.BLOOD_GROUPS.includes(bloodGroup)) return fail($("bloodGroup"), "Choose a blood group from the list.");
    for (const [id, label] of [["phone", "Phone number"], ["emergencyContact", "Emergency contact"]]) {
      const problem = P.phoneError($(id).value.trim(), label);
      if (problem) return fail($(id), problem);
    }
    setMessage("setupMsg", "");
    return true;
  }

  function goToStep(step) {
    $("step1").hidden = step !== 1;
    $("step2").hidden = step !== 2;
    document.querySelectorAll(".setup-steps .step").forEach((element) => {
      const number = Number(element.dataset.step);
      element.classList.toggle("active", number <= step);
      if (number === step) element.setAttribute("aria-current", "step");
      else element.removeAttribute("aria-current");
    });
    // Move focus to the first field of the new step for keyboard and screen-reader users.
    (step === 1 ? $("fullName") : $("bloodGroup")).focus();
  }

  // ---------- Photo ----------

  function renderInitials() {
    const name = $("fullName").value.trim() || user.email || "";
    $("avatarInitials").textContent = name
      .split(/[\s@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => [...part][0].toLocaleUpperCase())
      .join("");
  }

  function showPhoto(url) {
    $("avatarImg").src = url;
    $("avatarImg").alt = "Your profile photo";
    $("avatarImg").hidden = false;
    $("avatarInitials").hidden = true;
    $("changePhoto").textContent = "Change photo";
  }

  function showInitials() {
    $("avatarImg").hidden = true;
    $("avatarImg").removeAttribute("src");
    $("avatarInitials").hidden = false;
    renderInitials();
  }

  async function onPhotoSelected(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    avatarPreviewUrl = URL.createObjectURL(file);
    showPhoto(avatarPreviewUrl);
    setMessage("photoMsg", "Uploading…");
    $("changePhoto").disabled = true;
    try {
      const result = await P.uploadAvatar(db, user.id, file, Boolean(profile?.avatar_path));
      if (result.message) {
        const url = await P.avatarUrl(db, profile?.avatar_path);
        if (url) showPhoto(url);
        else showInitials();
        setMessage("photoMsg", result.message, true);
        return;
      }
      profile = result.profile;
      setMessage("photoMsg", "Photo added.");
    } catch (error) {
      showInitials();
      setMessage("photoMsg", P.describeError(error, "upload your photo"), true);
    } finally {
      $("changePhoto").disabled = false;
    }
  }

  // ---------- Save ----------

  async function saveAndContinue(event) {
    event.preventDefault();
    if (!validateStepOne()) {
      goToStep(1);
      validateStepOne(); // re-show the message and focus after switching steps
      return;
    }
    if (!validateStepTwo()) return;

    const button = $("saveContinue");
    button.disabled = true;
    button.textContent = "Saving…";
    try {
      // Only the fields on this page: allergies, documents etc. are left untouched.
      const result = await db
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: $("fullName").value.trim().replace(/\s+/g, " "),
          dob: $("dob").value,
          gender: selectedGender(),
          blood_group: $("bloodGroup").value || null,
          phone: $("phone").value.trim() || null,
          emergency_contact: $("emergencyContact").value.trim() || null
        }, { onConflict: "user_id" })
        .select("*")
        .single();
      if (result.error) {
        setMessage("setupMsg", P.describeError(result.error, "save your profile"), true);
        return;
      }
      window.MEDAWARE_THEME?.applyGender(result.data.gender);
      setMessage("setupMsg", "");
      window.location.replace("index.html");
    } catch (error) {
      setMessage("setupMsg", P.describeError(error, "save your profile"), true);
    } finally {
      button.disabled = false;
      button.textContent = "Save & continue →";
    }
  }

  // ---------- Loading ----------

  async function load() {
    const result = await db.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    if (result.error) {
      showGate(P.describeError(result.error, "load your profile"));
      return;
    }
    profile = result.data;
    if (P.isComplete(profile)) {
      // Already set up: future visits go straight to the dashboard.
      window.location.replace("index.html");
      return;
    }

    $("fullName").value = profile?.full_name ?? user.user_metadata?.full_name ?? "";
    $("dob").value = profile?.dob ?? "";
    $("dob").max = P.localDateKey();
    $("bloodGroup").value = profile?.blood_group ?? "";
    $("phone").value = profile?.phone ?? "";
    $("emergencyContact").value = profile?.emergency_contact ?? "";
    document.querySelectorAll('input[name="gender"]').forEach((radio) => {
      radio.checked = radio.value === profile?.gender;
    });
    window.MEDAWARE_THEME?.applyGender(profile?.gender ?? null);

    $("setupGate").classList.add("hidden");
    $("setupApp").classList.remove("hidden");
    const url = await P.avatarUrl(db, profile?.avatar_path);
    if (url) showPhoto(url);
    else showInitials();
    $("fullName").focus();
  }

  // ---------- Events ----------

  $("nextStep").addEventListener("click", () => {
    if (validateStepOne()) goToStep(2);
  });
  $("prevStep").addEventListener("click", () => {
    setMessage("setupMsg", "");
    goToStep(1);
  });
  $("setupForm").addEventListener("submit", saveAndContinue);
  // Enter on step 1 means "Next", not "save the whole form".
  $("step1").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.target.matches("button")) return;
    event.preventDefault();
    if (validateStepOne()) goToStep(2);
  });
  $("fullName").addEventListener("input", () => {
    if ($("avatarImg").hidden) renderInitials();
  });
  // Preview the theme as soon as a gender is picked; it is saved with the profile.
  document.querySelectorAll('input[name="gender"]').forEach((radio) => {
    radio.addEventListener("change", () => window.MEDAWARE_THEME?.applyGender(radio.value));
  });
  $("changePhoto").addEventListener("click", () => $("photoInput").click());
  $("photoInput").addEventListener("change", onPhotoSelected);

  $("signOut").addEventListener("click", async () => {
    $("signOut").disabled = true;
    try {
      await db.auth.signOut();
    } finally {
      window.MEDAWARE_THEME?.reset();
      window.location.replace("index.html");
    }
  });

  // ---------- Start ----------

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
    await load();
  }).catch((error) => {
    showGate(P.describeError(error, "load your profile"));
  });
})();
