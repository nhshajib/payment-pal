
-- Add new columns to payments table for advanced features
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_share_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmation_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS receipt_url text NOT NULL DEFAULT '';
