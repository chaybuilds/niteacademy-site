
-- Verified order-level traceability: no statement can become payable without matching order lines.
create sequence if not exists public.nr_order_code_seq;
create table if not exists public.nite_consignment_order_lines (
 id uuid primary key default gen_random_uuid(),
 order_code text not null unique default ('ORD-'||lpad(nextval('public.nr_order_code_seq')::text,6,'0')),
 user_id uuid not null references auth.users(id) on delete cascade,
 allocation_id uuid not null references public.nite_academy_allocations(id),
 report_id uuid not null references public.nite_consignment_reports(id),
 statement_id uuid references public.nite_consignment_statements(id),
 amazon_order_id text not null check(length(amazon_order_id) between 3 and 120),
 amazon_order_item_id text not null check(length(amazon_order_item_id) between 1 and 120),
 event_type text not null check(event_type in ('sale','refund','fee_adjustment')),
 units integer not null default 0 check(units>=0),
 gross_sales_cents bigint not null default 0 check(gross_sales_cents>=0),
 amazon_fees_cents bigint not null default 0 check(amazon_fees_cents>=0),
 refunds_cents bigint not null default 0 check(refunds_cents>=0),
 other_costs_cents bigint not null default 0 check(other_costs_cents>=0),
 verification text not null default 'observed' check(verification in ('observed','verified','disputed','reversed')),
 created_at timestamptz not null default now(),
 unique(user_id,amazon_order_id,amazon_order_item_id,event_type,report_id)
);
create index if not exists nr_orders_statement_idx on public.nite_consignment_order_lines(statement_id);
create index if not exists nr_orders_user_idx on public.nite_consignment_order_lines(user_id,created_at);
alter table public.nite_consignment_order_lines enable row level security;
revoke all on public.nite_consignment_order_lines from anon,authenticated;
grant select on public.nite_consignment_order_lines to authenticated;
create policy nr_order_owner_read on public.nite_consignment_order_lines for select to authenticated using((select auth.uid())=user_id);

create or replace function public.nr_validate_order_assignment() returns trigger language plpgsql set search_path='' as $$
declare a_user uuid; r_user uuid; r_status text; s_user uuid; s_sup uuid; lot_supplier uuid;
begin
 select user_id into a_user from public.nite_academy_allocations where id=new.allocation_id;
 select user_id,review_status into r_user,r_status from public.nite_consignment_reports where id=new.report_id;
 if a_user is distinct from new.user_id or r_user is distinct from new.user_id then
  raise exception 'seller, allocation and report must have the same owner'; end if;
 if new.statement_id is not null then
  select user_id,supplier_id into s_user,s_sup from public.nite_consignment_statements where id=new.statement_id;
  select l.supplier_id into lot_supplier from public.nite_academy_allocations a
   join public.nite_consignment_lots l on l.id=a.lot_id where a.id=new.allocation_id;
  if s_user is distinct from new.user_id or s_sup is distinct from lot_supplier then
   raise exception 'statement supplier/seller does not match order allocation'; end if;
 end if;
 if new.verification='verified' and r_status<>'verified' then
  raise exception 'cannot verify a sale against an unverified Amazon report'; end if;
 return new;
end $$;
create trigger nr_order_assignment_check before insert or update of allocation_id,report_id,user_id,statement_id,verification on public.nite_consignment_order_lines
for each row execute function public.nr_validate_order_assignment();
revoke all on function public.nr_validate_order_assignment() from public,anon,authenticated;

create or replace function public.nr_statement_verify_gate() returns trigger language plpgsql set search_path='' as $$
declare r_user uuid; r_status text; num int; ss bigint; sf bigint; rf bigint; oc bigint;
begin
 if new.status in ('verified','invoiced') then
  select user_id,review_status into r_user,r_status from public.nite_consignment_reports where id=new.report_id;
  if r_user is distinct from new.user_id or r_status <> 'verified' then
   raise exception 'verified Amazon report must match seller'; end if;
  select count(*)::integer,coalesce(sum(gross_sales_cents),0),coalesce(sum(amazon_fees_cents),0),
         coalesce(sum(refunds_cents),0),coalesce(sum(other_costs_cents),0)
  into num,ss,sf,rf,oc
  from public.nite_consignment_order_lines
  where statement_id=new.id and verification='verified' and report_id=new.report_id;
  if num=0 or ss<>new.gross_sales_cents or sf<>new.amazon_fees_cents or rf<>new.refunds_cents or oc<>new.other_costs_cents then
   raise exception 'statement totals must match verified consignment order lines'; end if;
 end if;
 return new;
end $$;
create trigger nr_statement_verify_check before insert or update of status,report_id,gross_sales_cents,amazon_fees_cents,refunds_cents,other_costs_cents,seller_share_cents,supplier_share_cents,niterun_fee_cents
on public.nite_consignment_statements for each row execute function public.nr_statement_verify_gate();
revoke all on function public.nr_statement_verify_gate() from public,anon,authenticated;

-- Prevent members from treating a draft or void statement as a payable invoice.
drop policy if exists nr_statement_owner_read on public.nite_consignment_statements;
create policy nr_statement_owner_read on public.nite_consignment_statements for select to authenticated using ((select auth.uid())=user_id and status in ('verified','invoiced','disputed'));
