
-- =====================================================
-- FIX: Convert all RESTRICTIVE RLS policies to PERMISSIVE
-- All 34 policies across all tables are RESTRICTIVE which 
-- means NO rows can be accessed (PostgreSQL requires at 
-- least one PERMISSIVE policy to grant access).
-- =====================================================

-- ── users ──
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

CREATE POLICY "Users can read own data" ON public.users FOR SELECT TO authenticated USING (auth_id = auth.uid());
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT TO authenticated WITH CHECK (auth_id = auth.uid());
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE TO authenticated USING (auth_id = auth.uid());

-- ── payments ──
DROP POLICY IF EXISTS "Users can read own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON public.payments;

CREATE POLICY "Users can read own payments" ON public.payments FOR SELECT TO authenticated USING (user_id = get_internal_user_id());
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (user_id = get_internal_user_id());
CREATE POLICY "Users can update own payments" ON public.payments FOR UPDATE TO authenticated USING (user_id = get_internal_user_id());
CREATE POLICY "Users can delete own payments" ON public.payments FOR DELETE TO authenticated USING (user_id = get_internal_user_id());

-- ── free_trials ──
DROP POLICY IF EXISTS "Users can read own trials" ON public.free_trials;
DROP POLICY IF EXISTS "Users can insert own trials" ON public.free_trials;
DROP POLICY IF EXISTS "Users can update own trials" ON public.free_trials;
DROP POLICY IF EXISTS "Users can delete own trials" ON public.free_trials;

CREATE POLICY "Users can read own trials" ON public.free_trials FOR SELECT TO authenticated USING (user_id = get_internal_user_id());
CREATE POLICY "Users can insert own trials" ON public.free_trials FOR INSERT TO authenticated WITH CHECK (user_id = get_internal_user_id());
CREATE POLICY "Users can update own trials" ON public.free_trials FOR UPDATE TO authenticated USING (user_id = get_internal_user_id());
CREATE POLICY "Users can delete own trials" ON public.free_trials FOR DELETE TO authenticated USING (user_id = get_internal_user_id());

-- ── roommates ──
DROP POLICY IF EXISTS "Users can read own roommates" ON public.roommates;
DROP POLICY IF EXISTS "Users can insert own roommates" ON public.roommates;
DROP POLICY IF EXISTS "Users can update own roommates" ON public.roommates;
DROP POLICY IF EXISTS "Users can delete own roommates" ON public.roommates;

CREATE POLICY "Users can read own roommates" ON public.roommates FOR SELECT TO authenticated USING (user_id = get_internal_user_id());
CREATE POLICY "Users can insert own roommates" ON public.roommates FOR INSERT TO authenticated WITH CHECK (user_id = get_internal_user_id());
CREATE POLICY "Users can update own roommates" ON public.roommates FOR UPDATE TO authenticated USING (user_id = get_internal_user_id());
CREATE POLICY "Users can delete own roommates" ON public.roommates FOR DELETE TO authenticated USING (user_id = get_internal_user_id());

-- ── push_subscriptions ──
DROP POLICY IF EXISTS "Users can read own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can read own push subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated USING (user_id = get_internal_user_id());
CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = get_internal_user_id());
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions FOR DELETE TO authenticated USING (user_id = get_internal_user_id());

-- ── split_groups ──
DROP POLICY IF EXISTS "Users can read own split_groups" ON public.split_groups;
DROP POLICY IF EXISTS "Users can insert own split_groups" ON public.split_groups;
DROP POLICY IF EXISTS "Users can update own split_groups" ON public.split_groups;
DROP POLICY IF EXISTS "Users can delete own split_groups" ON public.split_groups;

CREATE POLICY "Users can read own split_groups" ON public.split_groups FOR SELECT TO authenticated USING (user_id = get_internal_user_id());
CREATE POLICY "Users can insert own split_groups" ON public.split_groups FOR INSERT TO authenticated WITH CHECK (user_id = get_internal_user_id());
CREATE POLICY "Users can update own split_groups" ON public.split_groups FOR UPDATE TO authenticated USING (user_id = get_internal_user_id());
CREATE POLICY "Users can delete own split_groups" ON public.split_groups FOR DELETE TO authenticated USING (user_id = get_internal_user_id());

-- ── split_members ──
DROP POLICY IF EXISTS "Users can read own group members" ON public.split_members;
DROP POLICY IF EXISTS "Users can insert own group members" ON public.split_members;
DROP POLICY IF EXISTS "Users can update own group members" ON public.split_members;
DROP POLICY IF EXISTS "Users can delete own group members" ON public.split_members;

CREATE POLICY "Users can read own group members" ON public.split_members FOR SELECT TO authenticated USING (owns_split_group(group_id));
CREATE POLICY "Users can insert own group members" ON public.split_members FOR INSERT TO authenticated WITH CHECK (owns_split_group(group_id));
CREATE POLICY "Users can update own group members" ON public.split_members FOR UPDATE TO authenticated USING (owns_split_group(group_id));
CREATE POLICY "Users can delete own group members" ON public.split_members FOR DELETE TO authenticated USING (owns_split_group(group_id));

-- ── split_expenses ──
DROP POLICY IF EXISTS "Users can read own group expenses" ON public.split_expenses;
DROP POLICY IF EXISTS "Users can insert own group expenses" ON public.split_expenses;
DROP POLICY IF EXISTS "Users can update own group expenses" ON public.split_expenses;
DROP POLICY IF EXISTS "Users can delete own group expenses" ON public.split_expenses;

CREATE POLICY "Users can read own group expenses" ON public.split_expenses FOR SELECT TO authenticated USING (owns_split_group(group_id));
CREATE POLICY "Users can insert own group expenses" ON public.split_expenses FOR INSERT TO authenticated WITH CHECK (owns_split_group(group_id));
CREATE POLICY "Users can update own group expenses" ON public.split_expenses FOR UPDATE TO authenticated USING (owns_split_group(group_id));
CREATE POLICY "Users can delete own group expenses" ON public.split_expenses FOR DELETE TO authenticated USING (owns_split_group(group_id));

-- ── split_shares ──
DROP POLICY IF EXISTS "Users can read own expense shares" ON public.split_shares;
DROP POLICY IF EXISTS "Users can insert own expense shares" ON public.split_shares;
DROP POLICY IF EXISTS "Users can update own expense shares" ON public.split_shares;
DROP POLICY IF EXISTS "Users can delete own expense shares" ON public.split_shares;

CREATE POLICY "Users can read own expense shares" ON public.split_shares FOR SELECT TO authenticated USING (owns_split_expense(expense_id));
CREATE POLICY "Users can insert own expense shares" ON public.split_shares FOR INSERT TO authenticated WITH CHECK (owns_split_expense(expense_id));
CREATE POLICY "Users can update own expense shares" ON public.split_shares FOR UPDATE TO authenticated USING (owns_split_expense(expense_id));
CREATE POLICY "Users can delete own expense shares" ON public.split_shares FOR DELETE TO authenticated USING (owns_split_expense(expense_id));
