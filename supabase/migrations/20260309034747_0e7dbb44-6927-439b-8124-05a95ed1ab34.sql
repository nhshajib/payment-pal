
-- Split Groups
CREATE TABLE public.split_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '💰',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_split_groups_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

ALTER TABLE public.split_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own split_groups" ON public.split_groups FOR SELECT TO authenticated USING (user_id = get_internal_user_id());
CREATE POLICY "Users can insert own split_groups" ON public.split_groups FOR INSERT TO authenticated WITH CHECK (user_id = get_internal_user_id());
CREATE POLICY "Users can update own split_groups" ON public.split_groups FOR UPDATE TO authenticated USING (user_id = get_internal_user_id());
CREATE POLICY "Users can delete own split_groups" ON public.split_groups FOR DELETE TO authenticated USING (user_id = get_internal_user_id());

-- Split Members
CREATE TABLE public.split_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.split_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_owner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.split_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_split_group(_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.split_groups
    WHERE id = _group_id AND user_id = get_internal_user_id()
  )
$$;

CREATE POLICY "Users can read own group members" ON public.split_members FOR SELECT TO authenticated USING (public.owns_split_group(group_id));
CREATE POLICY "Users can insert own group members" ON public.split_members FOR INSERT TO authenticated WITH CHECK (public.owns_split_group(group_id));
CREATE POLICY "Users can update own group members" ON public.split_members FOR UPDATE TO authenticated USING (public.owns_split_group(group_id));
CREATE POLICY "Users can delete own group members" ON public.split_members FOR DELETE TO authenticated USING (public.owns_split_group(group_id));

-- Split Expenses
CREATE TABLE public.split_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.split_groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid_by uuid NOT NULL REFERENCES public.split_members(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.split_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own group expenses" ON public.split_expenses FOR SELECT TO authenticated USING (public.owns_split_group(group_id));
CREATE POLICY "Users can insert own group expenses" ON public.split_expenses FOR INSERT TO authenticated WITH CHECK (public.owns_split_group(group_id));
CREATE POLICY "Users can update own group expenses" ON public.split_expenses FOR UPDATE TO authenticated USING (public.owns_split_group(group_id));
CREATE POLICY "Users can delete own group expenses" ON public.split_expenses FOR DELETE TO authenticated USING (public.owns_split_group(group_id));

-- Split Shares
CREATE TABLE public.split_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.split_expenses(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.split_members(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  is_settled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.split_shares ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_split_expense(_expense_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.split_expenses e
    JOIN public.split_groups g ON g.id = e.group_id
    WHERE e.id = _expense_id AND g.user_id = get_internal_user_id()
  )
$$;

CREATE POLICY "Users can read own expense shares" ON public.split_shares FOR SELECT TO authenticated USING (public.owns_split_expense(expense_id));
CREATE POLICY "Users can insert own expense shares" ON public.split_shares FOR INSERT TO authenticated WITH CHECK (public.owns_split_expense(expense_id));
CREATE POLICY "Users can update own expense shares" ON public.split_shares FOR UPDATE TO authenticated USING (public.owns_split_expense(expense_id));
CREATE POLICY "Users can delete own expense shares" ON public.split_shares FOR DELETE TO authenticated USING (public.owns_split_expense(expense_id));
