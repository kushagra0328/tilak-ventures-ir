-- Tilak Ventures IR production schema
create extension if not exists pgcrypto;

create table if not exists public.disclosures (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  publication_date date not null,
  financial_year text,
  period text,
  regulation text,
  exchange_reference text,
  description text,
  file_path text not null,
  file_name text,
  file_size bigint,
  mime_type text default 'application/pdf',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disclosures_public_idx on public.disclosures(status, publication_date desc);
create index if not exists disclosures_category_idx on public.disclosures(category, publication_date desc);

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'publisher' check (role in ('admin','publisher','reviewer')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.disclosures enable row level security;
alter table public.admin_profiles enable row level security;

-- Public visitors can read published disclosures only.
drop policy if exists public_read_published on public.disclosures;
create policy public_read_published on public.disclosures for select using (status = 'published');

-- Authenticated users can read their own admin profile.
drop policy if exists admin_read_own_profile on public.admin_profiles;
create policy admin_read_own_profile on public.admin_profiles for select to authenticated using (user_id = auth.uid());

-- IMPORTANT: production write policies should be added only after the admin role
-- and authentication flow are configured. Never expose service-role credentials client-side.
