-- Permit the server-only Supabase service role to read and write application
-- tables through the Data API. Browser access remains limited to the public
-- subject catalogue used during registration.

grant usage on schema public to anon, authenticated, service_role;
grant select on table public.subject to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Keep the same server access when future tables or sequences are created.
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
