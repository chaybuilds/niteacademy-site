-- NITE Academy internal supplier research archive (research only, no partner approval).
-- Rows are sourced from earlier NOVA/CapCore research and are NEVER a live product or merchant listing.
create table if not exists public.nite_academy_supplier_research (
 source_id text primary key check (source_id ~ '^LIVE-[0-9]{3}$'),
 organization_name text not null check (length(organization_name) between 2 and 200),
 sales_channel text not null,
 product_category text not null,
 contact_email text,
 source_url text not null,
 research_tier text not null check (research_tier in ('A','B','C','EXCLUDE')),
 outreach_stage text not null check (outreach_stage in ('DRAFT_SAVED_HELD','RESEARCH_ONLY','EXCLUDED_CHANNEL_CONFLICT')),
 caveat text not null,
 source_repository text not null default 'chaygray89/niterun-commerce',
 research_only boolean not null default true check (research_only),
 authorized_amazon_resale boolean not null default false check (not authorized_amazon_resale),
 authorized_tiktok_auction boolean not null default false check (not authorized_tiktok_auction),
 signed_consignment_agreement boolean not null default false check (not signed_consignment_agreement),
 confirmed_partner boolean not null default false check (not confirmed_partner),
 contact_release_authorized boolean not null default false check (not contact_release_authorized),
 refreshed_at timestamptz not null default now()
);
comment on table public.nite_academy_supplier_research is 'Private internal snapshot of public supplier leads only; no verified Amazon rights, partner terms, contact release or approved inventory.';
alter table public.nite_academy_supplier_research enable row level security;
revoke all on public.nite_academy_supplier_research from public,anon,authenticated;
grant select,insert,update,delete on public.nite_academy_supplier_research to service_role;
-- No policies: staff server service_role access only. Never load this table in the public site.
