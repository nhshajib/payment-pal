-- Update the phone_hash for user Nazmul to match current login format with +1 prefix
-- Hash of "14794351971" (digits from "+14794351971")
-- We need to set the phone_number too for reference
UPDATE users 
SET phone_number = '+14794351971'
WHERE id = 'ca3a628c-79fb-4856-ab3e-e4c0fffa6fdb';