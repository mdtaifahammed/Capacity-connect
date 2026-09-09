create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text,
  created_at timestamptz default now()
);

create table if not exists public.role_skills (
  role_id uuid references public.roles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  required_level numeric(5,2) not null check (required_level between 0 and 100),
  primary key(role_id, skill_id)
);

create table if not exists public.skill_gap_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  role text not null,
  skills jsonb not null,
  created_at timestamptz default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  skill text not null,
  score numeric(5,2) not null check (score between 0 and 100),
  created_at timestamptz default now()
);

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.knowledge_documents(id) on delete cascade,
  title text,
  content text not null,
  source text,
  embedding vector(1536),
  created_at timestamptz default now()
);

create table if not exists public.trainer_quality (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  competency text not null,
  learner_improvement numeric(5,2) default 0,
  completion_rate numeric(5,2) default 0,
  feedback_score numeric(5,2) default 0,
  quality_score numeric(5,2) generated always as (
    learner_improvement * 0.40 + completion_rate * 0.30 + feedback_score * 0.30
  ) stored
);

-- Seed roles
insert into public.roles(name, description) values
('Full Stack Developer','Frontend, backend, databases and deployment'),
('Frontend Developer','Modern web interfaces and frontend engineering'),
('Backend Developer','APIs, databases and server-side development'),
('Data Analyst','Data analysis, statistics and visualization')
on conflict (name) do nothing;

-- RLS: enable before exposing tables through the browser/Data API.
alter table public.roles enable row level security;
alter table public.skills enable row level security;
alter table public.role_skills enable row level security;
alter table public.skill_gap_analyses enable row level security;
alter table public.assessments enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.trainer_quality enable row level security;

-- Public read policies for catalogue/knowledge/trainer information.
drop policy if exists "public read roles" on public.roles;
create policy "public read roles" on public.roles for select using (true);

drop policy if exists "public read skills" on public.skills;
create policy "public read skills" on public.skills for select using (true);

drop policy if exists "public read role skills" on public.role_skills;
create policy "public read role skills" on public.role_skills for select using (true);

drop policy if exists "public read knowledge chunks" on public.knowledge_chunks;
create policy "public read knowledge chunks" on public.knowledge_chunks for select using (true);

drop policy if exists "public read trainers" on public.trainer_quality;
create policy "public read trainers" on public.trainer_quality for select using (true);

-- For production, replace these demo insert policies with authenticated-user policies.
drop policy if exists "demo insert skill gap" on public.skill_gap_analyses;
create policy "demo insert skill gap" on public.skill_gap_analyses for insert with check (true);

drop policy if exists "demo insert assessments" on public.assessments;
create policy "demo insert assessments" on public.assessments for insert with check (true);


-- Vector/RAG preparation. Supabase supports pgvector for storing embeddings and similarity search.
create index if not exists knowledge_chunks_embedding_idx
on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);

-- =============================================================================
-- MVP EXTENSION TABLES
-- Run this section after the base schema above.
-- =============================================================================

-- Learning modules (5 gap-closing modules)
create table if not exists public.learning_modules (
  id           uuid primary key default gen_random_uuid(),
  skill        text not null,
  title        text not null,
  description  text not null default '',
  objectives   jsonb not null default '[]'::jsonb,
  resources    jsonb not null default '[]'::jsonb,
  questions    jsonb not null default '[]'::jsonb,
  difficulty   text not null default 'Beginner'
                 check (difficulty in ('Beginner','Intermediate','Advanced')),
  duration_hrs numeric(4,1) not null default 1,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

-- Per-user module completion
create table if not exists public.learning_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,
  module_id    uuid references public.learning_modules(id) on delete cascade,
  completed    boolean not null default false,
  score        numeric(5,2) check (score between 0 and 100),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique nulls not distinct (user_id, module_id)
);

-- Projects
create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null default '',
  required_skills jsonb not null default '[]'::jsonb,
  difficulty      text not null default 'Intermediate',
  duration_hrs    integer not null default 8,
  tasks           jsonb not null default '[]'::jsonb,
  eval_criteria   jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);

-- Project submissions
create table if not exists public.project_submissions (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects(id) on delete cascade,
  user_id      uuid,
  github_url   text,
  demo_url     text,
  description  text,
  score        numeric(5,2) check (score between 0 and 100),
  feedback     text,
  submitted_at timestamptz not null default now()
);

