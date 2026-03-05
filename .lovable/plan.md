

## Plan: PIN Input Fix, Background Notifications, PWA Fix & Schedule Polish

### Problems Identified

1. **PIN Input UX** — Current implementation uses a hidden `<input>` that requires tapping to focus. Shows "Tap dots to enter PIN" hint which is confusing. The keyboard doesn't auto-appear reliably on mobile. Need to auto-focus aggressively and remove the confusing hint.

2. **Notifications only fire on app open** — `checkAndNotifyPayments()` is called in a `useEffect` in Schedule.tsx (line 213), meaning it only runs when the user opens the app. There's no background push or periodic sync. Fix: Add a service worker with periodic background sync and/or Web Push API to send notifications even when the app is closed.

3. **PWA not opening the site** — The `start_url` is `/` which redirects to `/schedule` for logged-in users. The service worker's `navigateFallback` is set correctly. Issue likely: duplicate manifest (both `public/manifest.json` AND VitePWA generating one). Remove the static `manifest.json` to avoid conflicts. Also ensure the SW is properly registered.

4. **Schedule/Home page polish** — The hero section is functional but could be more visually engaging. Add a greeting with time-of-day context, subtle card for the summary stats.

### Changes

#### 1. Fix PIN Input — Auto-focus & Remove Confusion
**File:** `src/pages/Onboarding.tsx`
- Remove the "Tap dots to enter PIN" hint text (lines 418-425)
- Make the PIN dots area not a button — just a div. The hidden input should auto-focus immediately
- Add `useEffect` to force-focus the hidden input whenever the PIN screen mounts
- Set the hidden input to `position: fixed; top: -100px` instead of `opacity: 0; w-0; h-0` — some mobile browsers won't show keyboard for zero-size inputs
- Add `autoFocus` and a `setTimeout(() => pinInputRef.current?.focus(), 100)` for reliability

#### 2. Background Notifications via Service Worker
**File:** Create `public/sw-custom.js` — a custom service worker script
- Register for `periodicSync` API (where supported — Chrome Android) with tag `payment-check`
- On periodic sync event, fetch payments from Supabase and call notification logic
- Fallback: Use `setInterval` in the SW for browsers without periodicSync

**File:** `vite.config.ts`
- Add `importScripts` to VitePWA workbox config to include the custom SW

**File:** `src/lib/notifications.ts`
- Extract payment check logic into a standalone function that can be called from SW context
- Add a function to register periodic sync

**File:** `src/pages/Schedule.tsx`
- After requesting notification permission, register the periodic sync

#### 3. Fix PWA — Remove Duplicate Manifest
**File:** Delete `public/manifest.json` — VitePWA already generates the manifest from `vite.config.ts`. Having both causes conflicts where the browser picks the wrong one.

**File:** `index.html`
- Remove `<link rel="manifest" href="/manifest.json" />` — VitePWA injects its own manifest link

#### 4. Schedule Page Polish
**File:** `src/pages/Schedule.tsx`
- Add time-of-day greeting ("Good morning, {name}" / "Good afternoon" / "Good evening")
- Add a subtle summary card below the hero with overdue/today/upcoming counts as mini badges
- Improve empty state with more engaging copy

#### 5. PIN Input Component Theme Fix
**File:** `src/components/PinInput.tsx`
- The dots use hardcoded `bg-white` and `border-white/25`. Since the PIN screen is always on a dark background (the Onboarding page uses `bg-black`), this is fine — no change needed.

### Files Changed
1. `src/pages/Onboarding.tsx` — auto-focus PIN, remove tap hint
2. `public/sw-custom.js` — new custom service worker for background notifications
3. `vite.config.ts` — import custom SW script
4. `src/lib/notifications.ts` — add periodic sync registration
5. `src/pages/Schedule.tsx` — register periodic sync, add greeting, polish hero
6. `index.html` — remove static manifest link
7. Delete `public/manifest.json` — remove duplicate manifest

