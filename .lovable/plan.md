

## Plan: Production Polish, Security Fixes & Premium Grant

### Issues Found

**Security (Critical)**
1. `auth-register` calls `listUsers()` which fetches ALL auth users — won't scale past 1000 users and is a performance bottleneck. Fix: use `listUsers({ filter: email })` or try creating and catch duplicate error.
2. Edge functions `auth-register` and `auth-reset-pin` are not listed in `config.toml` with `verify_jwt = false` — they may fail for unauthenticated callers.
3. CORS headers in all 3 auth edge functions are missing the extended Supabase client headers (`x-supabase-client-platform`, etc.) — could cause CORS failures on some browsers.
4. `NotFound.tsx` logs routes to `console.error` in production — information leak.
5. No database-level input validation constraints (negative amounts, oversized strings possible via direct API calls).

**Data Task**
6. Grant premium to phone number `4794351971` — need to update `is_premium = true` for matching user.

**Security Finding Cleanup**
7. Old security scan findings (`users_public_rls`, `client_side_user_filtering`, `phone_hash_localstorage`) are outdated since we migrated to Supabase Auth. Delete/update them.

### Changes

#### 1. Fix `auth-register` — remove `listUsers()` call
**File:** `supabase/functions/auth-register/index.ts`
- Remove the `listUsers()` check entirely
- Instead, attempt `createUser()` and catch the "already exists" error (Supabase returns a specific error for duplicate emails)
- This scales to millions of users

#### 2. Update `supabase/config.toml`
Add JWT verification bypass for auth functions:
```toml
[functions.auth-register]
verify_jwt = false

[functions.auth-reset-pin]
verify_jwt = false

[functions.auth-change-pin]
verify_jwt = false
```

#### 3. Fix CORS headers in all 3 edge functions
**Files:** `auth-register/index.ts`, `auth-reset-pin/index.ts`, `auth-change-pin/index.ts`
Add the full Supabase client header list to `Access-Control-Allow-Headers`.

#### 4. Fix `NotFound.tsx` — dev-only logging
**File:** `src/pages/NotFound.tsx`
Wrap `console.error` in `import.meta.env.DEV` check.

#### 5. Add database constraints via migration
```sql
ALTER TABLE payments ADD CONSTRAINT check_amount_positive CHECK (amount >= 0);
ALTER TABLE payments ADD CONSTRAINT check_name_length CHECK (length(name) <= 500);
ALTER TABLE payments ADD CONSTRAINT check_reminder_range CHECK (reminder_days >= 0 AND reminder_days <= 30);
ALTER TABLE users ADD CONSTRAINT check_user_name_length CHECK (length(name) <= 100);
ALTER TABLE users ADD CONSTRAINT check_user_reminder_range CHECK (default_reminder_days >= 0 AND default_reminder_days <= 30);
```

#### 6. Grant premium to user 4794351971
Use the insert tool to update `is_premium = true` for the user whose `phone_hash` matches SHA-256 of `4794351971`. I'll compute the hash and run the update.

#### 7. Update security findings
- Delete `users_public_rls` and `client_side_user_filtering` (fixed by Supabase Auth migration)
- Update `phone_hash_localstorage` (localStorage no longer stores phone hash — Supabase Auth handles sessions)
- Delete `console_error_404` after fix
- Update `no_server_validation` after adding DB constraints

#### 8. Version bump to v3.1
Update the version in `Settings.tsx` about section and add changelog entry for security hardening.

### Files Changed
1. `supabase/functions/auth-register/index.ts` — remove listUsers, catch duplicate on create
2. `supabase/functions/auth-reset-pin/index.ts` — fix CORS headers
3. `supabase/functions/auth-change-pin/index.ts` — fix CORS headers
4. `supabase/config.toml` — add verify_jwt = false for all auth functions
5. `src/pages/NotFound.tsx` — dev-only console.error
6. `src/pages/Settings.tsx` — version bump + changelog
7. New migration — DB constraints
8. Data update — premium grant

