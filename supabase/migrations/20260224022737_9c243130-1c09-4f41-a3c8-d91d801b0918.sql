
-- Add pin_hash column to users table for secure PIN authentication
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pin_hash text NOT NULL DEFAULT '';

-- Add phone_number column (the raw phone number with country code, for display purposes)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number text NOT NULL DEFAULT '';
