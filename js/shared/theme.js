/**
 * MEDAWARE | Theme selection shared by every page.
 * Load in <head> WITHOUT defer so the saved theme applies before the first paint.
 *
 * The theme follows the profile's gender: "female" -> pink, "male" -> blue,
 * anything else ("other", not set, prefer not to say) -> the neutral default.
 * Only the theme name is kept in localStorage, and it is cleared on sign-out so
 * the next person using the device sees the neutral login screen.
 */
(() => {
  const STORAGE_KEY = "medaware_theme";
  const THEMES = ["female", "male"];

  function themeForGender(gender) {
    return THEMES.includes(gender) ? gender : "default";
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try {
      if (theme === "default") window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage unavailable (private mode, blocked): the theme still applies to this page.
    }
  }

  let saved = null;
  try {
    saved = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    saved = null;
  }
  document.documentElement.dataset.theme = THEMES.includes(saved) ? saved : "default";

  window.MEDAWARE_THEME = {
    themeForGender,
    applyGender(gender) {
      setTheme(themeForGender(gender));
    },
    reset() {
      setTheme("default");
    },
    get current() {
      return document.documentElement.dataset.theme;
    }
  };
})();
