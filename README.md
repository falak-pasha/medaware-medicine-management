# MEDAWARE | Smart Medicine Management

MEDAWARE is a responsive medicine-organization prototype built with HTML, CSS, vanilla JavaScript, Supabase Authentication and Supabase PostgreSQL. It helps a person keep their own medicine schedule, dose log, prescription metadata and general medicine education together.

MEDAWARE is an organizational and educational aid. It does not diagnose, prescribe, recommend dose changes, or replace a doctor, pharmacist or other qualified healthcare professional.

## Features

- Email/password registration and sign-in through Supabase Auth, including email-confirmation messaging and session restoration.
- Private medicine records with edit and confirmed delete actions.
- Optional local-time reminders using the browser Notifications API.
- Optional server-side email reminders (Supabase Edge Function + pg_cron + Resend) that work while the app is closed.
- Manual dose logs with a selected medicine, the time taken and a view of today's entries.
- Private prescription metadata records (title, date, doctor/clinic and notes). The app does not upload prescription images or PDFs.
- Searchable general education about medicine labels, missed doses, antibiotics, precautions, side effects and asking a pharmacist.
- Responsive dashboard and per-user PostgreSQL Row Level Security (RLS).

## Project structure

The HTML pages stay in the project root on purpose: Supabase sends people to
`index.html` (sign-up confirmation) and `reset-password.html` (password reset), and
those exact addresses are listed in Authentication → URL Configuration.

```text
medaware/
├── index.html                  # login screen and dashboard
├── signup.html                 # create an account
├── profile-setup.html          # first-time profile setup (required before the dashboard)
├── profile.html                # profile, medical records and documents
├── forgot-password.html        # request a password reset email
├── reset-password.html         # set a new password from the email link
│
├── css/
│   ├── style.css               # base layout and components (works without the theme)
│   ├── theme.css               # female / male / default palettes and themed components
│   └── pages/                  # styles used by a single page
│       ├── signup.css
│       ├── profile.css         # profile.html and profile-setup.html
│       └── auth-pages.css      # forgot-password.html and reset-password.html
│
├── js/
│   ├── config.js               # Supabase project URL + publishable key (the file to edit)
│   ├── shared/                 # used by several pages
│   │   ├── theme.js            # applies the theme before first paint (loaded in <head>)
│   │   ├── profile-common.js   # Supabase client, profile rules, photo upload
│   │   └── background-scene.js # decorative 3D backgrounds, coloured by the active theme
│   ├── pages/                  # one script per page
│   │   ├── app.js              # index.html
│   │   ├── signup.js
│   │   ├── profile-setup.js
│   │   ├── profile.js
│   │   ├── forgot-password.js
│   │   └── reset-password.js
│   └── vendor/
│       ├── three.min.js        # Three.js r159 (MIT, see three.LICENSE), self-hosted
│       └── three.LICENSE
│
├── supabase/
│   ├── sql/
│   │   ├── schema.sql          # tables, Row Level Security, storage buckets (safe to re-run)
│   │   └── cron-email-reminders.sql
│   ├── functions/send-email-reminders/
│   │   ├── index.ts            # Edge Function entry point
│   │   └── reminders.ts
│   └── email-templates/
│       └── reset-password.html # paste into Supabase → Authentication → Emails
│
├── tests/                      # node --test tests/
├── docs/
│   └── project-notes.txt
├── .gitignore
└── README.md
```

## Prerequisites

- A Supabase account and project.
- A current browser with JavaScript enabled.
- Visual Studio Code and the Live Server extension, or another local HTTP server.

The Supabase CDN script and Google Fonts are fetched online. For local development, use `http://localhost` or HTTPS; browser notification permission is generally unavailable to pages opened directly with a `file://` URL.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com/) and wait for its database to finish provisioning.
2. In the Supabase Dashboard, open **SQL Editor**, create a query, paste the contents of `supabase/sql/schema.sql`, and run it. Confirm that `medicines`, `prescriptions` and `dose_logs` were created with RLS enabled.
3. In **Authentication → Sign In / Providers**, enable the Email provider. Choose whether email confirmation is required. If confirmation is on, configure the project's email delivery and redirect URL settings as needed.
4. In **Project Settings → API** (or **Connect**), copy the **Project URL** and the **anon/public or publishable key**.
5. Put those values in `js/config.js`:

   ```js
   window.MEDAWARE_CONFIG = {
     supabaseUrl: "https://YOUR_PROJECT_ID.supabase.co",
     supabaseAnonKey: "YOUR_ANON_OR_PUBLISHABLE_KEY"
   };
   ```

   The anon/publishable key is designed to be present in browser code. Never put a `service_role` key, secret key, database password, or other privileged credential in this file. The frontend relies on Supabase RLS; do not disable RLS to work around a setup error.

