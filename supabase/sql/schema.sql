-- Run in Supabase Dashboard > SQL Editor.
-- These tables contain private user data and must keep Row Level Security enabled.
create extension if not exists pgcrypto;

create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  dose_instructions text check (dose_instructions is null or char_length(dose_instructions) <= 300),
  frequency text check (frequency is null or char_length(frequency) <= 200),
  reminder_time time,
  start_date date,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

-- "create table if not exists" never adds constraints to a table that already exists,
-- so a medicines table created by an older script may have no name-length rule at all.
-- Re-apply it here (idempotent). The rule also limits the untrimmed length, so a name
-- padded with spaces cannot bypass the 120-character limit.
-- NOT VALID enforces the rule for all new inserts and updates immediately; existing
-- rows are then checked, and any that break the rule are reported instead of failing.
-- To list such rows: select id, char_length(name) from public.medicines
--                    where char_length(name) > 120 or char_length(btrim(name)) = 0;
alter table public.medicines drop constraint if exists medicines_name_check;
alter table public.medicines
  add constraint medicines_name_check
  check (char_length(btrim(name)) between 1 and 120 and char_length(name) <= 120)
  not valid;

do $$
begin
  alter table public.medicines validate constraint medicines_name_check;
exception when check_violation then
  raise notice 'Some existing medicine names are blank or longer than 120 characters. New saves are still blocked; fix those rows, then run: alter table public.medicines validate constraint medicines_name_check;';
end;
$$;

create unique index if not exists medicines_user_id_id_uidx
  on public.medicines(user_id, id);

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 140),
  prescription_date date,
  doctor_or_clinic text check (doctor_or_clinic is null or char_length(doctor_or_clinic) <= 160),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medicine_id uuid not null,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint dose_logs_medicine_owner_fkey
    foreign key (user_id, medicine_id)
    references public.medicines(user_id, id)
    on delete cascade
);

do $$
begin
if not exists (
  select 1
  from pg_constraint
  where conrelid = 'public.dose_logs'::regclass
    and conname = 'dose_logs_medicine_owner_fkey'
) then
  alter table public.dose_logs
    add constraint dose_logs_medicine_owner_fkey
    foreign key (user_id, medicine_id)
    references public.medicines(user_id, id)
    on delete cascade;
end if;
end;
$$;

create index if not exists medicines_user_created_idx
  on public.medicines(user_id, created_at desc);
create index if not exists prescriptions_user_created_idx
  on public.prescriptions(user_id, created_at desc);
create index if not exists dose_logs_user_taken_idx
  on public.dose_logs(user_id, taken_at desc);

alter table public.medicines enable row level security;
alter table public.prescriptions enable row level security;
alter table public.dose_logs enable row level security;

drop policy if exists "Users manage own medicines" on public.medicines;
create policy "Users manage own medicines"
  on public.medicines
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own prescriptions" on public.prescriptions;
create policy "Users manage own prescriptions"
  on public.prescriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own dose logs" on public.dose_logs;
create policy "Users manage own dose logs"
  on public.dose_logs
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.medicines as medicine
      where medicine.id = dose_logs.medicine_id
        and medicine.user_id = auth.uid()
    )
  );

revoke all on public.medicines, public.prescriptions, public.dose_logs from public, anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.medicines to authenticated;
grant select, insert, update, delete on public.prescriptions to authenticated;
grant select, insert, update, delete on public.dose_logs to authenticated;

-- Email reminders. reminder_settings is edited by the signed-in user; the reminder
-- sender and email verification flow use the service role for the other two tables.
create table if not exists public.reminder_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default false,
  send_to_account boolean not null default true,
  send_to_custom boolean not null default false,
  custom_email text constraint custom_email_length
    check (custom_email is null or char_length(custom_email) <= 254),
  custom_email_verified boolean not null default false,
  updated_at timestamptz not null default now(),
  timezone text not null default 'Asia/Kolkata'
);

create table if not exists public.reminder_email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  recipient text not null,
  reminder_date date not null,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  unique (medicine_id, recipient, reminder_date)
);

