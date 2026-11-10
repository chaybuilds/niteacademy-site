create sequence if not exists public.nr_member_code_seq;
alter table public.nite_academy_profiles
add column if not exists seller_code text not null default ('SLR-' || lpad(nextval('public.nr_member_code_seq')::text,6,'0'));
create unique index if not exists nite_academy_seller_code_unique on public.nite_academy_profiles(seller_code);
-- Replace broad profile update grants with column-scoped writes so member codes stay immutable.
revoke update on public.nite_academy_profiles from authenticated;
grant update(user_id,display_name,experience,amazon_plan,amazon_merchant_id,interests,consent_to_contact,consent_at,updated_at)
on public.nite_academy_profiles to authenticated;
