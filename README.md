# MEDAWARE | Smart Medicine Management

MEDAWARE is a responsive medicine-organization prototype built with HTML, CSS, vanilla JavaScript, Supabase Authentication and Supabase PostgreSQL. It helps a person keep their own medicine schedule, dose log, prescription metadata and general medicine education together.

MEDAWARE is an organizational and educational aid. It does not diagnose, prescribe, recommend dose changes, or replace a doctor, pharmacist or other qualified healthcare professional.

## Features

- Email/password registration and sign-in through Supabase Auth, including email-confirmation messaging and session restoration.
- Private medicine records with edit and confirmed delete actions.
- Optional local-time reminders using the browser Notifications API.
- Manual dose logs with a selected medicine, the time taken and a view of today's entries.
- Private prescription metadata records (title, date, doctor/clinic and notes). The app does not upload prescription images or PDFs.
- Searchable general education about medicine labels, missed doses, antibiotics, precautions, side effects and asking a pharmacist.
- Responsive dashboard and per-user PostgreSQL Row Level Security (RLS).

## Project structure

```text
medaware/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js
│   └── app.js
├── supabase.sql
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
2. In the Supabase Dashboard, open **SQL Editor**, create a query, paste the contents of `supabase.sql`, and run it. Confirm that `medicines`, `prescriptions` and `dose_logs` were created with RLS enabled.
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
5. **Medicine information:** Search for a topic such as `antibiotics`, `missed dose`, `label` or `pharmacist`; clear the search and verify the full set returns.
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