-- Practical assessments (scenario-based)
create table if not exists public.practical_assessments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  answers     jsonb not null default '{}'::jsonb,
  score       numeric(5,2) check (score between 0 and 100),
  status      text not null default 'pending'
                check (status in ('pending','passed','failed')),
  assessed_at timestamptz not null default now()
);

-- Competency records (composite verification)
create table if not exists public.competencies (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid,
  role              text not null,
  course_completion numeric(5,2) default 0,
  assessment_score  numeric(5,2) default 0,
  practical_score   numeric(5,2) default 0,
  project_score     numeric(5,2) default 0,
  composite_score   numeric(5,2) generated always as (
    course_completion * 0.25 + assessment_score * 0.25 +
    practical_score   * 0.30 + project_score   * 0.20
  ) stored,
  verified          boolean not null default false,
  verified_at       timestamptz,
  created_at        timestamptz not null default now()
);

-- Certifications (issued only when competency verified)
create table if not exists public.certifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid,
  competency_id  uuid references public.competencies(id) on delete cascade,
  title          text not null,
  skill          text not null,
  certificate_id text unique not null
                   default 'CC-' || upper(substring(md5(random()::text), 1, 8)),
  issued_at      timestamptz not null default now()
);

-- Skill passports (aggregated verified skill snapshot)
create table if not exists public.skill_passports (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique,
  full_name       text,
  target_role     text,
  verified_skills jsonb not null default '{}'::jsonb,
  projects        jsonb not null default '[]'::jsonb,
  certifications  jsonb not null default '[]'::jsonb,
  competencies    jsonb not null default '[]'::jsonb,
  updated_at      timestamptz not null default now()
);

-- Opportunities
create table if not exists public.opportunities (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  company         text,
  type            text not null default 'Internship',
  description     text,
  required_skills jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);

-- Opportunity match scores per user
create table if not exists public.opportunity_matches (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  match_pct      numeric(5,2) not null default 0,
  met_skills     jsonb not null default '[]'::jsonb,
  missing_skills jsonb not null default '[]'::jsonb,
  matched_at     timestamptz not null default now()
);

-- =============================================================================
-- RLS for MVP tables
-- =============================================================================
alter table public.learning_modules      enable row level security;
alter table public.learning_progress     enable row level security;
alter table public.projects              enable row level security;
alter table public.project_submissions   enable row level security;
alter table public.practical_assessments enable row level security;
alter table public.competencies          enable row level security;
alter table public.certifications        enable row level security;
alter table public.skill_passports       enable row level security;
alter table public.opportunities         enable row level security;
alter table public.opportunity_matches   enable row level security;

-- Public read (catalogue tables)
drop policy if exists "public read modules" on public.learning_modules;
create policy "public read modules" on public.learning_modules for select using (true);

drop policy if exists "public read projects" on public.projects;
create policy "public read projects" on public.projects for select using (true);

drop policy if exists "public read opportunities" on public.opportunities;
create policy "public read opportunities" on public.opportunities for select using (true);

-- Demo/anon insert + read policies (tighten for production)
drop policy if exists "demo insert progress" on public.learning_progress;
create policy "demo insert progress" on public.learning_progress for insert with check (true);

drop policy if exists "demo read progress" on public.learning_progress;
create policy "demo read progress" on public.learning_progress for select using (true);

drop policy if exists "demo insert submissions" on public.project_submissions;
create policy "demo insert submissions" on public.project_submissions for insert with check (true);

drop policy if exists "demo read submissions" on public.project_submissions;
create policy "demo read submissions" on public.project_submissions for select using (true);

drop policy if exists "demo insert practical" on public.practical_assessments;
create policy "demo insert practical" on public.practical_assessments for insert with check (true);

drop policy if exists "demo read practical" on public.practical_assessments;
create policy "demo read practical" on public.practical_assessments for select using (true);

drop policy if exists "demo insert competencies" on public.competencies;
create policy "demo insert competencies" on public.competencies for insert with check (true);

drop policy if exists "demo read competencies" on public.competencies;
create policy "demo read competencies" on public.competencies for select using (true);

drop policy if exists "demo insert certifications" on public.certifications;
create policy "demo insert certifications" on public.certifications for insert with check (true);

