
-- NITERUN Consignment Control Tower v1 (additive, no payment execution).
-- Admin backends only may create confirmed supply, financial, and payment facts.
create sequence if not exists public.nr_supplier_code_seq;
create sequence if not exists public.nr_product_code_seq;
create sequence if not exists public.nr_lot_code_seq;
create sequence if not exists public.nr_allocation_code_seq;
create sequence if not exists public.nr_inventory_event_code_seq;
create sequence if not exists public.nr_report_code_seq;
create sequence if not exists public.nr_statement_code_seq;
create sequence if not exists public.nr_payment_event_code_seq;
create sequence if not exists public.nr_remittance_code_seq;
create sequence if not exists public.nr_agreement_code_seq;

create table if not exists public.nite_consignment_suppliers (
 id uuid primary key default gen_random_uuid(),
 supplier_code text not null unique default ('SUP-' || lpad(nextval('public.nr_supplier_code_seq')::text,6,'0')),
 legal_name text not null check (length(legal_name) between 2 and 200),
 agreement_sha256 text check(agreement_sha256 ~ '^[0-9a-f]{64}$'),
 agreement_signed_at timestamptz,
 authorizes_subconsignment boolean not null default false,
 status text not null default 'pending' check(status in ('pending','approved','suspended')),
 created_at timestamptz not null default now(),
 constraint supplier_approved_rights check(status <> 'approved' or (agreement_signed_at is not null and agreement_sha256 is not null and authorizes_subconsignment))
);

create table if not exists public.nite_consignment_products (
 id uuid primary key default gen_random_uuid(),
 product_code text not null unique default ('PRD-' || lpad(nextval('public.nr_product_code_seq')::text,6,'0')),
 supplier_id uuid not null references public.nite_consignment_suppliers(id),
 supplier_sku text not null check(length(supplier_sku) between 1 and 100),
 product_name text not null check(length(product_name) between 2 and 200),
 asin text check(length(asin) between 1 and 20),
 category text,
 status text not null default 'pending' check(status in ('pending','eligible','blocked')),
 created_at timestamptz not null default now(),
 unique(supplier_id,supplier_sku)
);

create table if not exists public.nite_consignment_lots (
 id uuid primary key default gen_random_uuid(),
 lot_code text not null unique default ('LOT-' || lpad(nextval('public.nr_lot_code_seq')::text,6,'0')),
 supplier_id uuid not null references public.nite_consignment_suppliers(id),
 product_id uuid not null references public.nite_consignment_products(id),
 authorized_units integer not null check(authorized_units>0),
 supplier_finances_inbound boolean not null default false,
 status text not null default 'draft' check(status in ('draft','approved','closed')),
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 constraint lot_approval_check check(status <> 'approved' or (supplier_finances_inbound and approved_at is not null))
);

create table if not exists public.nite_consignment_seller_agreements (
 id uuid primary key default gen_random_uuid(),
 agreement_code text not null unique default ('AGR-' || lpad(nextval('public.nr_agreement_code_seq')::text,6,'0')),
 user_id uuid not null references auth.users(id) on delete cascade,
 agreement_sha256 text check(agreement_sha256 ~ '^[0-9a-f]{64}$'),
 status text not null default 'draft' check(status in ('draft','signed','terminated')),
 signed_at timestamptz,
 due_days integer not null default 3 check(due_days between 1 and 30),
 created_at timestamptz not null default now(),
 constraint seller_agreement_signed check(status <> 'signed' or (signed_at is not null and agreement_sha256 is not null))
);
create index if not exists nr_seller_agreements_user_idx on public.nite_consignment_seller_agreements(user_id,status);

alter table public.nite_academy_allocations
 add column if not exists lot_id uuid references public.nite_consignment_lots(id),
 add column if not exists allocation_code text not null default ('ALC-' || lpad(nextval('public.nr_allocation_code_seq')::text,6,'0')),
 add column if not exists amazon_shipment_id text,
 add column if not exists amazon_seller_sku text,
 add column if not exists amazon_fnsku text;