create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_verifications_user_idx
  on public.email_verifications(user_id, created_at desc);

-- Changing the custom address must be re-verified before reminders go to it.
create or replace function public.reset_custom_email_verified()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.custom_email is distinct from old.custom_email then
    new.custom_email_verified := false;
  end if;
  return new;
end;
$$;

drop trigger if exists reminder_settings_reset_verified on public.reminder_settings;
create trigger reminder_settings_reset_verified
  before update on public.reminder_settings
  for each row execute function public.reset_custom_email_verified();

alter table public.reminder_settings enable row level security;
alter table public.reminder_email_log enable row level security;
alter table public.email_verifications enable row level security;

drop policy if exists "Users read own reminder settings" on public.reminder_settings;
create policy "Users read own reminder settings"
  on public.reminder_settings
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own reminder settings" on public.reminder_settings;
create policy "Users insert own reminder settings"
  on public.reminder_settings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own reminder settings" on public.reminder_settings;
create policy "Users update own reminder settings"
  on public.reminder_settings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- reminder_email_log and email_verifications intentionally have no policies:
-- with RLS on, only the service role can read or write them.
revoke all on public.reminder_settings, public.reminder_email_log, public.email_verifications
  from public, anon, authenticated;
-- Column-level grants keep users from marking their own custom email as verified.
grant select on public.reminder_settings to authenticated;
grant insert (user_id, email_enabled, send_to_account, send_to_custom, custom_email, timezone)
  on public.reminder_settings to authenticated;
grant update (email_enabled, send_to_account, send_to_custom, custom_email, timezone)
  on public.reminder_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Server-side email reminder sending (used by the send-email-reminders Edge Function)
-- ---------------------------------------------------------------------------

-- reminder_email_log doubles as the claim/lock table: a row is inserted as 'pending'
-- before sending, so overlapping runs can never send the same reminder twice.
alter table public.reminder_email_log
  add column if not exists attempts integer not null default 0,
  add column if not exists claimed_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists provider_message_id text;

alter table public.reminder_email_log
  drop constraint if exists reminder_email_log_status_check;
alter table public.reminder_email_log
  add constraint reminder_email_log_status_check
  check (status in ('pending', 'sent', 'failed'));

-- Reject unknown time zones on save; otherwise one bad value would break the
-- reminder query for every user.
create or replace function public.validate_reminder_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Unknown time zone: %', new.timezone using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists reminder_settings_validate_timezone on public.reminder_settings;
create trigger reminder_settings_validate_timezone
  before insert or update of timezone on public.reminder_settings
  for each row execute function public.validate_reminder_timezone();

