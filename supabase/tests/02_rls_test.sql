-- RLS assertions. Any failure raises an exception (psql exits non-zero).
\set ON_ERROR_STOP 1
set client_min_messages = warning;

create function pg_temp.expect(label text, actual bigint, expected bigint) returns void
language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'FAIL %: expected %, got %', label, expected, actual;
  end if;
end $$;
grant execute on function pg_temp.expect(text,bigint,bigint) to anon, authenticated;

insert into auth.users (id,email) values
 ('00000000-0000-0000-0000-00000000000a','a@x.com'),
 ('00000000-0000-0000-0000-00000000000b','b@x.com'),
 ('00000000-0000-0000-0000-0000000000ad','admin@x.com');
update profiles set role='admin' where id='00000000-0000-0000-0000-0000000000ad';
insert into applications (id,user_id,donor_type,first_name,last_name,email,phone,date_of_birth,state,zip,eligible)
values ('10000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a','egg','A','A','a@x.com','1','2000-01-01','IL','60601',true),
       ('10000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-00000000000b','egg','B','B','b@x.com','1','2000-01-01','IL','60601',true);
insert into full_applications (application_id, sections) values ('10000000-0000-0000-0000-00000000000b','{"medical":{"x":1}}');
insert into photos (application_id, storage_path) values ('10000000-0000-0000-0000-00000000000b','10000000-0000-0000-0000-00000000000b/p.jpg');
insert into storage.objects (bucket_id,name) values ('donor-photos','10000000-0000-0000-0000-00000000000b/p.jpg');

-- ---- Applicant A cannot see or modify applicant B's data ----
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select pg_temp.expect('A sees only own application', (select count(*) from applications), 1);
select pg_temp.expect('A cannot read B full app', (select count(*) from full_applications), 0);
select pg_temp.expect('A cannot read B photos', (select count(*) from photos), 0);
select pg_temp.expect('A cannot read B storage objects', (select count(*) from storage.objects), 0);
update applications set status='completed', eligible=true;
update profiles set role='admin';
select pg_temp.expect('A cannot read audit log', (select count(*) from audit_log), 0);
do $$ begin
  insert into full_applications (application_id) values ('10000000-0000-0000-0000-00000000000b');
  raise exception 'FAIL: A could insert full app for B';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  insert into storage.objects (bucket_id, name) values ('donor-photos','10000000-0000-0000-0000-00000000000b/evil.jpg');
  raise exception 'FAIL: A could upload into B folder';
exception when insufficient_privilege then null;
end $$;
insert into full_applications (application_id, sections) values ('10000000-0000-0000-0000-00000000000a','{}');
select pg_temp.expect('A can write own full app', (select count(*) from full_applications), 1);
update full_applications set submitted_at = now();
update full_applications set sections = '{"x":1}';
reset role;
select pg_temp.expect('A status unchanged',
  (select count(*) from applications where status='new'), 2);
select pg_temp.expect('A role unchanged',
  (select count(*) from profiles where role='admin'), 1);
select pg_temp.expect('A cannot edit after submit',
  (select count(*) from full_applications where sections = '{}'::jsonb), 1);

-- ---- Anonymous users cannot read or write anything ----
set role anon; reset request.jwt.claim.sub;
select pg_temp.expect('anon reads no applications', (select count(*) from applications), 0);
select pg_temp.expect('anon reads no referrers', (select count(*) from referrers), 0);
do $$ begin
  insert into applications (donor_type,first_name,last_name,email,phone,date_of_birth,state,zip,eligible)
  values ('egg','x','x','x','1','2000-01-01','IL','1',true);
  raise exception 'FAIL: anon could insert application';
exception when insufficient_privilege then null;
end $$;
reset role;

-- ---- Admin sees everything ----
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000ad';
select pg_temp.expect('admin sees all applications', (select count(*) from applications), 2);
select pg_temp.expect('admin sees storage objects', (select count(*) from storage.objects), 1);
reset role;

-- ---- Privileged helper is not callable by end users ----
set role authenticated;
do $$ begin
  perform public.user_id_by_email('a@x.com');
  raise exception 'FAIL: authenticated could call user_id_by_email';
exception when insufficient_privilege then null;
end $$;
reset role;

-- ---- Messages ----
insert into messages (application_id, direction, body, email_status) values
  ('10000000-0000-0000-0000-00000000000a', 'outbound', 'Hi A', 'sent'),
  ('10000000-0000-0000-0000-00000000000b', 'outbound', 'Hi B (private)', 'sent');
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select pg_temp.expect('A sees only own messages', (select count(*) from messages), 1);
insert into messages (application_id, direction, body, author_id)
  values ('10000000-0000-0000-0000-00000000000a', 'inbound', 'Thanks!', '00000000-0000-0000-0000-00000000000a');
do $$ begin
  insert into messages (application_id, direction, body, author_id)
    values ('10000000-0000-0000-0000-00000000000a', 'outbound', 'fake coordinator msg', '00000000-0000-0000-0000-00000000000a');
  raise exception 'FAIL: applicant posted an outbound message';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  insert into messages (application_id, direction, body, author_id)
    values ('10000000-0000-0000-0000-00000000000b', 'inbound', 'into B thread', '00000000-0000-0000-0000-00000000000a');
  raise exception 'FAIL: applicant posted into another thread';
