-- NITE ACADEMY prelaunch waitlist (applied via Supabase SQL on 2026-11-10).
-- This is an auditable operations script, not an automatic migration.
-- Waitlist is separate from Supabase Auth and does not create a seller account.
create table if not exists public.nite_academy_waitlist (
 id uuid primary key default gen_random_uuid(),
 email text not null unique,
 source text not null default 'website' check(source in ('website','tiktok','youtube','instagram','other')),
 consent_at timestamptz not null default now(),
 joined_at timestamptz not null default now(),
 status text not null default 'waiting' check(status in ('waiting','invited','unsubscribed')),
 last_contacted_at timestamptz,
 constraint nite_academy_waitlist_email_valid check(
    char_length(email) between 6 and 254
    and email=lower(btrim(email))
    and email ~ '^[a-z0-9][a-z0-9._%+-]*@[a-z0-9][a-z0-9.-]*\.[a-z]{2,63}$'
 )
);
alter table public.nite_academy_waitlist enable row level security;
revoke all on public.nite_academy_waitlist from public, anon, authenticated;
drop policy if exists nite_academy_waitlist_anon_access on public.nite_academy_waitlist;

create or replace function public.join_nite_academy_waitlist(
 p_email text,
 p_source text default 'website',
 p_consent boolean default false,
 p_company text default ''
) returns boolean
language plpgsql
security definer
set search_path=''
as $function$
declare v_email text; v_source text;
begin
 if not coalesce(p_consent,false) then
   raise exception 'Consent is required' using errcode='22023';
 end if;
 if char_length(coalesce(p_company,''))>0 then return true; end if;
 v_email:=lower(btrim(coalesce(p_email,'')));
 v_source:=lower(btrim(coalesce(p_source,'website')));
 if char_length(v_email)<6 or char_length(v_email)>254
 or v_email !~ '^[a-z0-9][a-z0-9._%+-]*@[a-z0-9][a-z0-9.-]*\.[a-z]{2,63}$' then
   raise exception 'Enter a valid email address' using errcode='22023';
 end if;
 if v_source not in ('website','tiktok','youtube','instagram','other') then v_source:='other'; end if;
 insert into public.nite_academy_waitlist(email,source)
 values(v_email,v_source) on conflict(email) do nothing;
 return true;
end;
$function$;
revoke all on function public.join_nite_academy_waitlist(text,text,boolean,text) from public, anon, authenticated;
grant execute on function public.join_nite_academy_waitlist(text,text,boolean,text) to anon, authenticated;
