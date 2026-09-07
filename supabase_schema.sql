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
create policy "public read roles" on public.roles for select using (true);
create policy "public read skills" on public.skills for select using (true);
create policy "public read role skills" on public.role_skills for select using (true);
create policy "public read knowledge chunks" on public.knowledge_chunks for select using (true);
create policy "public read trainers" on public.trainer_quality for select using (true);

-- For production, replace these demo insert policies with authenticated-user policies.
create policy "demo insert skill gap" on public.skill_gap_analyses for insert with check (true);
create policy "demo insert assessments" on public.assessments for insert with check (true);

-- Vector/RAG preparation. Supabase supports pgvector for storing embeddings and similarity search.
create index if not exists knowledge_chunks_embedding_idx
on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);
