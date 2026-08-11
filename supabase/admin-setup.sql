-- Run this AFTER creating the first admin user in Supabase Auth.
-- Replace the email below with the exact email used for that admin account.

insert into public.admin_profiles (user_id, full_name, role, active)
select id, 'Company Administrator', 'admin', true
from auth.users
where email = 'tilakfin@gmail.com'
on conflict (user_id) do update
set role = 'admin', active = true;

-- Role helper used by RLS policies. SECURITY DEFINER prevents recursive
-- policy evaluation when checking the admin_profiles table.
create or replace function public.is_active_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
      and active = true
      and role in ('admin','publisher')
  );
$$;

revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_admin() to authenticated;

-- Authenticated administrators/publishers can manage disclosure records.
drop policy if exists admin_manage_disclosures on public.disclosures;
create policy admin_manage_disclosures
on public.disclosures
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

-- Automatically set updated_at when a disclosure changes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists disclosures_set_updated_at on public.disclosures;
create trigger disclosures_set_updated_at
before update on public.disclosures
for each row execute function public.set_updated_at();
