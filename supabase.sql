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

-- Prescription entries contain metadata only; no files are uploaded by this app.
