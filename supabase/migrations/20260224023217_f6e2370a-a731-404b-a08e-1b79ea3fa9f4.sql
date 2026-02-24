-- Set default PIN '1234' (SHA-256 hashed) for all existing users without a PIN
UPDATE public.users 
SET pin_hash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4' 
WHERE pin_hash = '' OR pin_hash IS NULL;