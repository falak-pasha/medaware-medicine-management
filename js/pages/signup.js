/* MEDAWARE | Sign-up page (signup.html). New accounts continue to profile-setup.html. */

const form = document.getElementById("signupForm");
const message = document.getElementById("message");
const button = document.getElementById("signupButton");
const captcha = window.MEDAWARE_CAPTCHA?.mount(document.getElementById("signupCaptcha")) ??
  { getToken: async () => undefined, reset() {} };

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword =
    document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    message.textContent = "Your passwords do not match.";
    return;
  }

  const config = window.MEDAWARE_CONFIG;

  if (
    !config ||
    !config.supabaseUrl ||
    !config.supabaseAnonKey ||
    config.supabaseUrl.includes("PASTE_YOUR") ||
    config.supabaseAnonKey.includes("PASTE_YOUR")
  ) {
    message.textContent =
      "Supabase is not configured. Please check js/config.js.";
    return;
  }

  button.disabled = true;
  button.textContent = "Creating account...";

  try {
    const client = window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseAnonKey
    );

    const captchaToken = await captcha.getToken();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin + "/index.html"
      }
    });

    if (error) throw error;

    if (data.session) {
      // Signed in straight away (email confirmation off): set up the profile first.
      window.location.replace("profile-setup.html");
      return;
    } else {
      message.textContent =
        "Account created! Check your email to confirm your account before logging in.";
    }

    form.reset();
  } catch (error) {
    message.textContent = window.MEDAWARE_CAPTCHA?.describe(error) || error.message ||
      "Could not create your account. Please try again.";
  } finally {
    captcha.reset(); // tokens are single-use
    button.disabled = false;
    button.textContent = "Create Account";
  }
});
