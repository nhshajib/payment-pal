-- Input validation constraints for payments
ALTER TABLE public.payments ADD CONSTRAINT check_amount_positive CHECK (amount >= 0);
ALTER TABLE public.payments ADD CONSTRAINT check_name_length CHECK (length(name) <= 500);
ALTER TABLE public.payments ADD CONSTRAINT check_reminder_range CHECK (reminder_days >= 0 AND reminder_days <= 30);

-- Input validation constraints for users
ALTER TABLE public.users ADD CONSTRAINT check_user_name_length CHECK (length(name) <= 100);
ALTER TABLE public.users ADD CONSTRAINT check_user_reminder_range CHECK (default_reminder_days >= 0 AND default_reminder_days <= 30);