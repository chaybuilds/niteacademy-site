
-- Accounting immutability and collection-first manufacturer remittance.
create or replace function public.nr_frozen_order_guard() returns trigger language plpgsql set search_path='' as $$
declare st text;
begin
 if tg_op='DELETE' then
  if old.verification='verified' or old.statement_id is not null then
   raise exception 'verified or statement-linked sales cannot be deleted'; end if;
  return old;
 end if;
 if old.verification='verified' then raise exception 'verified order immutable; post a correction in a new settlement'; end if;
 if new.statement_id is not null then
  select status into st from public.nite_consignment_statements where id=new.statement_id;
  if st<>'draft' then raise exception 'cannot alter sales attached to a finalized statement'; end if;
 end if;
 return new;
end $$;
create trigger nr_order_freeze before update or delete on public.nite_consignment_order_lines
for each row execute function public.nr_frozen_order_guard();
revoke all on function public.nr_frozen_order_guard() from public,anon,authenticated;

create or replace function public.nr_statement_immutable_money() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then
  if old.status<>'draft' then raise exception 'issued statement cannot be deleted'; end if;
  return old;
 end if;
 if old.status in ('verified','invoiced','disputed') and (
   old.user_id is distinct from new.user_id or old.supplier_id is distinct from new.supplier_id
   or old.report_id is distinct from new.report_id
   or old.gross_sales_cents is distinct from new.gross_sales_cents
   or old.amazon_fees_cents is distinct from new.amazon_fees_cents
   or old.refunds_cents is distinct from new.refunds_cents
   or old.other_costs_cents is distinct from new.other_costs_cents
   or old.seller_share_cents is distinct from new.seller_share_cents
   or old.supplier_share_cents is distinct from new.supplier_share_cents
   or old.niterun_fee_cents is distinct from new.niterun_fee_cents
  ) then raise exception 'issued statement immutable; use adjusting statement or credit note'; end if;
 if old.status<>'draft' and new.status='draft' then raise exception 'cannot reset verified statement to draft'; end if;
 return new;
end $$;
create trigger nr_statement_lock before update or delete on public.nite_consignment_statements
for each row execute function public.nr_statement_immutable_money();
revoke all on function public.nr_statement_immutable_money() from public,anon,authenticated;

create or replace function public.nr_validate_payment_event() returns trigger language plpgsql set search_path='' as $$
declare total_due bigint; net_collected bigint; st text;
begin
 select owed_to_niterun_cents,status into total_due,st from public.nite_consignment_statements where id=new.statement_id for update;
 if total_due is null then raise exception 'statement not found'; end if;
 if new.kind='received' and st not in ('verified','invoiced') then raise exception 'statement not authorized for collection'; end if;
 select coalesce(sum(case when kind='received' then amount_cents else -amount_cents end),0) into net_collected
 from public.nite_consignment_payment_events where statement_id=new.statement_id;
 if new.kind='received' and net_collected + new.amount_cents > total_due then raise exception 'collection exceeds amount owed'; end if;
 if new.kind='reversed' and net_collected - new.amount_cents < 0 then raise exception 'reversal exceeds prior collection'; end if;
 return new;
end $$;

create or replace function public.nr_remittance_guard() returns trigger language plpgsql set search_path='' as $$
declare supplier uuid; allowed bigint; collected bigint; already_paid bigint;
begin
 if new.status='paid' and (tg_op='INSERT' or old.status is distinct from 'paid') then
  select supplier_id,supplier_share_cents into supplier,allowed from public.nite_consignment_statements where id=new.statement_id for update;
  if supplier is distinct from new.supplier_id then raise exception 'supplier mismatch for remittance'; end if;
  select coalesce(sum(case when kind='received' then amount_cents else -amount_cents end),0) into collected
   from public.nite_consignment_payment_events where statement_id=new.statement_id;
  select coalesce(sum(amount_cents),0) into already_paid from public.nite_consignment_supplier_remittances
   where statement_id=new.statement_id and status='paid' and id is distinct from new.id;
  if already_paid+new.amount_cents>allowed then raise exception 'supplier remittance exceeds contractual share'; end if;
  if already_paid+new.amount_cents>collected then raise exception 'cannot remit more than NITERUN has actually collected'; end if;
 end if;
 return new;
end $$;
create trigger nr_remittance_safe before insert or update of status,amount_cents on public.nite_consignment_supplier_remittances
for each row execute function public.nr_remittance_guard();
revoke all on function public.nr_remittance_guard() from public,anon,authenticated;

-- Restrict uploads to accounts with a genuine active assigned consignment.
drop policy if exists "nite_academy_owner_upload_evidence" on storage.objects;
create policy "nite_academy_owner_upload_evidence" on storage.objects
for insert to authenticated with check (
 bucket_id='nite-academy-settlements'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.nite_academy_allocations a
             where a.user_id=(select auth.uid()) and a.state in ('shipped','live','settled'))
);
