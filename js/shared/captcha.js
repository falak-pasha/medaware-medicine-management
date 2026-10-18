/**
 * MEDAWARE | Bot protection (Cloudflare Turnstile) for the forms that call Supabase Auth.
 *
 * Off until MEDAWARE_CONFIG.turnstileSiteKey is set in js/config.js. Then:
 *  - the Turnstile script is loaded once, only on pages that mount a widget;
 *  - getToken() returns a fresh token for signUp, signInWithPassword and
 *    resetPasswordForEmail (pass it as options.captchaToken);
 *  - tokens are single-use, so call reset() after every attempt, successful or not.
 * Supabase checks the token server-side once "Bot protection" is enabled there with the
 * matching secret key. Enable it in Supabase only AFTER the site key is live here.
 */
(function () {
  const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  const TOKEN_WAIT_MS = 30000;
  let scriptPromise = null;

  function siteKey() {
    return String(window.MEDAWARE_CONFIG?.turnstileSiteKey || "").trim();
  }

  function loadScript() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!scriptPromise) {
      scriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = SCRIPT_URL;
        script.async = true;
        script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("captcha-unavailable")));
        script.onerror = () => {
          scriptPromise = null; // allow a retry on the next attempt
          reject(new Error("captcha-unavailable"));
        };
        document.head.append(script);
      });
    }
    return scriptPromise;
  }

  const DISABLED = {
    enabled: false,
    async getToken() {
      return undefined;
    },
    reset() {}
  };

  // Renders a widget into `container` (an element). Returns { enabled, getToken, reset }.
  function mount(container) {
    const key = siteKey();
    if (!key || !container) return DISABLED;

    let token = null;
    let widgetId = null;
    let waiting = [];
    const settle = (value, error) => {
      const pending = waiting;
      waiting = [];
      pending.forEach((waiter) => (error ? waiter.reject(error) : waiter.resolve(value)));
    };

    container.hidden = false;
    const ready = loadScript().then((turnstile) => {
      widgetId = turnstile.render(container, {
        sitekey: key,
        size: "flexible",
        theme: "light",
        callback(value) {
          token = value;
          settle(value);
        },
        "expired-callback"() {
          token = null;
        },
        "error-callback"() {
          token = null;
          settle(null, new Error("captcha-failed"));
          return true; // let Turnstile retry by itself
        }
      });
    });

    return {
      enabled: true,
      async getToken() {
        await ready;
        if (token) return token;
        return new Promise((resolve, reject) => {
          const waiter = { resolve, reject };
          waiting.push(waiter);
          window.setTimeout(() => {
            if (waiting.includes(waiter)) {
              waiting = waiting.filter((item) => item !== waiter);
              reject(new Error("captcha-timeout"));
            }
          }, TOKEN_WAIT_MS);
        });
      },
      reset() {
        token = null;
        if (widgetId !== null) window.turnstile?.reset(widgetId);
      }
    };
  }

  // Friendly text for captcha problems; null when the error is not about the captcha.
  function describe(error) {
    const text = String(error?.message || error || "");
    if (/captcha-unavailable/.test(text)) {
      return "The security check could not load. Check your connection, turn off content blockers for this site, and refresh.";
    }
    if (/captcha-timeout|captcha-failed/.test(text)) {
      return "Please complete the security check, then try again.";
    }
    if (/captcha/i.test(text)) {
      return "The security check failed or expired. Please try again.";
    }
    return null;
  }

  window.MEDAWARE_CAPTCHA = { mount, describe };
})();
