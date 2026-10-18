/**
 * MEDAWARE | Set a new password (reset-password.html)
 *
 * Opened from the reset email. Supabase puts a one-time session in the link, which
 * supabase-js picks up automatically. The form is only offered for a genuine reset
 * link (marked in sessionStorage so a refresh still works): an ordinary signed-in
 * session is not enough, so nobody can change the password of an unattended,
 * signed-in computer without the email.
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const RECOVERY_FLAG = "medaware_password_recovery"; // also set by js/pages/app.js
  const MIN_LENGTH = 8;
  const MAX_LENGTH = 72; // Supabase Auth limit

  // Read the link before supabase-js consumes and clears it.
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const queryParams = new URLSearchParams(window.location.search);
  const linkErrorCode = hashParams.get("error_code") || queryParams.get("error_code");
  const linkError = hashParams.get("error") || queryParams.get("error");
  const isRecoveryLink = hashParams.get("type") === "recovery";

  function storage(action) {
    try {
      return action(window.sessionStorage);
    } catch {
      return null;
    }
  }
  if (isRecoveryLink) storage((s) => s.setItem(RECOVERY_FLAG, "1"));

  function show(view) {
    ["checkingView", "formView", "doneView", "invalidView"].forEach((id) => {
      $(id).hidden = id !== view;
    });
    const title = { doneView: "doneTitle", invalidView: "invalidTitle" }[view];
    if (title) $(title).focus();
    if (view === "formView") $("newPassword").focus();
  }

  function showMessage(text) {
    $("resetMsg").textContent = text;
    $("resetMsg").hidden = !text;
  }

  function invalid(reason) {
    if (reason) $("invalidReason").textContent = reason;
    show("invalidView");
  }

  const client = window.MEDAWARE_PROFILE.createClient();
  if (!client.db) {
    invalid(client.message);
    return;
  }
  const db = client.db;

  db.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") storage((s) => s.setItem(RECOVERY_FLAG, "1"));
  });

  // ---------- Strength meter (guidance only; Supabase enforces the project's rules) ----------

  function strength(password) {
    if (!password) return { score: 0, label: "" };
    let score = 0;
    if (password.length >= MIN_LENGTH) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
    if (password.length >= 16) score = Math.max(score, 3);
    if (password.length < MIN_LENGTH) score = 1;
    return { score, label: ["", "Weak", "Fair", "Good", "Strong"][score] };
  }

  $("newPassword").addEventListener("input", () => {
    const { score, label } = strength($("newPassword").value);
    const meter = $("strengthFill").parentElement.parentElement;
    meter.className = `password-strength strength-${score}`;
    $("strengthText").textContent = label ? `Strength: ${label}` : "";
  });

  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
      const input = $(button.dataset.target);
      const reveal = input.type === "password";
      input.type = reveal ? "text" : "password";
      button.textContent = reveal ? "Hide" : "Show";
      button.setAttribute("aria-pressed", String(reveal));
    });
  });

  // ---------- Update ----------

  function describe(error) {
    console.error("Password update failed:", error);
    const text = `${error?.message || ""}`;
    if (/failed to fetch|networkerror|network request failed|load failed/i.test(text)) {
      return "Could not reach the server. Check your internet connection and try again.";
    }
    if (error?.code === "same_password" || /different from the old/i.test(text)) {
      return "Choose a password that is different from your current one.";
    }
    if (error?.code === "weak_password" || /weak|password should/i.test(text)) {
      // Supabase's own message lists the project's password requirements.
      return text || "That password is too weak. Choose a longer one.";
    }
    return "Could not update your password. Please try again.";
  }

  $("resetForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = $("newPassword").value;
    const confirmation = $("confirmPassword").value;
    if (password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
      showMessage(`Your password must be ${MIN_LENGTH} to ${MAX_LENGTH} characters long.`);
      $("newPassword").focus();
      return;
    }
    if (password !== confirmation) {
      showMessage("The two passwords don't match.");
      $("confirmPassword").focus();
      return;
    }

    const button = $("updatePassword");
    button.disabled = true;
    button.textContent = "Updating…";
    showMessage("");
    try {
      const { data } = await db.auth.getSession();
      if (!data.session) {
        invalid("Your reset session has ended. Request a new link to try again.");
        return;
      }
      const { error } = await db.auth.updateUser({ password });
      if (error) {
        if (error.status === 401 || /jwt|session/i.test(error.message || "")) {
          invalid("Your reset session has ended. Request a new link to try again.");
          return;
        }
        showMessage(describe(error));
        return;
      }
      storage((s) => s.removeItem(RECOVERY_FLAG));
      // Sign out everywhere so any other device has to use the new password.
      const signOut = await db.auth.signOut({ scope: "global" });
      if (signOut.error) {
        console.error("Signed out locally only:", signOut.error);
        await db.auth.signOut({ scope: "local" });
      }
      window.MEDAWARE_THEME?.reset();
      $("resetForm").reset();
      show("doneView");
    } catch (error) {
      showMessage(describe(error));
    } finally {
      button.disabled = false;
      button.textContent = "Update password";
    }
  });

  // ---------- Start: decide whether this link may be used ----------

  if (linkError || linkErrorCode) {
    window.history.replaceState(null, "", window.location.pathname);
    invalid(linkErrorCode === "otp_expired"
      ? "This reset link has expired or was already used. Links work once and expire after 1 hour."
      : "This reset link is not valid. Request a new one.");
    return;
  }

  db.auth.getSession().then(({ data, error }) => {
    const markedRecovery = storage((s) => s.getItem(RECOVERY_FLAG)) === "1";
    if (error || !data.session || !markedRecovery) {
      storage((s) => s.removeItem(RECOVERY_FLAG));
      invalid();
      return;
    }
    show("formView");
  }).catch((error) => {
    console.error("Could not check the reset link:", error);
    invalid("We couldn't check this link. Check your connection, then request a new link if needed.");
  });
})();
