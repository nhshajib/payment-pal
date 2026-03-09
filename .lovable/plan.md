

## Plan: Fix Biometrics, PWA Blank Screen, Premium Status, and Modern PIN UI

### Issues Identified

1. **Premium not showing**: `usePremium.ts` reads `localStorage.getItem('paytrack_user_id')` (line 72) to sync DB premium status, but nothing ever writes to that key. The DB confirms `is_premium=true`, but the client never picks it up because the user ID lookup fails silently.

2. **Biometric login broken**: When biometric is enabled, the `phone` stored via `enableBiometric()` is the `phone_hash` from Supabase. Then during biometric login, `restore(user.phone)` calls `hashPhone(phone_hash)` — double-hashing the already-hashed value. This creates a wrong hash, and `restore()` fails because the session may be expired after logout.

3. **PWA blank screen on iOS Safari**: The PWA precaches `index.html` with a specific revision hash. When a new build deploys, the old cached `index.html` references stale JS bundles that no longer exist on the server. iOS Safari's standalone mode doesn't easily let users force-refresh. The `navigateFallback` sends `/index.html` for all routes, but if the cached JS is stale, the app renders a blank `#root` div.

4. **PIN page not user-friendly**: The current PIN input uses a transparent overlay `opacity-0` input which works but looks bare — just 4 small dots on a black screen. Needs a more modern iOS-style keypad or at minimum better visual feedback.

### Changes

#### 1. Fix Premium Sync (`src/hooks/usePremium.ts`)
- Remove the broken `localStorage.getItem('paytrack_user_id')` lookup
- Instead, use Supabase auth session to find the user and check `is_premium`
- This ensures premium status syncs correctly on every login

#### 2. Fix Biometric Login (`src/hooks/useBiometric.ts` + `src/pages/Onboarding.tsx`)
- **Root cause**: `restore()` requires an active Supabase session, but after logout the session is gone. Biometric only proves the user's identity locally — it doesn't re-authenticate with Supabase.
- **Fix**: Change biometric to store the Supabase auth credentials needed for re-login. Store `email` (the synthetic `hash@paytrack.app`) alongside the biometric credential. On biometric login, instead of calling `restore()`, call `supabase.auth.signInWithPassword()` directly using the stored email. But we don't have the password (PIN hash)...
- **Alternative fix**: Store the user's refresh token alongside biometric data. On biometric auth, use the refresh token to restore the session via `supabase.auth.setSession()`.
- **Simplest reliable fix**: After biometric verification succeeds, check if there's already an active Supabase session. If yes, use `restore()`. If no session exists, show a toast "Session expired, please enter PIN" and redirect to PIN screen. This is the current behavior but the `restore()` function calls `hashPhone()` on the already-hashed phone, causing a mismatch. Fix: store and pass the phone hash directly instead of re-hashing.
  - In `useBiometric.ts`: the `BiometricUser.phone` field stores what was passed to `enableBiometric()`. Settings passes `phone_hash` from DB. So `user.phone` is already a hash.
  - In `Onboarding.tsx` `handleBiometricLogin`: `restore(user.phone)` calls `hashPhone(phone_hash)` = double hash. Fix: add a new method `restoreWithHash(phoneHash)` to `useUser` that skips the `hashPhone()` call, or just check the session directly without needing the phone.
  - **Best approach**: Simplify `restore()` — it only sets `phoneHash` state and checks session. Make it work with the hash directly. Add a `restoreFromBiometric()` method that takes a phone hash directly without re-hashing.

#### 3. Fix PWA Blank Screen on iOS (`vite.config.ts`)
- Add `skipWaiting: true` and `clientsClaim: true` to workbox config (already present via `registerType: 'autoUpdate'`, but iOS Safari can still serve stale cache)
- Add `cleanupOutdatedCaches: true` to workbox config
- Most critically: add a **runtime check** in `main.tsx` that detects when the app renders blank and forces a cache clear + reload
- Also: add `navigationPreload: true` if supported
- Add a service worker update prompt or auto-reload when a new version is detected

#### 4. Modern PIN Input (`src/pages/Onboarding.tsx` + `src/components/PinInput.tsx` + `src/components/NumberPad.tsx`)
- Replace the hidden input approach with a **built-in number pad** (like iOS lock screen)
- The NumberPad component already exists in the project. Use it or rebuild a modern iOS-style keypad with:
  - 3x4 grid (1-9, biometric/blank, 0, delete)
  - Large circular buttons with haptic feedback
  - Face ID button in bottom-left when available
  - Delete button in bottom-right
- This eliminates the keyboard reliability problem entirely

#### 5. Grant Premium to All Current Users
- Run SQL: `UPDATE public.users SET is_premium = true WHERE is_premium = false;`
- Note: DB already shows user `ca3a628c` has `is_premium=true`. The issue is the client not detecting it (fixed in step 1).

### Files to Change
1. `src/hooks/usePremium.ts` — fix DB sync to use auth session
2. `src/hooks/useUser.tsx` — add `restoreFromBiometric(phoneHash)` method
3. `src/hooks/useBiometric.ts` — no changes needed (already stores phone_hash correctly)
4. `src/pages/Onboarding.tsx` — use built-in number pad instead of hidden input, update biometric login to use new restore method
5. `src/components/PinInput.tsx` — enhance with larger dots and better styling
6. `src/components/NumberPad.tsx` — update to iOS lock-screen style (3x4 grid with letters, biometric button)
7. `src/main.tsx` — add PWA stale cache detection and recovery
8. `vite.config.ts` — add `cleanupOutdatedCaches: true`
9. SQL update — grant premium to all current users (safety net)

