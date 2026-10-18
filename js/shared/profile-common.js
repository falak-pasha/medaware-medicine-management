/**
 * MEDAWARE | Shared by profile.html and profile-setup.html.
 * Supabase client setup, field rules (mirroring the CHECK constraints in supabase/sql/schema.sql),
 * user-safe error messages and the private profile-photo upload.
 */
window.MEDAWARE_PROFILE = (() => {
  const PHONE_PATTERN = /^[+0-9 ()-]{6,20}$/;
  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const GENDERS = ["female", "male", "other", "prefer_not_to_say"];
  const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const AVATAR_BYTES = 2 * 1024 * 1024;
  const FULL_NAME_MAX = 120;

  // Returns { db } or { message } when the page cannot connect.
  function createClient() {
    const config = window.MEDAWARE_CONFIG || {};
    const url = typeof config.supabaseUrl === "string" ? config.supabaseUrl.trim() : "";
    const key = typeof config.supabaseAnonKey === "string" ? config.supabaseAnonKey.trim() : "";
    if (!window.supabase?.createClient) {
      return { message: "The Supabase client could not be loaded. Check your internet connection and refresh." };
    }
    if (!url || !key || /PASTE_|YOUR_/.test(url + key)) {
      return { message: "Add your Supabase project URL and anon/publishable key in js/config.js, then refresh." };
    }
    return { db: window.supabase.createClient(url, key) };
  }

  // The fields profile setup requires. A profile missing any of them sends the user
  // back to profile-setup.html (js/pages/app.js uses the same rule).
  function isComplete(profile) {
    return Boolean(profile?.full_name && profile?.dob && profile?.gender);
  }

  function localDateKey(date = new Date()) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function characterCount(value) {
    return [...value].length;
  }

  // Returns an error message for a full name, or "" when it is valid.
  function nameError(fullName, required) {
    if (!fullName) return required ? "Enter your full name." : "";
    if (characterCount(fullName) > FULL_NAME_MAX) return `Full name must be ${FULL_NAME_MAX} characters or fewer.`;
    return "";
  }

  function dobError(dob, required) {
    if (!dob) return required ? "Enter your date of birth." : "";
    if (dob < "1900-01-01" || dob > localDateKey()) return "Date of birth must be between 1900 and today.";
    return "";
  }

  function phoneError(phone, label) {
    if (phone && !PHONE_PATTERN.test(phone)) {
      return `${label} can use digits, spaces, +, - and brackets (6 to 20 characters).`;
    }
    return "";
  }

  // Turns Supabase database / storage errors into messages safe to show users.
  function describeError(error, action) {
    console.error(`Could not ${action}:`, error);
    const text = `${error?.message || ""} ${error?.details || ""}`;
    if (/failed to fetch|networkerror|network request failed|load failed/i.test(text)) {
      return "Could not reach the server. Check your internet connection and try again.";
    }
    if (error?.code === "23514") return "Some details are not in a valid format. Check the highlighted fields and try again.";
    if (error?.code === "42P01" || /does not exist|schema cache/i.test(text)) {
      return `Could not ${action}: the profile tables are not set up yet. Run the latest supabase/sql/schema.sql in Supabase.`;
    }
    if (/bucket not found/i.test(text)) {
      return `Could not ${action}: file storage is not set up yet. Run the latest supabase/sql/schema.sql in Supabase.`;
    }
    if (/mime type|not supported/i.test(text)) return "That file type is not allowed.";
    if (/exceeded|too large|maximum allowed size/i.test(text)) return "That file is too large.";
    if (error?.code === "42501" || /jwt|row-level security|unauthorized/i.test(text)) {
      return "Your session may have expired. Sign out, sign in again, and retry.";
    }
    return `Could not ${action}. Please try again.`;
  }

  // Uploads a profile photo to the private avatars bucket and links it to the profile
  // (creating the profile row if needed). Returns { profile } or { message }.
  async function uploadAvatar(db, userId, file, hadPhoto) {
    if (!AVATAR_TYPES.includes(file.type)) return { message: "Choose a JPG, PNG or WebP image." };
    if (file.size > AVATAR_BYTES) return { message: "That image is larger than 2 MB. Choose a smaller one." };
    const path = `${userId}/avatar`;
    const upload = await db.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "60" });
    if (upload.error) return { message: describeError(upload.error, "upload your photo") };
    const result = await db
      .from("profiles")
      .upsert({ user_id: userId, avatar_path: path }, { onConflict: "user_id" })
      .select("*")
      .single();
    if (result.error) {
      // Do not leave an unlinked file behind when the profile never pointed to it.
      if (!hadPhoto) await db.storage.from("avatars").remove([path]);
      return { message: describeError(result.error, "save your photo") };
    }
    return { profile: result.data };
  }

  // A signed link to the private photo, or null.
  async function avatarUrl(db, path) {
    if (!path) return null;
    const { data, error } = await db.storage.from("avatars").createSignedUrl(path, 3600);
    if (error) {
      console.error("Could not load profile photo:", error);
      return null;
    }
    return data.signedUrl;
  }

  return {
    PHONE_PATTERN,
    BLOOD_GROUPS,
    GENDERS,
    FULL_NAME_MAX,
    createClient,
    isComplete,
    localDateKey,
    characterCount,
    nameError,
    dobError,
    phoneError,
    describeError,
    uploadAvatar,
    avatarUrl
  };
})();
