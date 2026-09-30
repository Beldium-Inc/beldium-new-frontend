-- Tables created via the SQL Editor don't get Supabase's default anon/authenticated
-- grants (those are normally added automatically by the Table Editor UI). Without an
-- explicit GRANT, RLS policies for the `anon` role never get a chance to evaluate and
-- Postgres reports it as an RLS violation. Add the grants explicitly.

grant usage on schema public to anon, authenticated;

grant insert on public.applications to anon;
grant select, insert on public.logistics_partner_applications to anon;

grant usage on schema storage to anon, authenticated;
grant insert on storage.objects to anon;
grant select on storage.buckets to anon;
