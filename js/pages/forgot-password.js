/**
 * MEDAWARE | Forgot password (forgot-password.html)
 * Asks Supabase Auth to email a reset link (delivered through the project's custom
 * SMTP provider, Brevo). The confirmation never says whether the address has an
 * account, so the page cannot be used to discover who uses MEDAWARE.
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const RESEND_COOLDOWN_SECONDS = 60; // matches the minimum interval set for the SMTP sender
  let lastEmail = "";
  let cooldownTimer = null;

  function showMessage(text, kind = "error") {
    $("forgotMsg").textContent = text;
    $("forgotMsg").classList.toggle("info", kind === "info");
    $("forgotMsg").hidden = !text;
  }

  const client = window.MEDAWARE_PROFILE.createClient();
  if (!client.db) {
    showMessage(client.message);
    $("sendLink").disabled = true;
    return;
  }
  const db = client.db;

  function describe(error) {
    console.error("Password reset request failed:", error);
    const text = `${error?.message || ""}`;
    if (/failed to fetch|networkerror|network request failed|load failed/i.test(text)) {
      return "Could not reach the server. Check your internet connection and try again.";
    }
    if (error?.status === 429 || /rate limit|security purposes|too many/i.test(text)) {
      return "Too many reset requests. Please wait a minute and try again.";
    }
    if (/sending|smtp|email/i.test(text)) {
      return "We couldn't send the email right now. Please try again in a few minutes.";
    }
    return "Something went wrong. Please try again.";
  }

  function startCooldown() {
    let remaining = RESEND_COOLDOWN_SECONDS;
    const button = $("sendAgain");
    button.disabled = true;
    window.clearInterval(cooldownTimer);
    const tick = () => {
      button.textContent = remaining > 0 ? `Send again (${remaining}s)` : "Send again";
      if (remaining <= 0) {
        button.disabled = false;
        window.clearInterval(cooldownTimer);
      }
      remaining -= 1;
    };
    tick();
    cooldownTimer = window.setInterval(tick, 1000);
  }

  const captcha = window.MEDAWARE_CAPTCHA?.mount($("forgotCaptcha")) ?? { getToken: async () => undefined, reset() {} };

  async function requestLink(email, button, busyText) {
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = busyText;
    showMessage("");
    try {
      const captchaToken = await captcha.getToken();
      const { error } = await db.auth.resetPasswordForEmail(email, {
        // Relative to this page, so it also works when the site lives in a sub-folder.
        redirectTo: new URL("reset-password.html", window.location.href).href,
        captchaToken
      });
      if (error) throw error;
      lastEmail = email;
      $("sentEmail").textContent = email;
      $("requestView").hidden = true;
      $("sentView").hidden = false;
      $("sentTitle").focus();
      startCooldown();
      return true;
    } catch (error) {
      showMessage(window.MEDAWARE_CAPTCHA?.describe(error) || describe(error));
      button.disabled = false;
      button.textContent = originalText;
      return false;
    } finally {
      captcha.reset(); // tokens are single-use
    }
  }

  $("forgotForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = $("email");
    const email = input.value.trim();
    if (!email || !input.checkValidity()) {
      showMessage(email ? "Enter a valid email address." : "Enter your email address.");
      input.focus();
      return;
    }
    const sent = await requestLink(email, $("sendLink"), "Sending…");
    if (sent) {
      $("sendLink").disabled = false;
      $("sendLink").textContent = "Send reset link";
    }
  });

  $("sendAgain").addEventListener("click", async () => {
    if (!lastEmail) return;
    const sent = await requestLink(lastEmail, $("sendAgain"), "Sending…");
    if (sent) showMessage("Sent again.", "info");
  });

  $("otherEmail").addEventListener("click", () => {
    window.clearInterval(cooldownTimer);
    showMessage("");
    $("sentView").hidden = true;
    $("requestView").hidden = false;
    $("email").value = "";
    $("email").focus();
  });
})();