6. If this project already has the earlier MEDAWARE schema, run the updated SQL file again. It recreates the policies and adds the ownership constraint for dose logs. If that step reports existing dose logs whose `user_id` does not match their medicine owner, inspect and correct those records before applying the constraint; do not remove the ownership check.

The SQL is safe to re-run for the provided table structure. It does not delete user records.

## Profile, medical records and documents

`profile.html` (linked as **My profile** in the header once signed in) stores personal details, blood group and vitals, allergies, chronic conditions, past procedures, a profile photo and medical documents. It also lists current medicines from the dashboard (read-only).

- **Setup:** run the latest `supabase/sql/schema.sql`. It creates `profiles` and `medical_documents` (Row Level Security: each user sees only their own rows) and two **private** Storage buckets, `avatars` (JPG/PNG/WebP, 2 MB) and `medical-documents` (PDF/JPG/PNG, 5 MB), with policies limiting each user to the folder named after their user id. Files are only ever opened through signed URLs (photos: 1 hour; documents: 60 seconds).
- **Theme:** the app's colours follow the profile's gender: pink for female, blue for male, and a neutral purple for other, not set or "prefer not to say". Gender is saved as soon as it is chosen; the theme name is cached in `localStorage` so pages open in the right colours, and cleared on sign-out so the next person on the device sees the neutral login screen.
- **First-time setup:** after sign-up (or the first sign-in after confirming the email), users are sent to `profile-setup.html` and cannot open the dashboard until they have saved a full name, date of birth and gender ("Prefer not to say" counts). Photo, blood group and phone are optional there. If the profile cannot be checked because of a network or database error, the dashboard opens anyway so nobody is locked out of their medicines. The check runs in the browser; the data itself is always protected by Row Level Security.
- **Not medical advice:** the profile is for the user's own reference. MEDAWARE does not use it to diagnose or recommend treatment.
- **Known limitations:** deleting a Supabase user removes their profile and document rows, but not their files in Storage; remove those in Dashboard → Storage. If a stored file cannot be deleted after its record is removed, it is no longer listed or linked but remains in the bucket until removed there.

## Password reset (Brevo SMTP)

`forgot-password.html` (linked from the login form) asks Supabase to email a reset link; `reset-password.html` sets the new password and signs the user out everywhere. Supabase sends the email through Brevo once custom SMTP is configured. The Brevo SMTP key goes **only** into the Supabase dashboard, never into this project.

1. **Brevo:** Settings → Senders, Domains & Dedicated IPs → add and verify the sender address (for real users, authenticate your domain with the DKIM/SPF/DMARC records Brevo gives you). Then SMTP & API → SMTP → generate an **SMTP key** (not an API key) and note the SMTP login shown there.
2. **Supabase:** Authentication → Emails → SMTP Settings → enable custom SMTP: host `smtp-relay.brevo.com`, port `587`, username = Brevo SMTP login, password = Brevo SMTP key, sender = the verified address, sender name `MEDAWARE`. Custom SMTP also carries sign-up confirmation emails.
3. **Template:** Authentication → Emails → Templates → *Reset Password*: subject `Reset your MEDAWARE password`, body = contents of `supabase/email-templates/reset-password.html`.
4. **Redirect URLs:** Authentication → URL Configuration → add the full address of `reset-password.html` for every place the site runs (e.g. `http://127.0.0.1:5500/reset-password.html` for Live Server, and your live URL). If it is missing, Supabase sends people to the Site URL instead; the login page then forwards them to the reset page, but adding it is cleaner.
5. **Test:** request a reset for your own account, open the email, set a new password, and log in with it.

Supabase limits how many auth emails a project sends per hour (adjustable under Authentication → Rate Limits); the forgot page shows a friendly message when the limit is hit.

## Email reminders setup

Every 5 minutes, `pg_cron` calls the `send-email-reminders` Edge Function. The function claims due reminders through `public.claim_due_email_reminders` (one row per medicine, recipient and local date in `reminder_email_log`), sends them with Resend, and records each result. A reminder is due when its `reminder_time` falls within the last 10 minutes in the user's saved time zone, so one late or missed cron run catches up instead of skipping. Failed sends are retried up to 3 attempts in total, for up to an hour after the reminder time; invalid-address errors are not retried. A reminder left `pending` by a slow or crashed run is only claimed again after 10 minutes.

Emails go to the account email only if it is confirmed, and to a custom address only when `custom_email_verified` is true.

**Secrets live only in Supabase Edge Function secrets, never in `js/config.js`, git or SQL files.**