drop policy if exists "demo read certifications" on public.certifications;
create policy "demo read certifications" on public.certifications for select using (true);

drop policy if exists "demo insert passport" on public.skill_passports;
create policy "demo insert passport" on public.skill_passports for insert with check (true);

drop policy if exists "demo upsert passport" on public.skill_passports;
create policy "demo upsert passport" on public.skill_passports for update using (true);

drop policy if exists "demo read passport" on public.skill_passports;
create policy "demo read passport" on public.skill_passports for select using (true);

drop policy if exists "demo insert matches" on public.opportunity_matches;
create policy "demo insert matches" on public.opportunity_matches for insert with check (true);

drop policy if exists "demo read matches" on public.opportunity_matches;
create policy "demo read matches" on public.opportunity_matches for select using (true);


-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Learning modules
insert into public.learning_modules (skill, title, description, difficulty, duration_hrs, position, objectives, resources) values
(
  'REST API',
  'REST API Fundamentals',
  'Learn HTTP methods, status codes, request/response cycles and how to design clean, predictable REST endpoints.',
  'Beginner', 3, 1,
  '["Understand HTTP methods: GET, POST, PUT, DELETE", "Design resource-based URL structures", "Handle status codes (200, 201, 400, 401, 404, 500)", "Parse JSON request and response bodies", "Test endpoints with curl and Postman"]'::jsonb,
  '[{"title":"MDN HTTP Overview","url":"https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview","type":"article"},{"title":"REST API Design Guide","url":"https://restfulapi.net","type":"article"}]'::jsonb
),
(
  'SQL',
  'SQL & Database Design',
  'Master SELECT, JOIN, GROUP BY, indexes, transactions and schema design patterns used in real production databases.',
  'Beginner', 4, 2,
  '["Write SELECT queries with WHERE and ORDER BY", "Use INNER JOIN, LEFT JOIN across related tables", "Aggregate data with GROUP BY and HAVING", "Create indexes for query performance", "Design normalized schemas (1NF, 2NF, 3NF)"]'::jsonb,
  '[{"title":"SQLZoo Interactive Tutorial","url":"https://sqlzoo.net","type":"interactive"},{"title":"PostgreSQL Documentation","url":"https://www.postgresql.org/docs/current/tutorial.html","type":"docs"}]'::jsonb
),
(
  'FastAPI',
  'FastAPI Backend Development',
  'Build async Python APIs with FastAPI, Pydantic models, dependency injection, and auto-generated OpenAPI documentation.',
  'Intermediate', 5, 3,
  '["Create GET and POST endpoints with path and query parameters", "Define Pydantic request and response models", "Use dependency injection for auth and DB", "Return structured JSON responses with correct status codes", "Read FastAPI auto-generated /docs"]'::jsonb,
  '[{"title":"FastAPI Official Tutorial","url":"https://fastapi.tiangolo.com/tutorial/","type":"docs"},{"title":"Pydantic Docs","url":"https://docs.pydantic.dev","type":"docs"}]'::jsonb
),
(
  'Authentication',
  'Authentication & Security',
  'Implement JWT authentication, secure password hashing, session management and role-based access control in a Python API.',
  'Intermediate', 3, 4,
  '["Hash passwords with bcrypt", "Issue and verify JWT tokens", "Protect routes with Bearer token middleware", "Implement role-based access (student/trainer/admin)", "Understand CORS and security headers"]'::jsonb,
  '[{"title":"JWT Introduction","url":"https://jwt.io/introduction","type":"article"},{"title":"OWASP Authentication Cheat Sheet","url":"https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html","type":"article"}]'::jsonb
),
(
  'Full Stack',
  'Full Stack Integration',
  'Connect a JavaScript frontend to a FastAPI backend backed by PostgreSQL. Deploy the complete application end-to-end.',
  'Advanced', 8, 5,
  '["Wire fetch() calls from HTML/JS to FastAPI endpoints", "Handle auth tokens in frontend requests", "Display API data with DOM manipulation", "Connect FastAPI to Supabase/PostgreSQL", "Deploy frontend and backend together"]'::jsonb,
  '[{"title":"MDN Fetch API","url":"https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch","type":"article"},{"title":"Supabase Quickstart","url":"https://supabase.com/docs/guides/getting-started","type":"docs"}]'::jsonb
)
on conflict do nothing;

