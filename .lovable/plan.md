

## Plan: Premium Grant, Category Fix, PIN UX, Animations & Polish

### 1. Grant Premium to All Current Users
**Action:** SQL data update via insert tool
```sql
UPDATE public.users SET is_premium = true WHERE is_premium = false;
```
Only 1 user exists and is already premium. This is a safety net for any future users added before this deploys.

### 2. Remove "Free Trial" from Payment Categories
**File:** `src/lib/categories.ts`
- Remove the `free_trial` category entry from the `CATEGORIES` array (line 32)
- Free Trial tracking remains exclusively in the premium Trials tab

### 3. Fix PIN Input — Reliable Keyboard Trigger
**File:** `src/pages/Onboarding.tsx`

The current hidden input approach (`position: fixed; top: -100; opacity: 0`) doesn't reliably trigger keyboards on iOS/Android. Fix:

- Replace the off-screen hidden input with a **visible but transparent** input overlaid on the PIN dots area using `absolute inset-0`, `caret-color: transparent`, `color: transparent`, `background: transparent`
- This makes the input tappable and focusable within the dot area, so the keyboard appears naturally
- Keep `autoFocus` and the staggered `setTimeout` focus calls as fallback
- Remove the `onClick` handler on the dot wrapper (no longer needed since input covers the area)

### 4. Fix Biometric Login
**File:** `src/pages/Settings.tsx` (line 416-417)

Bug: When enabling biometrics, the phone value passed is `localStorage.getItem('paytrack_phone_hash')` which may be empty/null since the app no longer stores phone hash in localStorage (it was removed in the Supabase Auth migration). 

Fix: The `useBiometric.enableBiometric()` takes `phone` as a parameter for re-authentication via `restore()`. Since biometric login calls `restore(phone)` which needs the raw phone digits, we need to store the user's phone during login. But we can't — the phone is hashed.

**Root cause:** `authenticateWithBiometric()` returns the stored `BiometricUser.phone` which is then passed to `restore()`. But `restore()` calls `hashPhone(phone)` and then tries to find the user — it actually just checks the active Supabase session. So the phone value doesn't matter for auth, it just sets `phoneHash` state.

**Real fix in `src/hooks/useBiometric.ts` and `src/pages/Settings.tsx`:**
- In Settings, when enabling biometric, pass the user's `phoneHash` (which is available from `useUser()`) instead of reading from localStorage
- In `useBiometric.enableBiometric()`, store `phoneHash` as the phone identifier
- In `Onboarding.tsx` `handleBiometricLogin`, the `restore(user.phone)` call should work since it just checks active session — but if session expired, it fails. Add a fallback: if `restore` fails, show the PIN screen instead of a generic error.

### 5. Reduce Animations — Minimal & Fast
**Files:** `src/pages/Onboarding.tsx`, `src/pages/Schedule.tsx`, `src/pages/Settings.tsx`, `src/App.tsx`

Changes:
- **Splash screen:** Reduce from 3.2s to 1.8s. Remove the loading bar animation.
- **Onboarding transitions:** Change `spring` config from `stiffness: 320, damping: 32` to `duration: 0.2` ease transitions. Remove bouncy spring animations.
- **Schedule page:** Remove `whileTap` scale animations from minor buttons. Reduce card entrance animations from spring to simple `duration: 0.15` fades.
- **Settings:** Remove slide variants delay. Use instant transitions.
- **Payment cards:** Reduce entrance animation delay multiplier from `0.03` per card to `0.01`.

### 6. Home Page (Schedule) Polish
**File:** `src/pages/Schedule.tsx`

- Clean up the hero section: tighten spacing, make greeting more prominent
- Make the FAB picker cleaner — when on "upcoming" tab, tap FAB directly opens Add Payment (skip the picker menu). Only show the picker when premium user has trial option.
- Improve empty states with clearer CTAs
- Remove the long-press hint (too noisy for users)

### 7. Auth Flow Polish
**File:** `src/pages/Onboarding.tsx`

- Reduce transition delays between screens
- Make the landing page buttons larger and more inviting
- Add subtle loading state feedback on PIN verification (show spinner immediately, not just at bottom)

### 8. Settings Clarity
**File:** `src/pages/Settings.tsx`

- Add descriptive subtitles to main menu items
- Make "Account & Security" more prominent

### Files Changed
1. `src/lib/categories.ts` — remove free_trial category
2. `src/pages/Onboarding.tsx` — fix PIN input overlay, reduce animations, polish auth flow
3. `src/hooks/useBiometric.ts` — no changes needed (logic is fine)
4. `src/pages/Settings.tsx` — fix biometric enable phone param, add clarity
5. `src/pages/Schedule.tsx` — simplify FAB, reduce animations, polish home
6. `src/App.tsx` — reduce splash duration
7. `src/components/PaymentCard.tsx` — reduce card animations (if applicable)
8. SQL update — grant premium to all users

