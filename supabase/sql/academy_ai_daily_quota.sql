-- Applied to NITERUN Supabase project succvbtctjkzsowotcsy on 2026-11-08.
-- Idempotent schema for an owner-scoped hosted AI gateway. No public read access.
CREATE TABLE IF NOT EXISTS public.academy_ai_quota_daily (
 principal text NOT NULL,
 usage_day date NOT NULL,
 request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(principal, usage_day)
);
ALTER TABLE public.academy_ai_quota_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.academy_ai_quota_daily FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.academy_ai_quota_daily TO service_role;
CREATE OR REPLACE FUNCTION public.academy_ai_reserve(
 p_user_id uuid, p_max_user_per_day integer, p_max_total_per_day integer
) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE v_count integer;
BEGIN
 IF p_user_id IS NULL OR p_max_user_per_day NOT BETWEEN 1 AND 10
    OR p_max_total_per_day NOT BETWEEN 1 AND 100 THEN RETURN false; END IF;
 INSERT INTO public.academy_ai_quota_daily(principal,usage_day,request_count)
 VALUES('user:'||p_user_id::text,current_date,1)
 ON CONFLICT (principal,usage_day) DO UPDATE
 SET request_count=public.academy_ai_quota_daily.request_count+1,updated_at=now()
 WHERE public.academy_ai_quota_daily.request_count<p_max_user_per_day
 RETURNING request_count INTO v_count;
 IF v_count IS NULL THEN RETURN false; END IF;
 v_count:=NULL;
 INSERT INTO public.academy_ai_quota_daily(principal,usage_day,request_count)
 VALUES('global',current_date,1)
 ON CONFLICT(principal,usage_day) DO UPDATE
 SET request_count=public.academy_ai_quota_daily.request_count+1,updated_at=now()
 WHERE public.academy_ai_quota_daily.request_count<p_max_total_per_day
 RETURNING request_count INTO v_count;
 IF v_count IS NULL THEN
  RAISE EXCEPTION 'academy_ai_daily_global_quota_reached' USING ERRCODE='P0001';
 END IF;
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.academy_ai_reserve(uuid,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.academy_ai_reserve(uuid,integer,integer) TO service_role;