-- Demo project
insert into public.projects (title, description, required_skills, difficulty, duration_hrs, tasks, eval_criteria) values
(
  'Full Stack Task Manager',
  'Build a complete task management application using HTML, CSS, JavaScript, Python, FastAPI and PostgreSQL with full CRUD operations and user authentication.',
  '["HTML","CSS","JavaScript","Python","FastAPI","SQL","REST API","Authentication"]'::jsonb,
  'Intermediate', 8,
  '[{"id":"t1","label":"Create responsive HTML/CSS frontend with task list UI"},{"id":"t2","label":"Build REST API with FastAPI (GET, POST, PUT, DELETE tasks)"},{"id":"t3","label":"Connect PostgreSQL database via Supabase"},{"id":"t4","label":"Implement full CRUD for tasks"},{"id":"t5","label":"Add JWT authentication for protected routes"}]'::jsonb,
  '["Working CRUD endpoints (all 4 methods)","JWT authentication implemented","Database connected and persisting data","Responsive UI on mobile and desktop","Clean, readable code structure"]'::jsonb
)
on conflict do nothing;

-- Sample opportunities
insert into public.opportunities (title, company, type, description, required_skills) values
(
  'Frontend Developer Internship',
  'TechStart India',
  'Internship',
  'Build responsive web interfaces for a fast-growing SaaS product. Work alongside senior engineers.',
  '[{"skill":"HTML","level":70},{"skill":"CSS","level":70},{"skill":"JavaScript","level":80},{"skill":"Git","level":60}]'::jsonb
),
(
  'Backend Developer Internship',
  'DataBridge Solutions',
  'Internship',
  'Develop and maintain Python REST APIs connected to PostgreSQL. Own features end-to-end.',
  '[{"skill":"Python","level":75},{"skill":"FastAPI","level":70},{"skill":"SQL","level":75},{"skill":"REST API","level":80},{"skill":"Git","level":65}]'::jsonb
),
(
  'Junior Full Stack Internship',
  'BuildFast Technologies',
  'Internship',
  'End-to-end feature development across frontend and backend. Great for full stack learners.',
  '[{"skill":"JavaScript","level":75},{"skill":"Python","level":70},{"skill":"SQL","level":70},{"skill":"REST API","level":75},{"skill":"Git","level":65}]'::jsonb
),
(
  'Python Developer Internship',
  'Analytics Hub',
  'Internship',
  'Automate data pipelines and build internal tooling with Python. Work with real datasets.',
  '[{"skill":"Python","level":80},{"skill":"SQL","level":70},{"skill":"Git","level":65}]'::jsonb
),
(
  'Web Development Project',
  'GovTech Initiative',
  'Project',
  'Build a civic data portal as a funded freelance project. Open source, portfolio-ready.',
  '[{"skill":"HTML","level":70},{"skill":"CSS","level":70},{"skill":"JavaScript","level":75},{"skill":"REST API","level":65}]'::jsonb
)
on conflict do nothing;

-- =============================================================================
-- ADDITIONAL MVP TABLES
-- =============================================================================

-- Trainer feedback (referenced by app.py but was missing)
create table if not exists public.trainer_feedback (
  id uuid primary key default gen_random_uuid(),
  trainer_name text not null,
  learner_name text not null,
  rating numeric(3,1) not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz default now()
);

alter table public.trainer_feedback enable row level security;
drop policy if exists "public read feedback" on public.trainer_feedback;
create policy "public read feedback" on public.trainer_feedback for select using (true);
drop policy if exists "demo insert feedback" on public.trainer_feedback;
create policy "demo insert feedback" on public.trainer_feedback for insert with check (true);

-- Announcements (for admin dashboard)
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  author_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.announcements enable row level security;
drop policy if exists "public read announcements" on public.announcements;
create policy "public read announcements" on public.announcements for select using (true);
drop policy if exists "demo insert announcements" on public.announcements;
create policy "demo insert announcements" on public.announcements for insert with check (true);
drop policy if exists "demo delete announcements" on public.announcements;
create policy "demo delete announcements" on public.announcements for delete using (true);

-- Missing RLS policy for knowledge_documents (was enabled but had no policies)
drop policy if exists "public read knowledge docs" on public.knowledge_documents;
create policy "public read knowledge docs" on public.knowledge_documents for select using (true);