exception when insufficient_privilege then null;
end $$;
update messages set body = 'edited';
delete from messages;
reset role;
select pg_temp.expect('applicant cannot edit/delete messages',
  (select count(*) from messages where body = 'edited'), 0);
select pg_temp.expect('messages intact', (select count(*) from messages), 3);
set role anon; reset request.jwt.claim.sub;
select pg_temp.expect('anon reads no messages', (select count(*) from messages), 0);
reset role;

-- ---- Staff roles: coordinator edits, viewer reads only, partner/parent see nothing ----
insert into auth.users (id,email) values
 ('00000000-0000-0000-0000-0000000000c0','coord@x.com'),
 ('00000000-0000-0000-0000-0000000000e0','viewer@x.com'),
 ('00000000-0000-0000-0000-0000000000f0','partner@x.com'),
 ('00000000-0000-0000-0000-0000000000f1','parent@x.com');
update profiles set role='coordinator' where id='00000000-0000-0000-0000-0000000000c0';
update profiles set role='viewer' where id='00000000-0000-0000-0000-0000000000e0';
update profiles set role='partner' where id='00000000-0000-0000-0000-0000000000f0';
update profiles set role='parent' where id='00000000-0000-0000-0000-0000000000f1';

set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c0';
select pg_temp.expect('coordinator reads all applications', (select count(*) from applications), 2);
select pg_temp.expect('coordinator reads all full apps', (select count(*) from full_applications), 2);
update applications set status='screening' where id='10000000-0000-0000-0000-00000000000b';
insert into admin_notes (application_id, author_id, body)
  values ('10000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-0000000000c0','coord note');
update profiles set role='admin' where id='00000000-0000-0000-0000-0000000000c0';
do $$ begin
  delete from applications;
  if (select count(*) from applications) <> 2 then raise exception 'FAIL: coordinator deleted applications'; end if;
end $$;
reset role;
select pg_temp.expect('coordinator changed status',
  (select count(*) from applications where status='screening'), 1);
select pg_temp.expect('coordinator cannot promote self',
  (select count(*) from profiles where id='00000000-0000-0000-0000-0000000000c0' and role='coordinator'), 1);

set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e0';
select pg_temp.expect('viewer reads all applications', (select count(*) from applications), 2);
select pg_temp.expect('viewer reads notes', (select count(*) from admin_notes), 1);
update applications set status='rejected';
do $$ begin
  insert into admin_notes (application_id, author_id, body)
    values ('10000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-0000000000e0','viewer note');
  raise exception 'FAIL: viewer added a note';
exception when insufficient_privilege then null;
end $$;
reset role;
select pg_temp.expect('viewer cannot change status',
  (select count(*) from applications where status='rejected'), 0);

set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f0';
select pg_temp.expect('partner reads no applications', (select count(*) from applications), 0);
select pg_temp.expect('partner reads no full apps', (select count(*) from full_applications), 0);
select pg_temp.expect('partner reads no storage objects', (select count(*) from storage.objects), 0);
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
select pg_temp.expect('parent reads no applications', (select count(*) from applications), 0);
select pg_temp.expect('parent reads no messages', (select count(*) from messages), 0);
reset role;

-- ---- Owner (super admin): only one; admins cannot change roles ----
insert into auth.users (id,email) values
 ('00000000-0000-0000-0000-0000000000a0','owner@x.com'),
 ('00000000-0000-0000-0000-0000000000a1','owner2@x.com');
update profiles set role='owner' where id='00000000-0000-0000-0000-0000000000a0';
do $$ begin
  update profiles set role='owner' where id='00000000-0000-0000-0000-0000000000a1';
  raise exception 'FAIL: a second owner was allowed';
exception when unique_violation then null;
end $$;

set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000ad';
update profiles set role='applicant' where id='00000000-0000-0000-0000-0000000000a0';
update profiles set role='admin' where id='00000000-0000-0000-0000-0000000000e0';
select pg_temp.expect('admin still reads all applications', (select count(*) from applications), 2);
reset role;
select pg_temp.expect('admin cannot demote the owner',
  (select count(*) from profiles where role='owner'), 1);
select pg_temp.expect('admin cannot promote to admin',
  (select count(*) from profiles where id='00000000-0000-0000-0000-0000000000e0' and role='viewer'), 1);

set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a0';
select pg_temp.expect('owner reads all applications', (select count(*) from applications), 2);
update profiles set role='coordinator' where id='00000000-0000-0000-0000-0000000000e0';
do $$ begin
  update profiles set role='owner' where id='00000000-0000-0000-0000-0000000000ad';
  raise exception 'FAIL: owner handed out a second owner role';
exception when insufficient_privilege or unique_violation then null;
end $$;
reset role;
select pg_temp.expect('owner can change roles',
  (select count(*) from profiles where id='00000000-0000-0000-0000-0000000000e0' and role='coordinator'), 1);
update profiles set role='viewer' where id='00000000-0000-0000-0000-0000000000e0';

\echo 'All RLS assertions passed'
