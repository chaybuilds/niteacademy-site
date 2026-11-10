
-- Internal cash-collection cockpit. This is intentionally not visible to Academy members.
create or replace view public.nite_consignment_admin_receivables as
with recognized as (
 select s.id,s.user_id,s.due_at,s.owed_to_niterun_cents,
  coalesce(sum(case when p.kind='received' then p.amount_cents when p.kind='reversed' then -p.amount_cents else 0 end),0)::bigint as collected_cents
 from public.nite_consignment_statements s
 left join public.nite_consignment_payment_events p on p.statement_id=s.id
 where s.status in ('verified','invoiced','disputed')
 group by s.id
)
select a.user_id,a.display_name,a.amazon_plan,a.amazon_merchant_id,
 count(r.id)::integer as statements_issued,
 coalesce(sum(r.owed_to_niterun_cents),0)::bigint as contractual_receivable_cents,
 coalesce(sum(r.collected_cents),0)::bigint as collected_cents,
 coalesce(sum(greatest(r.owed_to_niterun_cents-r.collected_cents,0)),0)::bigint as outstanding_cents,
 min(r.due_at) filter(where r.owed_to_niterun_cents>r.collected_cents) as oldest_unpaid_due_at
from public.nite_academy_profiles a
left join recognized r on r.user_id=a.user_id
group by a.user_id,a.display_name,a.amazon_plan,a.amazon_merchant_id;
revoke all on public.nite_consignment_admin_receivables from public,anon,authenticated;
grant select on public.nite_consignment_admin_receivables to service_role;
