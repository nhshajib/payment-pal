

## Plan: Redesign Onboarding + Add Forgot PIN

### Current State
The onboarding screens are functional but feel flat — plain inputs floating on black with excessive dead space. Content sits centered-vertically which wastes screen real estate and doesn't feel like a native iOS app. There's no "Forgot PIN?" option.

### Design Changes

**A. Landing Screen — More visual hierarchy**
- Keep the PayTrack logo but push it higher (top 30% of screen)
- Add a subtle animated gradient orb/glow behind the logo (very subtle, white/5 opacity) for depth
- Push buttons to the bottom of the screen (iOS pattern: content top, actions bottom)
- Larger touch targets (56px height)

**B. Login Phone Screen — iOS Settings-style grouped input**
- Content anchored to top (not centered), with generous top padding
- Phone input inside a grouped card (rounded-2xl, bg-white/[0.06]) like iOS Settings rows
- Country picker and phone input inside the same card row with a subtle divider
- Continue button pinned toward bottom area
- Cleaner typography: SF-style system font sizing

**C. Login PIN Screen — Full-screen iOS passcode**  
- Avatar circle at top showing the user's phone number
- PIN dots centered in the middle third
- NumberPad occupying the bottom third (like iOS lock screen)
- **Add "Forgot PIN?" link** below the PIN dots — tappable text

**D. Signup Info Screen — iOS-style grouped form**
- Same grouped card treatment as login: Name and Phone fields in a single card with dividers between rows
- Content anchored to top
- Continue button lower

**E. Signup PIN + Confirm PIN — Same as login PIN layout**
- Consistent full-screen passcode pattern

**F. Forgot PIN Flow — New screen `'forgot-pin'`**
- User enters their phone number
- System looks up the account and resets PIN to a new one they choose
- Flow: forgot-pin → forgot-new-pin → forgot-confirm-pin
- Verifies identity by requiring the registered phone number match
- Then allows setting a new 4-digit PIN (reuses existing PIN pad screens)

### Files Changed

1. **`src/pages/Onboarding.tsx`** — Complete frontend redesign of all screens + add forgot PIN screens
2. **`src/components/PinInput.tsx`** — Update dot colors to use white instead of `foreground` theme variable (true black context)
3. **`src/components/NumberPad.tsx`** — Update text/bg colors for true black context (white text, white/[0.06] circles)
4. **`src/hooks/useUser.tsx`** — Add `resetPin(phone, newPin)` method for forgot PIN flow

### Technical Details
- New screen types added: `'forgot-pin' | 'forgot-new-pin' | 'forgot-confirm-pin'`
- `resetPin` in useUser: looks up user by phone hash, updates pin_hash directly (no current PIN required — identity verified by phone number ownership)
- PinInput/NumberPad color changes use hardcoded white values instead of CSS variables since they only appear on true-black backgrounds
- Layout uses `justify-between` with `min-h-screen` to push content top and buttons bottom (iOS pattern)

