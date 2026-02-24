
-- Create roommates table
CREATE TABLE public.roommates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES public.users(id),
  phone_hash text NOT NULL,
  nickname text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, phone_hash)
);

ALTER TABLE public.roommates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read roommates" ON public.roommates FOR SELECT USING (true);
CREATE POLICY "Allow public insert roommates" ON public.roommates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update roommates" ON public.roommates FOR UPDATE USING (true);
CREATE POLICY "Allow public delete roommates" ON public.roommates FOR DELETE USING (true);

-- Create free_trials table
CREATE TABLE public.free_trials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  expires_on date NOT NULL,
  cancel_url text NOT NULL DEFAULT '',
  is_cancelled boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.free_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read free_trials" ON public.free_trials FOR SELECT USING (true);
CREATE POLICY "Allow public insert free_trials" ON public.free_trials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update free_trials" ON public.free_trials FOR UPDATE USING (true);
CREATE POLICY "Allow public delete free_trials" ON public.free_trials FOR DELETE USING (true);
