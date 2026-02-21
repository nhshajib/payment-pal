

## v2.3 -- Premium Upgrade, Light Mode Fix, and Native Polish

---

### 1. Bottom Navigation Redesign

**Problem:** Current design feels flat and misaligned with native iOS tab bars.

**Changes in `src/components/BottomNav.tsx`:**
- Remove the floating pill container -- switch to a full-width bottom bar anchored flush to the bottom edge (like iOS native tab bar)
- Use a solid background with a single thin top border (`border-t`) instead of `rounded-2xl` with margins
- Increase icon size slightly to `22px`, keep always-visible labels at `10px`
- Replace the small `4px` dot indicator with an active pill highlight behind the icon+label group using `layoutId` for smooth transitions
- Make background theme-aware: dark uses `hsl(240 3% 11% / 0.95)`, light uses `hsl(0 0% 100% / 0.95)` with backdrop blur

---

### 2. Light Mode Fixes

**Problem:** Many elements use hardcoded dark-mode colors (`rgba(255,255,255,...)`, `#fff`, `hsl(240 3% 11%/...)`) that become invisible or ugly in light mode.

**Changes across multiple files:**

- **`src/index.css`**: Add light-mode overrides for `.glass-card` (already done), and add a `.glass-header` utility class for the Schedule header panel that adapts per theme
- **`src/pages/Schedule.tsx`**: Replace all hardcoded `background: 'hsl(240 3% 11% / 0.75)'` and `rgba(255,255,255,...)` inline styles with CSS custom properties or Tailwind classes that switch per theme. The header panel, tab switcher, and search bar all need theme-aware backgrounds
- **`src/pages/Settings.tsx`**: The `IOSSection`, `IOSRow`, `SettingsModal`, and various modals all use hardcoded `rgba(255,255,255,0.06)` backgrounds and `color: '#fff'` text. Replace with Tailwind semantic classes (`bg-card`, `text-card-foreground`, `bg-secondary`, `border-border`) so they adapt to both themes. The `SettingsModal` background, section card backgrounds, divider colors, and text colors all need updating
- **`src/components/PaymentCard.tsx`**: The `DaysRing` track color uses `hsl(0 0% 100% / 0.08)` -- make it `hsl(var(--muted))`. Context menu backdrop and card styles should use theme-aware values
- **`src/components/BottomNav.tsx`**: Background needs to be theme-aware (covered in section 1)

---

### 3. Payment Card -- Edit Action More Visible

**Problem:** The left-swipe edit action is subtle and hard to discover.

**Changes in `src/components/PaymentCard.tsx`:**
- Increase the edit zone threshold from `-60` to `-50` so it triggers sooner
- Make the edit icon and label larger (`w-5 h-5`, `text-sm` instead of `w-4 h-4`, `text-xs`)
- Change the edit icon color from `text-primary` (red, which blends with delete) to a distinct blue (`text-blue-400`)
- Add a small rounded pill background behind the edit label for better contrast against the swipe gradient
- In the context menu, make the "Edit" option more prominent with a blue icon instead of muted gray

---

### 4. Premium Subscription System

**New file: `src/hooks/usePremium.ts`**
- Create a React context + hook to manage premium status
- Store premium status in `localStorage` with key `paytrack_premium`
- Export `isPremium`, `setPremium(true)` functions
- This keeps it simple (no backend IAP needed for $0.99 one-time)

**Premium-gated features (reserved for paying users):**
- **Custom app themes/accent colors** -- ability to change the red accent to any color (blue, purple, green, etc.)
- **Export payments as CSV** -- download payment history
- **Unlimited payment categories** -- free users limited to 5 custom categories (current default categories remain free)

**Changes in `src/pages/Settings.tsx`:**
- Add a new "PREMIUM" section above "ACCOUNT" with a prominent card
- Free users see: a visually appealing upgrade card with a crown icon, "$0.99 one-time" pricing, and a "Upgrade" button
- Premium users see: a subtle "Premium Active" badge
- Tapping "Upgrade" opens a premium comparison modal showing:
  - **Free tier**: Basic payment tracking, notifications, categories, pull-to-refresh
  - **Premium tier** ($0.99 one-time): Custom accent colors, CSV export, priority support badge
- The upgrade button triggers `setPremium(true)` (actual Stripe integration can be added later -- for now it's a mock purchase flow with a confirmation dialog)
- Add a "Premium" crown badge next to "PayTrack v2.3" in the footer when premium is active

---

### 5. Overall Design Polish

**`src/pages/Schedule.tsx`:**
- Reduce the header panel border-radius from `20px` to `16px` for a tighter, more native feel
- Make the search bar background theme-aware
- Add a subtle separator between the header and tab switcher

**`src/pages/Overview.tsx`:**
- Make all card backgrounds theme-aware (use `bg-card` instead of hardcoded colors)
- Add subtle hover states on interactive cards

**`src/components/PaymentCard.tsx`:**
- Slightly increase the card padding from `p-4` to `px-4 py-3.5` for a more refined feel
- Make the category icon container slightly smaller (`w-10 h-10`) for better proportions

---

### 6. Version Bump

**File: `src/pages/Settings.tsx`**
- Bump to v2.3
- Changelog:
  - Premium subscription with custom themes and CSV export
  - Redesigned bottom navigation bar
  - Complete light mode support
  - More visible payment edit actions
  - Overall design refinements

---

### Technical Summary

| File | Changes |
|---|---|
| `src/hooks/usePremium.ts` | New -- premium status context and hook |
| `src/components/BottomNav.tsx` | Full-width native tab bar, theme-aware, active pill indicator |
| `src/index.css` | Light mode fixes for glass elements, new utility classes |
| `src/pages/Schedule.tsx` | Theme-aware header/tabs/search, design tightening |
| `src/pages/Settings.tsx` | Premium section with upgrade card and comparison modal, light mode fixes for all sections/modals, v2.3 bump |
| `src/pages/Overview.tsx` | Theme-aware card backgrounds |
| `src/components/PaymentCard.tsx` | More visible edit action, theme-aware ring/menu, refined spacing |
| `src/main.tsx` | Wrap app with PremiumProvider |