-- Finds reminders that are due (scheduled within the last p_window_minutes in the
-- user's own time zone), and atomically claims them by inserting 'pending' log rows.
-- Only claimed rows are returned, so only those may be sent.
--  * Recipients: the account email if confirmed, the custom email only if verified.
--  * Previously failed rows are retried until p_max_attempts; 'pending' rows left by
--    a crashed or slow run are reclaimed only after 10 minutes. Retries continue for
--    p_retry_minutes after the reminder time, longer than the 10-minute reclaim delay.
--  * One email per medicine, recipient and local date: changing a reminder time
--    after today's email was sent does not send a second one today.
drop function if exists public.claim_due_email_reminders(integer, integer, integer);
create or replace function public.claim_due_email_reminders(
  p_window_minutes integer default 10,
  p_max_attempts integer default 3,
  p_limit integer default 60,
  p_retry_minutes integer default 60
)
returns table (
  log_id uuid,
  attempts integer,
  recipient text,
  medicine_name text,
  dose_instructions text,
  reminder_time time,
  reminder_date date,
  timezone text
)
language sql
volatile
security definer
set search_path = ''
as $$
  with settings as (
    select s.*, (now() at time zone s.timezone) as local_now
    from public.reminder_settings as s
    where s.email_enabled
      and s.timezone in (select name from pg_catalog.pg_timezone_names)
  ),
  occurrences as (
    -- Most recent scheduled time at or before the user's local "now".
    select
      m.id as medicine_id,
      m.user_id,
      m.name,
      m.dose_instructions,
      m.reminder_time,
      m.start_date,
      st.timezone,
      st.local_now,
      st.send_to_account,
      st.send_to_custom,
      st.custom_email,
      st.custom_email_verified,
      case when m.reminder_time <= st.local_now::time
        then st.local_now::date
        else st.local_now::date - 1
      end as reminder_date
    from public.medicines as m
    join settings as st on st.user_id = m.user_id
    where m.reminder_time is not null
  ),
  due as (
    -- in_window: new reminders. The wider retry window only applies to log rows that
    -- already exist (see candidates).
    select
      o.*,
      o.reminder_date + o.reminder_time > o.local_now - make_interval(mins => p_window_minutes) as in_window
    from occurrences as o
    where o.reminder_date + o.reminder_time
          > o.local_now - make_interval(mins => greatest(p_window_minutes, p_retry_minutes))
      and (o.start_date is null or o.start_date <= o.reminder_date)
  ),
  recipients as (
    select d.medicine_id, d.user_id, lower(u.email) as recipient, d.reminder_date, d.in_window
    from due as d
    join auth.users as u on u.id = d.user_id
    where d.send_to_account and u.email is not null and u.email_confirmed_at is not null
    union
    select d.medicine_id, d.user_id, lower(d.custom_email), d.reminder_date, d.in_window
    from due as d
    where d.send_to_custom and d.custom_email is not null and d.custom_email_verified
  ),
  candidates as (
    -- Skip rows that are already sent or not yet retryable before applying the limit,
    -- so finished reminders cannot crowd out new ones. ON CONFLICT below repeats the
    -- same rule to stay safe against a concurrent run. Outside the normal window, only
    -- existing log rows (retries) qualify.
    select r.medicine_id, r.user_id, r.recipient, r.reminder_date
    from recipients as r
    where (
        r.in_window
        or exists (
          select 1
          from public.reminder_email_log as l
          where l.medicine_id = r.medicine_id
            and l.recipient = r.recipient
            and l.reminder_date = r.reminder_date
        )
      )
      and not exists (
        select 1
        from public.reminder_email_log as l
        where l.medicine_id = r.medicine_id
          and l.recipient = r.recipient
          and l.reminder_date = r.reminder_date
          and not (
            l.attempts < p_max_attempts
            and (
              l.status = 'failed'
              or (l.status = 'pending' and l.claimed_at < now() - interval '10 minutes')
            )
          )
      )
    order by r.reminder_date, r.medicine_id
    limit p_limit
  ),
  claimed as (
    insert into public.reminder_email_log as l
      (user_id, medicine_id, recipient, reminder_date, status, attempts, claimed_at)
    select c.user_id, c.medicine_id, c.recipient, c.reminder_date, 'pending', 1, now()
    from candidates as c
    on conflict (medicine_id, recipient, reminder_date) do update
      set status = 'pending',
          attempts = l.attempts + 1,
          claimed_at = now(),
          error_message = null
      where l.attempts < p_max_attempts
        and (
          l.status = 'failed'
          or (l.status = 'pending' and l.claimed_at < now() - interval '10 minutes')
        )
    returning l.id, l.attempts, l.medicine_id, l.recipient, l.reminder_date
  )
  select
    c.id,
    c.attempts,
    c.recipient,
    d.name,
    d.dose_instructions,
    d.reminder_time,
    c.reminder_date,
    d.timezone
  from claimed as c
  join due as d on d.medicine_id = c.medicine_id and d.reminder_date = c.reminder_date;
$$;

revoke all on function public.claim_due_email_reminders(integer, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_due_email_reminders(integer, integer, integer, integer)
  to service_role;
grant select, update on public.reminder_email_log to service_role;

-- ---------------------------------------------------------------------------
-- Profile: personal details and self-reported medical records (profile.html)
-- Stored for the user's own reference only; MEDAWARE does not use it to diagnose
-- or recommend treatment. Only the owner can read or change their row.
-- ---------------------------------------------------------------------------

-- JSON list validators used by the CHECK constraints below (immutable, no table access).
create or replace function public.medaware_is_text_list(items jsonb, max_items integer, max_length integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) <= max_items
    and not exists (
      select 1
      from jsonb_array_elements(items) as item
      where jsonb_typeof(item) <> 'string'
         or char_length(btrim(item #>> '{}')) not between 1 and max_length
    );
$$;

create or replace function public.medaware_is_surgery_list(items jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) <= 50
    and not exists (
      select 1
      from jsonb_array_elements(items) as item
      where jsonb_typeof(item) <> 'object'
         or jsonb_typeof(item -> 'name') is distinct from 'string'
         or char_length(btrim(item ->> 'name')) not between 1 and 150
         or (item ? 'date' and item -> 'date' <> 'null'::jsonb
             and coalesce(item ->> 'date', '') !~ '^\d{4}-\d{2}-\d{2}$')
         or exists (select 1 from jsonb_object_keys(item) as key where key not in ('name', 'date'))
    );
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text check (full_name is null or char_length(btrim(full_name)) between 1 and 120),
  dob date check (dob is null or dob >= date '1900-01-01'),
  phone text check (phone is null or phone ~ '^[+0-9 ()-]{6,20}$'),
  emergency_contact text check (emergency_contact is null or emergency_contact ~ '^[+0-9 ()-]{6,20}$'),
  gender text check (gender is null or gender in ('male', 'female', 'other')),
  -- Path inside the private "avatars" bucket; always the owner's own folder.
  avatar_path text check (avatar_path is null or avatar_path = user_id::text || '/avatar'),
  blood_group text check (blood_group is null or blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  height numeric(4, 1) check (height is null or height between 30 and 272),   -- cm
  weight numeric(4, 1) check (weight is null or weight between 1 and 500),    -- kg
  allergies jsonb not null default '[]'::jsonb
    check (public.medaware_is_text_list(allergies, 50, 100)),
  conditions jsonb not null default '[]'::jsonb
    check (public.medaware_is_text_list(conditions, 50, 100)),
  surgeries jsonb not null default '[]'::jsonb
    check (public.medaware_is_surgery_list(surgeries)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profile setup requires a gender answer; "prefer_not_to_say" is a valid answer
-- (it uses the neutral theme). Re-applied here so existing tables get the new value.
alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles
  add constraint profiles_gender_check
  check (gender is null or gender in ('male', 'female', 'other', 'prefer_not_to_say'));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.profiles from public, anon;
grant select, insert, update, delete on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Medical documents (profile.html): file metadata here, files in private Storage.
-- ---------------------------------------------------------------------------

create table if not exists public.medical_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- "<user_id>/<random uuid>.<ext>" inside the private "medical-documents" bucket.
  storage_path text not null unique
    check (storage_path ~ ('^' || user_id::text || '/[0-9a-f-]{36}\.(pdf|jpg|png)$')),
  file_name text not null check (char_length(btrim(file_name)) between 1 and 200),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now()
);

create index if not exists medical_documents_user_created_idx
  on public.medical_documents(user_id, created_at desc);

alter table public.medical_documents enable row level security;

drop policy if exists "Users manage own medical documents" on public.medical_documents;
create policy "Users manage own medical documents"
  on public.medical_documents
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.medical_documents from public, anon;
-- No UPDATE: a document record is uploaded or deleted, never edited.
grant select, insert, delete on public.medical_documents to authenticated;

-- ---------------------------------------------------------------------------
-- Private Storage buckets. Files are read through short-lived signed URLs only.
-- Size and type limits are enforced by Storage itself, not just the browser.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('medical-documents', 'medical-documents', false, 5242880,
   array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Each user may only touch objects inside the folder named after their own user id.
drop policy if exists "Users manage own avatar files" on storage.objects;
create policy "Users manage own avatar files"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users manage own medical document files" on storage.objects;
create policy "Users manage own medical document files"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'medical-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'medical-documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Prescription entries contain metadata only; uploaded medical documents are stored
-- separately in medical_documents and the private "medical-documents" bucket.
