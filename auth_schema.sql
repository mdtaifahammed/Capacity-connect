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

alter table public.profiles
  add column if not exists approval_status text not null default 'approved'
    check (approval_status in ('pending', 'approved', 'rejected', 'disabled'));

update public.profiles
set approval_status = 'pending'
where role = 'trainer' and approval_status = 'approved';

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

  insert into public.profiles (id, full_name, email, role, approval_status)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    requested_role,
    case when requested_role = 'trainer' then 'pending' else 'approved' end
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'General',
  difficulty text not null default 'Beginner' check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  thumbnail_url text,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  status text not null default 'draft' check (status in ('draft', 'pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null default 0
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  content text not null default '',
  resource_url text,
  resource_size_bytes bigint,
  position integer not null default 0
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  enrolled_at timestamptz not null default now(),
  unique(course_id, student_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  completed boolean not null default false,
  score numeric(5,2) check (score between 0 and 100),
  updated_at timestamptz not null default now(),
  unique(lesson_id, student_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at before update on public.courses
for each row execute function public.set_updated_at();

alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "published courses are readable" on public.courses;
create policy "published courses are readable" on public.courses
for select to authenticated using (status = 'published' or trainer_id = auth.uid() or public.is_admin());
drop policy if exists "trainers create own courses" on public.courses;
create policy "trainers create own courses" on public.courses
for insert to authenticated with check (trainer_id = auth.uid() and exists (
  select 1 from public.profiles where id = auth.uid() and role = 'trainer' and approval_status = 'approved'
));
drop policy if exists "trainers update own courses" on public.courses;
create policy "trainers update own courses" on public.courses
for update to authenticated using (trainer_id = auth.uid() or public.is_admin())
with check (trainer_id = auth.uid() or public.is_admin());
drop policy if exists "trainers delete own courses" on public.courses;
create policy "trainers delete own courses" on public.courses
for delete to authenticated using (trainer_id = auth.uid() or public.is_admin());

drop policy if exists "course content access" on public.course_modules;
create policy "course content access" on public.course_modules for all to authenticated
using (exists (select 1 from public.courses c where c.id = course_id and (c.status = 'published' or c.trainer_id = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.courses c where c.id = course_id and (c.trainer_id = auth.uid() or public.is_admin())));
drop policy if exists "lesson content access" on public.course_lessons;
create policy "lesson content access" on public.course_lessons for all to authenticated
using (exists (select 1 from public.course_modules m join public.courses c on c.id = m.course_id where m.id = module_id and (c.status = 'published' or c.trainer_id = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.course_modules m join public.courses c on c.id = m.course_id where m.id = module_id and (c.trainer_id = auth.uid() or public.is_admin())));

drop policy if exists "enrollment access" on public.enrollments;
create policy "enrollment access" on public.enrollments for all to authenticated
using (student_id = auth.uid() or exists (select 1 from public.courses c where c.id = course_id and c.trainer_id = auth.uid()) or public.is_admin())
with check (student_id = auth.uid() or public.is_admin());
drop policy if exists "progress access" on public.lesson_progress;
create policy "progress access" on public.lesson_progress for all to authenticated
using (student_id = auth.uid() or public.is_admin()) with check (student_id = auth.uid() or public.is_admin());
drop policy if exists "notification access" on public.notifications;
create policy "notification access" on public.notifications for all to authenticated
using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create index if not exists courses_trainer_id_idx on public.courses(trainer_id);
create index if not exists courses_status_idx on public.courses(status);
create index if not exists enrollments_student_id_idx on public.enrollments(student_id);

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

-- =============================================================================
-- MVP: Trainer Quality Seed Data
-- Demo trainer records for presentation mode.
-- =============================================================================
insert into public.trainer_quality (name, competency, learner_improvement, completion_rate, feedback_score)
values
  ('Dr. Priya Sharma', 'Python, FastAPI, REST API, Backend Development', 90, 85, 89),
  ('Rahul Mehta',      'JavaScript, React, Frontend Engineering',        84, 88, 86),
  ('Dr. Ananya Sen',   'Data Science, SQL, Python Analytics',            88, 82, 91)
on conflict do nothing;

