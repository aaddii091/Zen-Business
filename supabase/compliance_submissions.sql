create table if not exists public.compliance_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_name text not null,
  school_name text not null,
  email text not null,
  phone text,
  is_cbse boolean not null,
  overall_score integer not null,
  band text not null,
  section_scores jsonb not null,
  answers jsonb not null,
  gaps jsonb not null
);

create index if not exists compliance_submissions_email_school_created_idx
  on public.compliance_submissions (email, school_name, created_at desc);

create index if not exists compliance_submissions_created_idx
  on public.compliance_submissions (created_at desc);
