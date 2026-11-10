
-- Individual-plan seller report intake: private evidence with a zero-trust review status.
-- The Storage bucket is created private; only the owner can upload or read their report.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('nite-academy-settlements','nite-academy-settlements',false,5242880,array['text/plain','text/csv','text/tab-separated-values','application/xml','text/xml','application/vnd.ms-excel'])
on conflict(id) do nothing;
create policy "nite_academy_owner_upload_evidence" on storage.objects
for insert to authenticated
with check (
 bucket_id='nite-academy-settlements'
 and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "nite_academy_owner_read_evidence" on storage.objects
for select to authenticated
using (
 bucket_id='nite-academy-settlements'
 and (storage.foldername(name))[1] = (select auth.uid())::text
);
alter table public.nite_consignment_reports add constraint nr_report_seller_evidence_required
check(source_type <> 'seller_report' or (evidence_storage_key is not null and evidence_sha256 is not null));
grant usage on sequence public.nr_report_code_seq to authenticated;
grant insert(user_id,amazon_settlement_id,period_start,period_end,account_disbursement_cents,evidence_storage_key,evidence_sha256,source_type)
on public.nite_consignment_reports to authenticated;
create policy nr_report_seller_submit on public.nite_consignment_reports
for insert to authenticated with check(
 (select auth.uid())=user_id
 and source_type='seller_report'
 and evidence_storage_key like ((select auth.uid())::text||'/%')
 and evidence_sha256 ~ '^[0-9a-f]{64}$'
 and period_start<=period_end and period_end<=current_date
 and review_status='unverified'
 and exists(select 1 from public.nite_academy_allocations a
            where a.user_id=(select auth.uid())
            and a.state in ('shipped','live','settled'))
);