create unique index if not exists nr_alloc_code_unique on public.nite_academy_allocations(allocation_code);
create index if not exists nr_alloc_lot_idx on public.nite_academy_allocations(lot_id);

-- Central release gate: no over-allocation, unapproved supplier, or unsigned seller.
create or replace function public.nr_check_allocation() returns trigger language plpgsql set search_path='' as $$
declare authorized integer; committed bigint; eligible boolean;
begin
 if new.lot_id is null then raise exception 'lot_id required for real consignment allocations'; end if;
 select l.authorized_units,
  (l.status='approved' and l.supplier_finances_inbound and p.status='eligible'
     and p.supplier_id=l.supplier_id and s.status='approved' and s.authorizes_subconsignment)
 into authorized,eligible
 from public.nite_consignment_lots l
 join public.nite_consignment_products p on p.id=l.product_id
 join public.nite_consignment_suppliers s on s.id=l.supplier_id
 where l.id=new.lot_id for update of l;
 if authorized is null then raise exception 'lot not found'; end if;
 if not eligible then raise exception 'supplier, lot, funding, or product is not approved'; end if;
 select coalesce(sum(a.quantity),0) into committed from public.nite_academy_allocations a
 where a.lot_id=new.lot_id and a.state <> 'cancelled' and a.id is distinct from new.id;
 if committed + new.quantity > authorized then raise exception 'consignment lot over-allocation: authorized % committed % requested %', authorized, committed, new.quantity; end if;
 if new.state not in ('proposed','cancelled') then
  if not exists(select 1 from public.nite_consignment_seller_agreements sa where sa.user_id=new.user_id and sa.status='signed')
   then raise exception 'signed seller consignment agreement required'; end if;
  if not exists(select 1 from public.nite_academy_reviews r where r.user_id=new.user_id and r.seller_verified=true)
   then raise exception 'seller verification required'; end if;
 end if;
 if new.state in ('shipped','live','settled') and coalesce(trim(new.amazon_shipment_id),'')=''
 then raise exception 'shipment reference required'; end if;
 return new;
end $$;
drop trigger if exists nr_check_academy_allocation on public.nite_academy_allocations;
create trigger nr_check_academy_allocation before insert or update of lot_id,quantity,state,amazon_shipment_id on public.nite_academy_allocations for each row execute function public.nr_check_allocation();
revoke all on function public.nr_check_allocation() from public,anon,authenticated;

create table if not exists public.nite_consignment_inventory_events (
 id uuid primary key default gen_random_uuid(),
 event_code text not null unique default ('MOV-' || lpad(nextval('public.nr_inventory_event_code_seq')::text,6,'0')),
 lot_id uuid not null references public.nite_consignment_lots(id),
 allocation_id uuid references public.nite_academy_allocations(id),
 event_type text not null check(event_type in ('allocated','released','shipped','received_fba','sold','returned_sellable','returned_unsellable','lost','removed','correction')),
 quantity integer not null check(quantity>0),
 source_ref text not null check(length(source_ref) between 2 and 200),
 verification text not null default 'reported' check(verification in ('reported','corroborated','verified','disputed')),
 occurred_at timestamptz not null,
 recorded_at timestamptz not null default now()
);
create index if not exists nr_inventory_events_lot_idx on public.nite_consignment_inventory_events(lot_id,occurred_at);

create table if not exists public.nite_consignment_reports (
 id uuid primary key default gen_random_uuid(),
 report_code text not null unique default ('RPT-' || lpad(nextval('public.nr_report_code_seq')::text,6,'0')),
 user_id uuid not null references auth.users(id) on delete cascade,
 amazon_settlement_id text not null check(length(amazon_settlement_id) between 2 and 120),
 period_start date not null,
 period_end date not null,
 account_disbursement_cents bigint not null check(account_disbursement_cents>=0),
 evidence_storage_key text,
 evidence_sha256 text check(evidence_sha256 ~ '^[0-9a-f]{64}$'),
 source_type text not null check(source_type in ('seller_report','amazon_sp_api')),
 review_status text not null default 'unverified' check(review_status in ('unverified','in_review','verified','disputed')),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 check(period_end>=period_start),
 unique(user_id,amazon_settlement_id)
);
create index if not exists nr_report_user_idx on public.nite_consignment_reports(user_id);

