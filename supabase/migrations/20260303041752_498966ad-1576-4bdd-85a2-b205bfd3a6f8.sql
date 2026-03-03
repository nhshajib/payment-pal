
-- Add auth_id column to link users with Supabase Auth
ALTER TABLE public.users ADD COLUMN auth_id uuid UNIQUE;

-- Remove phone_number column (privacy risk - raw phone numbers shouldn't be stored)
ALTER TABLE public.users DROP COLUMN phone_number;

-- Create helper function to get internal user_id from auth session
CREATE OR REPLACE FUNCTION public.get_internal_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
$$;

-- ═══════════════════════════════════════
-- USERS TABLE: Replace open policies with auth-scoped ones
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Allow public read users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert users" ON public.users;
DROP POLICY IF EXISTS "Allow public update users" ON public.users;

CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "Users can insert own data"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid());

-- ═══════════════════════════════════════
-- PAYMENTS TABLE: Replace open policies
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Allow public read payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public insert payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public update payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public delete payments" ON public.payments;

CREATE POLICY "Users can read own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (user_id = public.get_internal_user_id());

CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.get_internal_user_id());

CREATE POLICY "Users can update own payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (user_id = public.get_internal_user_id());

CREATE POLICY "Users can delete own payments"
  ON public.payments FOR DELETE
  TO authenticated
  USING (user_id = public.get_internal_user_id());

-- ═══════════════════════════════════════
-- FREE_TRIALS TABLE: Replace open policies
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Allow public read free_trials" ON public.free_trials;
DROP POLICY IF EXISTS "Allow public insert free_trials" ON public.free_trials;
DROP POLICY IF EXISTS "Allow public update free_trials" ON public.free_trials;
DROP POLICY IF EXISTS "Allow public delete free_trials" ON public.free_trials;

CREATE POLICY "Users can read own trials"
  ON public.free_trials FOR SELECT
  TO authenticated
  USING (user_id = public.get_internal_user_id());

CREATE POLICY "Users can insert own trials"
  ON public.free_trials FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.get_internal_user_id());

CREATE POLICY "Users can update own trials"
  ON public.free_trials FOR UPDATE
  TO authenticated
  USING (user_id = public.get_internal_user_id());

CREATE POLICY "Users can delete own trials"
  ON public.free_trials FOR DELETE
  TO authenticated
  USING (user_id = public.get_internal_user_id());

-- ═══════════════════════════════════════
-- ROOMMATES TABLE: Replace open policies
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Allow public read roommates" ON public.roommates;
DROP POLICY IF EXISTS "Allow public insert roommates" ON public.roommates;
DROP POLICY IF EXISTS "Allow public update roommates" ON public.roommates;
DROP POLICY IF EXISTS "Allow public delete roommates" ON public.roommates;

CREATE POLICY "Users can read own roommates"
  ON public.roommates FOR SELECT
  TO authenticated
  USING (user_id = public.get_internal_user_id());

CREATE POLICY "Users can insert own roommates"
  ON public.roommates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.get_internal_user_id());

CREATE POLICY "Users can update own roommates"
  ON public.roommates FOR UPDATE
  TO authenticated
  USING (user_id = public.get_internal_user_id());

CREATE POLICY "Users can delete own roommates"
  ON public.roommates FOR DELETE
  TO authenticated
  USING (user_id = public.get_internal_user_id());
