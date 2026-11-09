-- More roles: coordinator / viewer (internal staff), partner / parent
-- (anonymous donor catalog). Idempotent: safe to run more than once.
--
--   admin        everything (export, delete, team management)
--   coordinator  read + work applications (status, notes, messages)
--   viewer       read-only applications
--   partner      catalog only (served by the server; no table access)
--   parent       catalog only (served by the server; no table access)

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('applicant','admin','coordinator','viewer','partner','parent'));

create or replace function public.current_role_name() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Internal staff who may read applications.
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('admin','coordinator','viewer'));
$$;

-- Staff who may change applications (status, notes, messages).
create or replace function public.can_edit_applications() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('admin','coordinator'));
$$;

-- Read access for all staff (admins keep their existing "for all" policies).
drop policy if exists applications_select_own on public.applications;
create policy applications_select_own on public.applications for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists applications_staff_update on public.applications;
create policy applications_staff_update on public.applications for update to authenticated
  using (public.can_edit_applications()) with check (public.can_edit_applications());

drop policy if exists full_apps_select on public.full_applications;
create policy full_apps_select on public.full_applications for select to authenticated
  using (public.owns_application(application_id) or public.is_staff());

drop policy if exists photos_select on public.photos;
create policy photos_select on public.photos for select to authenticated
  using (public.owns_application(application_id) or public.is_staff());

drop policy if exists referrers_staff_select on public.referrers;
create policy referrers_staff_select on public.referrers for select to authenticated
  using (public.is_staff());

drop policy if exists admin_notes_staff_select on public.admin_notes;
create policy admin_notes_staff_select on public.admin_notes for select to authenticated
  using (public.is_staff());
drop policy if exists admin_notes_staff_insert on public.admin_notes;
create policy admin_notes_staff_insert on public.admin_notes for insert to authenticated
  with check (public.can_edit_applications() and author_id = auth.uid());

drop policy if exists audit_log_staff_select on public.audit_log;
create policy audit_log_staff_select on public.audit_log for select to authenticated
  using (public.is_staff());

drop policy if exists messages_staff_select on public.messages;
create policy messages_staff_select on public.messages for select to authenticated
  using (public.is_staff());
drop policy if exists messages_staff_insert on public.messages;
create policy messages_staff_insert on public.messages for insert to authenticated
  with check (public.can_edit_applications() and direction = 'outbound' and author_id = auth.uid());
drop policy if exists messages_staff_update on public.messages;
create policy messages_staff_update on public.messages for update to authenticated
  using (public.can_edit_applications()) with check (public.can_edit_applications());

drop policy if exists donor_photos_staff_select on storage.objects;
create policy donor_photos_staff_select on storage.objects for select to authenticated
  using (bucket_id = 'donor-photos' and public.is_staff());

-- Dashboard stats: all staff.
create or replace function public.admin_stats(p_week_start timestamptz)
returns json
language plpgsql stable security invoker set search_path = public as $$
declare result json;
begin
  if not public.is_staff() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select json_build_object(
    'total', (select count(*) from applications),
    'this_week', (select count(*) from applications where created_at >= p_week_start),
    'eligible', (select count(*) from applications where eligible),
    'by_source', coalesce((
      select json_agg(json_build_object('source', src, 'count', n) order by n desc)
      from (select coalesce(nullif(how_heard, ''), 'Not specified') as src, count(*) as n
            from applications group by 1) s
    ), '[]'::json)
  ) into result;
  return result;
end $$;

grant execute on function public.is_staff() to authenticated;
grant execute on function public.can_edit_applications() to authenticated;
grant execute on function public.current_role_name() to authenticated;
