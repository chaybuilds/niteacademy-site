
-- Final accounting gates: no late order insertion or mutation after statement issuance.
create or replace function public.nr_validate_order_assignment() returns trigger language plpgsql set search_path='' as $$
declare a_user uuid; r_user uuid; r_status text; s_user uuid; s_sup uuid; lot_supplier uuid; st text;
begin
 select user_id into a_user from public.nite_academy_allocations where id=new.allocation_id;
 select user_id,review_status into r_user,r_status from public.nite_consignment_reports where id=new.report_id;
 if a_user is distinct from new.user_id or r_user is distinct from new.user_id then
  raise exception 'seller, allocation and report must have the same owner'; end if;
 if new.statement_id is not null then
  select user_id,supplier_id,status into s_user,s_sup,st from public.nite_consignment_statements where id=new.statement_id;
  select l.supplier_id into lot_supplier from public.nite_academy_allocations a
    join public.nite_consignment_lots l on l.id=a.lot_id where a.id=new.allocation_id;
  if s_user is distinct from new.user_id or s_sup is distinct from lot_supplier then
   raise exception 'statement supplier/seller does not match order allocation'; end if;
  if st <> 'draft' then raise exception 'finalized statement does not accept additional order records'; end if;
 end if;
 if new.verification='verified' and r_status<>'verified' then
  raise exception 'cannot verify a sale against an unverified Amazon report'; end if;
 return new;
end $$;

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
  ) then raise exception 'issued statement immutable; use a correcting statement'; end if;
 if old.status in ('verified','invoiced','disputed') and new.status in ('draft','void')
 then raise exception 'issued statement cannot be reset or silently voided'; end if;
 return new;
end $$;

create or replace function public.nr_remittance_guard() returns trigger language plpgsql set search_path='' as $$
declare supplier uuid; allowed bigint; collected bigint; already_paid bigint;
begin
 if tg_op='UPDATE' and old.status='paid' and (
  new.status is distinct from old.status or new.amount_cents is distinct from old.amount_cents
  or new.payment_reference is distinct from old.payment_reference
  or new.paid_at is distinct from old.paid_at)
 then raise exception 'settled supplier remittance immutable; record a correcting event'; end if;
 if new.status='paid' then
  select supplier_id,supplier_share_cents into supplier,allowed from public.nite_consignment_statements where id=new.statement_id for update;
  if supplier is distinct from new.supplier_id then raise exception 'supplier mismatch for remittance'; end if;
  select coalesce(sum(case when kind='received' then amount_cents else -amount_cents end),0) into collected
   from public.nite_consignment_payment_events where statement_id=new.statement_id;
  select coalesce(sum(amount_cents),0) into already_paid from public.nite_consignment_supplier_remittances
   where statement_id=new.statement_id and status='paid' and id is distinct from new.id;
  if already_paid+new.amount_cents>allowed then raise exception 'supplier remittance exceeds contractual share'; end if;
  if already_paid+new.amount_cents>collected then raise exception 'cannot remit more than NITERUN collected'; end if;
 end if;
 return new;
end $$;