create table if not exists public.nite_consignment_statements (
 id uuid primary key default gen_random_uuid(),
 statement_code text not null unique default ('STM-' || lpad(nextval('public.nr_statement_code_seq')::text,6,'0')),
 user_id uuid not null references auth.users(id) on delete cascade,
 supplier_id uuid not null references public.nite_consignment_suppliers(id),
 report_id uuid references public.nite_consignment_reports(id),
 period_start date not null,
 period_end date not null,
 gross_sales_cents bigint not null check(gross_sales_cents>=0),
 amazon_fees_cents bigint not null check(amazon_fees_cents>=0),
 refunds_cents bigint not null default 0 check(refunds_cents>=0),
 other_costs_cents bigint not null default 0 check(other_costs_cents>=0),
 net_distributable_cents bigint generated always as (gross_sales_cents-amazon_fees_cents-refunds_cents-other_costs_cents) stored,
 seller_share_cents bigint not null check(seller_share_cents>=0),
 supplier_share_cents bigint not null check(supplier_share_cents>=0),
 niterun_fee_cents bigint not null check(niterun_fee_cents>=0),
 owed_to_niterun_cents bigint generated always as (supplier_share_cents+niterun_fee_cents) stored,
 status text not null default 'draft' check(status in ('draft','verified','invoiced','disputed','void')),
 issued_at timestamptz,
 due_at timestamptz,
 stripe_invoice_id text unique,
 stripe_hosted_invoice_url text,
 created_at timestamptz not null default now(),
 check(period_end>=period_start),
 check(gross_sales_cents>=amazon_fees_cents+refunds_cents+other_costs_cents),
 check(seller_share_cents+supplier_share_cents+niterun_fee_cents=gross_sales_cents-amazon_fees_cents-refunds_cents-other_costs_cents),
 constraint nr_verified_statement_evidence check(status not in ('verified','invoiced') or (report_id is not null and issued_at is not null and due_at is not null))
);
create index if not exists nr_statements_user_idx on public.nite_consignment_statements(user_id,issued_at);

-- Append-only payment facts. The payment provider's event ID is an idempotency key.
create table if not exists public.nite_consignment_payment_events (
 id uuid primary key default gen_random_uuid(),
 payment_code text not null unique default ('PAY-' || lpad(nextval('public.nr_payment_event_code_seq')::text,6,'0')),
 statement_id uuid not null references public.nite_consignment_statements(id),
 provider text not null check(provider in ('stripe','bank_reconciled')),
 provider_event_id text not null unique check(length(provider_event_id) between 3 and 200),
 payment_reference text not null check(length(payment_reference) between 3 and 200),
 kind text not null check(kind in ('received','reversed')),
 amount_cents bigint not null check(amount_cents>0),
 verified_at timestamptz not null,
 created_at timestamptz not null default now()
);
create index if not exists nr_payment_statement_idx on public.nite_consignment_payment_events(statement_id);

create table if not exists public.nite_consignment_supplier_remittances (
 id uuid primary key default gen_random_uuid(),
 remittance_code text not null unique default ('REM-' || lpad(nextval('public.nr_remittance_code_seq')::text,6,'0')),
 statement_id uuid not null references public.nite_consignment_statements(id),
 supplier_id uuid not null references public.nite_consignment_suppliers(id),
 amount_cents bigint not null check(amount_cents>0),
 status text not null default 'planned' check(status in ('planned','paid','failed','reversed')),
 payment_reference text,
 paid_at timestamptz,
 created_at timestamptz not null default now(),
 constraint nr_remittance_paid_reference check(status <> 'paid' or (payment_reference is not null and paid_at is not null))
);
create index if not exists nr_remittances_statement_idx on public.nite_consignment_supplier_remittances(statement_id);

