-- MEDAWARE: schedule the send-email-reminders Edge Function every 5 minutes.
-- Run in Supabase Dashboard > SQL Editor AFTER:
--   1. supabase/sql/schema.sql has been run,
--   2. the function is deployed (supabase functions deploy send-email-reminders --no-verify-jwt),
--   3. its secrets are set, including REMINDER_CRON_SECRET.
-- Safe to re-run: the jobs are replaced, not duplicated.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ONE-TIME STEP (do not save the real value in this file or in git):
-- store the SAME random value you set as the REMINDER_CRON_SECRET function secret.
--   select vault.create_secret('PASTE_THE_SAME_RANDOM_SECRET', 'medaware_reminder_cron_secret');
-- To change it later:
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'medaware_reminder_cron_secret'),
--     'NEW_RANDOM_SECRET');

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'medaware_reminder_cron_secret') then
    raise exception 'Create the medaware_reminder_cron_secret Vault secret first (see the comment above).';
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'medaware-email-reminders') then
    perform cron.unschedule('medaware-email-reminders');
  end if;
  if exists (select 1 from cron.job where jobname = 'medaware-cron-history-cleanup') then
    perform cron.unschedule('medaware-cron-history-cleanup');
  end if;
end;
$$;

select cron.schedule(
  'medaware-email-reminders',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := 'https://dsxekgnhuatpbkgyswmn.supabase.co/functions/v1/send-email-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'medaware_reminder_cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);

-- The 5-minute job adds 288 rows a day to cron.job_run_details; keep a week.
select cron.schedule(
  'medaware-cron-history-cleanup',
  '17 3 * * *',
  $job$
  delete from cron.job_run_details where end_time < now() - interval '7 days';
  $job$
);

-- Useful checks:
--   select * from cron.job_run_details order by start_time desc limit 10;
--   select id, status_code, content from net._http_response order by created desc limit 10;
--   select status, count(*) from public.reminder_email_log group by status;
-- To stop email reminders entirely:
--   select cron.unschedule('medaware-email-reminders');
