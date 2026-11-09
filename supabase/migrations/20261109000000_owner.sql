-- Super admin ("owner"): exactly one, set only via SQL, can't be changed
-- from the website. Owner = admin + may grant/revoke the admin role.
-- Idempotent: safe to run more than once.
--
-- Make yourself the owner (run once, with your own email):
--   update public.profiles set role = 'owner'
--   where id = (select id from auth.users where email = 'you@example.com');

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('applicant','owner','admin','coordinator','viewer','partner','parent'));

-- At most one owner.
create unique index if not exists profiles_single_owner on public.profiles ((true))
  where role = 'owner';

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner');
$$;

-- The owner counts as an admin everywhere existing policies use is_admin().
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('owner','admin'));
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('owner','admin','coordinator','viewer'));
$$;

create or replace function public.can_edit_applications() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('owner','admin','coordinator'));
$$;

-- Roles can no longer be changed with a user's own session (not even an
-- admin's). The website changes them only through the server, which
-- enforces: nobody touches the owner; only the owner grants/revokes admin.
drop policy if exists profiles_admin_write on public.profiles;
drop policy if exists profiles_owner_write on public.profiles;
create policy profiles_owner_write on public.profiles for all to authenticated
  using (public.is_owner()) with check (public.is_owner() and role <> 'owner');

grant execute on function public.is_owner() to authenticated;
