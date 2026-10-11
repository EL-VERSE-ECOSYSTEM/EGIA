-- Browser clients must not query tenant data directly. Protected data access
-- goes through authenticated server actions until table-specific RLS policies
-- are in place. Keep only the public subject catalogue readable in-browser.
revoke all privileges on all tables in schema public from public, anon, authenticated;
revoke all privileges on all sequences in schema public from public, anon, authenticated;

grant select on table public.subject to anon, authenticated;

alter default privileges in schema public
  revoke all privileges on tables from public, anon, authenticated;
  alter default privileges in schema public
    revoke all privileges on sequences from public, anon, authenticated;