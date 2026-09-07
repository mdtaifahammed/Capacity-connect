-- Capacity Connect authentication and authorization migration.
-- Run this after supabase_schema.sql in the Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'student' check (role in ('student', 'trainer', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'admin' and old.role <> 'admin' then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    ) and auth.uid() is not null then
      raise exception 'Only an administrator can assign the admin role';
    end if;
  end if;

  if new.role <> old.role and old.role <> 'admin' and auth.uid() = old.id then
    raise exception 'Users cannot change their own role';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := lower(coalesce(new.raw_user_meta_data ->> 'role', 'student'));
begin
  if requested_role not in ('student', 'trainer') then
    requested_role := 'student';
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    requested_role
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Replace the original demo write policies with owner-only policies.
alter table public.skill_gap_analyses enable row level security;
alter table public.assessments enable row level security;
drop policy if exists "demo insert skill gap" on public.skill_gap_analyses;
drop policy if exists "skill_gap_select_own" on public.skill_gap_analyses;
drop policy if exists "skill_gap_insert_own" on public.skill_gap_analyses;
create policy "skill_gap_select_own" on public.skill_gap_analyses
for select to authenticated using (user_id = auth.uid());
create policy "skill_gap_insert_own" on public.skill_gap_analyses
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "demo insert assessments" on public.assessments;
drop policy if exists "assessments_select_own" on public.assessments;
drop policy if exists "assessments_insert_own" on public.assessments;
create policy "assessments_select_own" on public.assessments
for select to authenticated using (user_id = auth.uid());
create policy "assessments_insert_own" on public.assessments
for insert to authenticated with check (user_id = auth.uid());

-- Existing rows from the prototype cannot be assigned to a user automatically.
-- Keep them out of authenticated users' views until they are migrated deliberately.

-- Admins can read all profiles; normal users only see their own profile.
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
for select to authenticated using (public.is_admin());

-- Admin role assignment should be performed with the SQL Editor, not from the browser:
-- update public.profiles set role = 'admin' where email = 'admin@example.com';