-- Preserve history: never overwrite inventory movement or verified money events.
create or replace function public.nr_block_immutable_event_change() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'immutable event: post a separate correcting/reversal record'; end $$;
drop trigger if exists nr_inventory_immutable on public.nite_consignment_inventory_events;
create trigger nr_inventory_immutable before update or delete on public.nite_consignment_inventory_events for each row execute function public.nr_block_immutable_event_change();
drop trigger if exists nr_payment_immutable on public.nite_consignment_payment_events;
create trigger nr_payment_immutable before update or delete on public.nite_consignment_payment_events for each row execute function public.nr_block_immutable_event_change();
revoke all on function public.nr_block_immutable_event_change() from public,anon,authenticated;

-- Money event must not exceed amount contracted or reverse more than was received.
create or replace function public.nr_validate_payment_event() returns trigger language plpgsql set search_path='' as $$
declare total_due bigint; net_collected bigint; st text;
begin
 select owed_to_niterun_cents,status into total_due,st from public.nite_consignment_statements where id=new.statement_id for update;
 if total_due is null or st not in ('verified','invoiced') then raise exception 'statement not verified for settlement'; end if;
 select coalesce(sum(case when kind='received' then amount_cents else -amount_cents end),0) into net_collected
 from public.nite_consignment_payment_events where statement_id=new.statement_id;
 if new.kind='received' and net_collected + new.amount_cents > total_due then raise exception 'payment exceeds statement amount owed'; end if;
 if new.kind='reversed' and net_collected-new.amount_cents < 0 then raise exception 'payment reversal exceeds collected amount'; end if;
 return new;
end $$;
drop trigger if exists nr_payment_event_validator on public.nite_consignment_payment_events;
create trigger nr_payment_event_validator before insert on public.nite_consignment_payment_events for each row execute function public.nr_validate_payment_event();
revoke all on function public.nr_validate_payment_event() from public,anon,authenticated;

-- Every exposed table defaults closed. Seller access is SELECT-only with per-user RLS.
do $$
declare t text;
begin
 foreach t in array array[
 'nite_consignment_suppliers','nite_consignment_products','nite_consignment_lots','nite_consignment_seller_agreements',
 'nite_consignment_inventory_events','nite_consignment_reports','nite_consignment_statements',
 'nite_consignment_payment_events','nite_consignment_supplier_remittances'
 ] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
 end loop;
end $$;

grant select on public.nite_consignment_seller_agreements,public.nite_consignment_reports,public.nite_consignment_statements,public.nite_consignment_payment_events to authenticated;
create policy nr_agreement_owner_read on public.nite_consignment_seller_agreements for select to authenticated using ((select auth.uid())=user_id);
create policy nr_report_owner_read on public.nite_consignment_reports for select to authenticated using ((select auth.uid())=user_id);
create policy nr_statement_owner_read on public.nite_consignment_statements for select to authenticated using ((select auth.uid())=user_id);
create policy nr_payment_owner_read on public.nite_consignment_payment_events for select to authenticated using (exists(select 1 from public.nite_consignment_statements s where s.id=statement_id and s.user_id=(select auth.uid())));

-- A security-invoker view adds only verified receivables and actual provider-verified collection.
create or replace view public.nite_consignment_member_balances with (security_invoker=true) as
select s.id,s.user_id,s.statement_code,s.period_start,s.period_end,
 s.gross_sales_cents,s.amazon_fees_cents,s.refunds_cents,s.other_costs_cents,s.net_distributable_cents,
 s.seller_share_cents,s.supplier_share_cents,s.niterun_fee_cents,s.owed_to_niterun_cents,
 s.status,s.issued_at,s.due_at,s.stripe_hosted_invoice_url,
 coalesce(sum(case when p.kind='received' then p.amount_cents when p.kind='reversed' then -p.amount_cents else 0 end),0)::bigint as collected_cents,
 greatest(s.owed_to_niterun_cents-coalesce(sum(case when p.kind='received' then p.amount_cents when p.kind='reversed' then -p.amount_cents else 0 end),0),0)::bigint as outstanding_cents
from public.nite_consignment_statements s
left join public.nite_consignment_payment_events p on p.statement_id=s.id
group by s.id;
revoke all on public.nite_consignment_member_balances from public,anon,authenticated;
grant select on public.nite_consignment_member_balances to authenticated;
