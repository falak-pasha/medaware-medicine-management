// Supabase Edge Function entry point for "Delete my account" on profile.html.
// Deploy with JWT verification ON (the default): only signed-in users can call it.
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { handleRequest } from "./account.ts";

Deno.serve((request) => handleRequest(request, (name) => Deno.env.get(name)));
