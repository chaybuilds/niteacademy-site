-- Store a member's requested onboarding route separately from their actual Amazon plan.
ALTER TABLE public.nite_academy_profiles ADD COLUMN IF NOT EXISTS academy_path text NOT NULL DEFAULT 'undecided' CHECK (academy_path IN ('undecided','starter','elite'));
GRANT UPDATE (academy_path) ON public.nite_academy_profiles TO authenticated;
-- Existing profile RLS confines writes to auth.uid() and seller verification remains company-only.