1. **Resend:** create an API key with *Sending access*. Emails are sent from `onboarding@resend.dev`, Resend's test domain, which only delivers to your own Resend account address. To email other users, verify your domain (Resend → Domains) and change `FROM_ADDRESS` in `supabase/functions/send-email-reminders/reminders.ts`.
2. **Run `supabase/sql/schema.sql`** again in the SQL Editor (adds the claim function and log columns).
3. **Set the function secrets** with the [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase login`, then `supabase link --project-ref dsxekgnhuatpbkgyswmn`), or in Dashboard → Edge Functions → Secrets:

   ```sh
   supabase secrets set RESEND_API_KEY=re_xxxxxxxx
   supabase secrets set REMINDER_CRON_SECRET=<long random value, e.g. from: openssl rand -hex 32>
   supabase secrets set MEDAWARE_APP_URL=https://your-medaware-site.example   # optional
   ```

   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to Edge Functions automatically. Optional tuning: `REMINDER_WINDOW_MINUTES` (10), `REMINDER_MAX_ATTEMPTS` (3), `REMINDER_BATCH_LIMIT` (60), `REMINDER_SEND_DELAY_MS` (600).

4. **Deploy the function** without JWT verification (requests are authenticated by the cron secret instead):

   ```sh
   supabase functions deploy send-email-reminders --no-verify-jwt
   ```

5. **Store the cron secret in Vault** (SQL Editor; same value as `REMINDER_CRON_SECRET`, do not save it in a file):

   ```sql
   select vault.create_secret('<same random value>', 'medaware_reminder_cron_secret');
   ```

6. **Schedule it:** run `supabase/sql/cron-email-reminders.sql` in the SQL Editor.
7. **Test:** in MEDAWARE, enable email reminders, add a medicine with a reminder time 1–2 minutes ahead, and wait. Check `select * from public.reminder_email_log order by created_at desc;` and the function logs (Dashboard → Edge Functions → send-email-reminders → Logs).

To stop all email reminders: `select cron.unschedule('medaware-email-reminders');`

## Automated tests

```sh
node --test tests/
```

Requires Node 22.18+ (runs the Edge Function's TypeScript directly). Uses stand-ins for the browser, Supabase and Resend; it does not contact any real service.

## Run locally

1. Open this project folder in VS Code.
2. Install the **Live Server** extension if needed.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Create an account. If email confirmation is enabled, use the confirmation email and then sign in.

If the Supabase URL or public key is missing or invalid, MEDAWARE displays a setup message instead of initializing the client.

## Feature test checklist

Use non-sensitive test data during a demonstration.

1. **Authentication:** Create an account, confirm it if required, sign in, refresh the page and confirm the session is restored. Sign out and verify that the login screen returns. Try a wrong password to see the error state.
2. **Medicines:** Add a medicine with instructions, schedule, reminder time, start date and notes. Refresh and verify it remains. Edit it, cancel an edit, and delete it after the confirmation prompt.
3. **Dose tracking:** Select a saved medicine, enter the actual time it was taken and save the log. Confirm it appears in today's dose log after refresh. The app does not log a dose when a reminder appears.
4. **Prescriptions:** Add a title, date, doctor/clinic and notes. Refresh and verify the record. Delete it and confirm it disappears. Only metadata is stored; there is no file-upload feature.
5. **Medicine information:** Search for a tip (`missed dose`, `label`), a medicine (`paracetamol`), a brand (`Brufen`) or a condition (`blood pressure`). Check that each medicine card shows the "Not yet reviewed" label, page numbers on every section, and that ranitidine shows its withdrawal update with a source link. Clear the search and verify all 7 tips and 65 medicines return.
6. **Reminders:** In a supported browser, select **Enable reminders** and explicitly allow notifications. Add a test medicine with a reminder time shortly ahead and a start date no later than today. Keep the dashboard open through the reminder time, then check that the scheduled reminder appears only once during that local minute. Test denied permission or an unsupported browser to see the status message.
7. **Privacy:** For a second test account, verify its dashboard does not show the first account's records. In Supabase, confirm RLS is enabled and inspect that each table's policies restrict access to `auth.uid()`.
8. **Responsive layout:** Resize the browser to desktop, tablet and mobile widths; check navigation, forms, cards and status messages.

## Limitations and security notes

- Browser notifications are checked only while the MEDAWARE page is running and the browser can execute its JavaScript. They may not work when the app is closed, the browser is suspended, or the device is asleep. Dependable reminders while the app is closed require server-side scheduling and push notifications.
- A reminder is a notification only; MEDAWARE never assumes a dose was taken. Dose logs are entered manually.
- A saved reminder time is a daily local-time reminder from the medicine's optional start date onward. The free-text schedule is recorded for reference; it is not parsed into a repeating schedule.
- Prescription records contain metadata and notes only. If file uploads are added later, use a private Supabase Storage bucket and user-specific access policies; prescription files are sensitive health information.
- Medicine information is general education, not personalized medical advice. Follow the prescription and patient leaflet, and ask a pharmacist or prescriber when uncertain.
- Browser storage is used only to avoid repeating the same reminder after a refresh. Clearing site data can remove that de-duplication history.
- No live Supabase account, database, email-confirmation flow or cross-device browser test can be verified from the source workspace alone. Configure your own Supabase project and follow the checklist above to test those integrations.
