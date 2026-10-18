// Supabase Edge Function entry point. Called every 5 minutes by pg_cron (see
// supabase/sql/cron-email-reminders.sql). Deploy with --no-verify-jwt: requests are
// authenticated by the x-cron-secret header instead.
//
// Secrets (set with `supabase secrets set`, never in the frontend):
//   RESEND_API_KEY, REMINDER_CRON_SECRET, optional MEDAWARE_APP_URL.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
import { handleRequest } from "./reminders.ts";

Deno.serve((request) => handleRequest(request, (name) => Deno.env.get(name)));
