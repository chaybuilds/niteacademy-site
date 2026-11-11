-- NITE Academy FBA intelligence: private, user-owned, unverified research scenarios.
-- Additive to existing Academy seller/consignment data. No supplier approvals or transactions.
create table if not exists public.nite_academy_fba_research (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_name text not null check (length(scenario_name) between 1 and 80),
  model text not null check (model in ('wholesale', 'consignment', 'introduction')),
  asin text check (
    (model = 'introduction' and asin is null)
    or (model <> 'introduction' and asin ~ '^[A-Z0-9]{10}$')
  ),
  inputs jsonb not null check (jsonb_typeof(inputs) = 'object' and octet_length(inputs::text) <= 4096),
  verification_status text not null default 'UNVERIFIED_RESEARCH'
    check (verification_status = 'UNVERIFIED_RESEARCH'),
  created_at timestamptz not null default now()
);
create index if not exists nite_academy_fba_research_user_idx
  on public.nite_academy_fba_research (user_id, created_at desc);
comment on table public.nite_academy_fba_research is
 'User-owned hypothetical FBA / consignment / introduction research; never an approved inventory allocation, verified profit or contract.';
alter table public.nite_academy_fba_research enable row level security;
revoke all on public.nite_academy_fba_research from public, anon, authenticated;
grant select, insert, delete on public.nite_academy_fba_research to authenticated;
grant all on public.nite_academy_fba_research to service_role;

drop policy if exists nite_fba_select_own on public.nite_academy_fba_research;
create policy nite_fba_select_own on public.nite_academy_fba_research
 for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists nite_fba_insert_own on public.nite_academy_fba_research;
create policy nite_fba_insert_own on public.nite_academy_fba_research
 for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists nite_fba_delete_own on public.nite_academy_fba_research;
create policy nite_fba_delete_own on public.nite_academy_fba_research
 for delete to authenticated using ((select auth.uid()) = user_id);

-- No user update privilege or policy. Drafts are changed by delete + new insertion.
-- No public or anon read, no payment/approval flags, and no automated Amazon operations.
