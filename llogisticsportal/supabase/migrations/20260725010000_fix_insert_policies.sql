-- Re-apply insert policies idempotently in case the initial migration run
-- did not fully create them (RLS was on but inserts were being rejected).

drop policy if exists "Anyone can submit an application" on public.applications;
create policy "Anyone can submit an application"
  on public.applications for insert
  to anon
  with check (true);

drop policy if exists "Anyone can submit a partner application" on public.logistics_partner_applications;
create policy "Anyone can submit a partner application"
  on public.logistics_partner_applications for insert
  to anon
  with check (true);

drop policy if exists "Anyone can read partner application status by id" on public.logistics_partner_applications;
create policy "Anyone can read partner application status by id"
  on public.logistics_partner_applications for select
  to anon
  using (true);

drop policy if exists "Anyone can upload application documents" on storage.objects;
create policy "Anyone can upload application documents"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'application-documents');

drop policy if exists "Anyone can upload partner documents" on storage.objects;
create policy "Anyone can upload partner documents"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'partner-documents');
