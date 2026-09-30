-- Beldium Careers Hub: applications + logistics partner registrations

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null unique,
  pathway text not null check (pathway in ('internship', 'volunteer', 'partnership')),
  full_name text not null,
  email text not null,
  phone text not null,
  country text not null,
  state text not null,
  city text not null,
  linkedin text not null,
  portfolio text,
  resume_path text,
  headshot_path text,
  company_profile_path text,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists applications_pathway_idx on public.applications (pathway);
create index if not exists applications_created_at_idx on public.applications (created_at desc);

alter table public.applications enable row level security;

-- Public applicants may submit (insert) their own application, but cannot
-- read back any application data (including other people's).
create policy "Anyone can submit an application"
  on public.applications for insert
  to anon
  with check (true);

create table if not exists public.logistics_partner_applications (
  id uuid primary key default gen_random_uuid(),
  application_id text not null unique,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'info_requested', 'approved', 'dashboard_active')),
  company jsonb not null,
  document_paths jsonb not null default '{}'::jsonb,
  agreements jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists logistics_partner_applications_status_idx
  on public.logistics_partner_applications (status);

alter table public.logistics_partner_applications enable row level security;

create policy "Anyone can submit a partner application"
  on public.logistics_partner_applications for insert
  to anon
  with check (true);

-- Applicants can check the status of their own application by its id.
create policy "Anyone can read partner application status by id"
  on public.logistics_partner_applications for select
  to anon
  using (true);

-- Storage buckets for uploaded documents (private; not publicly listable/readable).
insert into storage.buckets (id, name, public)
values ('application-documents', 'application-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('partner-documents', 'partner-documents', false)
on conflict (id) do nothing;

create policy "Anyone can upload application documents"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'application-documents');

create policy "Anyone can upload partner documents"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'partner-documents');
