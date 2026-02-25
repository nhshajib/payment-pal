

## Plan: Fix Login/Signup Flow, Clickable Premium Badge, Real PayPal

### Issues Identified

**1. Login/Signup flow design mismatch:**
- Background uses `bg-background` (dark gray 6%) instead of true black
- Colorful radial gradients and floating icons clash with the monochrome iOS aesthetic used everywhere else
- Signup screen has a cramped inline number pad that doesn't match the full-screen iOS passcode pattern used for login
- The overall feel is "web app form" rather than "native iOS app"

**2. Premium badge not clickable:**
- In Settings main view (line 766-769), the "Premium" badge next to the user's name is a static `<span>` — not interactive
- No way for premium users to see what features they've unlocked

**3. Sandbox PayPal instead of production:**
- Edge function (`supabase/functions/paypal-payment/index.ts` line 11) uses `api-m.sandbox.paypal.com`
- Settings.tsx (line 362) opens checkout at `www.sandbox.paypal.com`

---

### Changes

#### A. Onboarding.tsx — Redesign to match true-black iOS aesthetic

1. **Landing screen**: Replace `bg-background` with `bg-black`. Remove colorful radial gradients and SVG noise overlay. Remove floating icons. Use the same monochrome aesthetic as the splash screen — clean white text on true black, subtle `white/10` accents instead of `primary` color splashes.

2. **Login phone screen**: True black background. Cleaner card styling using `mono-card` classes. Remove colored gradients.

3. **Login PIN screen**: Already looks decent — just update background to true black.

4. **Signup screen**: True black background. Redesign the form to be more spacious and iOS-native. Keep the compact number pad but style it consistently with the login PIN pad (same sizing, same `bg-secondary/60` circles). Remove colored gradients.

5. Overall: Replace `bg-background` root container with `bg-black`. Buttons use the existing primary color but without excessive glowing shadows. The "or" divider uses `white/10` lines. The country picker uses `mono-card` styling.

#### B. Settings.tsx — Clickable Premium Badge

1. Make the "Premium" badge next to the user's name a tappable button
2. On tap, open a new modal (`activeModal === 'premium-features'`) that lists all the premium features the user currently has access to:
   - Price Hike Alerts
   - 30-Day Future Outlook
   - Calendar view with payment dots
   - Monthly budget goals & tracking
   - Spending predictions & forecasts
   - Advanced search & filters
   - Custom accent colors (6 themes)
   - Export payments as CSV
   - Roommates & shared bills
3. Each feature shown with a checkmark icon in a clean iOS list style
4. Modal title: "Your Premium Features"

#### C. Edge Function + Frontend — Switch to Production PayPal

1. **`supabase/functions/paypal-payment/index.ts`**: Change `PAYPAL_API` from `https://api-m.sandbox.paypal.com` to `https://api-m.paypal.com`

2. **`src/pages/Settings.tsx`** (line 362): Change the popup URL from `https://www.sandbox.paypal.com/checkoutnow?token=` to `https://www.paypal.com/checkoutnow?token=`

3. **`src/pages/Premium.tsx`** (line 125): Update the "Secure payment via PayPal" text (already generic, no change needed)

#### D. Settings version bump

- Update "PayTrack v2.5" footer text to "PayTrack v2.7"
- Add v2.7 changelog entry in the About modal:
  - Redesigned login & signup flow (true-black iOS native)
  - Clickable Premium badge with feature list
  - Production PayPal payments

---

### Technical Details

- No database changes required
- Edge function redeploy needed for PayPal URL change
- The existing PayPal secrets (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`) must be production credentials — the user should verify these are live keys, not sandbox keys. I will flag this during implementation.
- All styling changes use existing CSS utilities (`mono-card`, `mono-card-solid`, theme variables)

