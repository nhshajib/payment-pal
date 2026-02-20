

## v2.2 -- Design Polish and New Features

A comprehensive polish pass bringing the app closer to a shipping-quality native iOS app. Focused on refining existing UI elements and adding smart, minimal features.

---

### 1. Schedule Page -- Header Banner Polish

**File:** `src/pages/Schedule.tsx`

The "0/4 Paid" circular progress and "Total Upcoming" amount in the header banner need refinement:

- Replace the circular SVG ring with a cleaner **segmented progress indicator** -- small filled/empty dots representing each payment (max ~8 dots, then show count). This feels more iOS-native than a chart-style ring.
- Tighten the "Total Upcoming" section: reduce font size from 34px to 28px, add a subtle animated counter effect when values change.
- Add a thin horizontal divider between the greeting row and the total row for visual structure.

---

### 2. Tab Switcher Redesign

**File:** `src/pages/Schedule.tsx`

The current Upcoming/Paid tab switcher uses a gray pill with shadow. Upgrade to a proper iOS segmented control:

- Use a tighter, more compact container with `rounded-[10px]` and a true inset shadow.
- The active segment gets a white/card-colored pill with `layoutId` transition -- keep the spring animation but remove the colored dot indicator (too busy).
- Reduce padding and font size slightly for a more refined feel.
- Add count badges inline with more refined styling -- smaller, less prominent when inactive.

---

### 3. Bottom Navigation Upgrade

**File:** `src/components/BottomNav.tsx`

Current floating nav looks decent but can be more polished:

- Replace the top red glow line with a subtler filled dot indicator below the icon (like iOS tab bars).
- Remove the `AnimatePresence` label that only shows on active -- instead, always show labels at a smaller size (`text-[9px]`), with active label bold and colored. This is more consistent with native iOS tab bars.
- Slightly reduce the nav height from 60px to 56px.
- Refine the glass background: use a more solid background with a thin top border instead of heavy blur.

---

### 4. Payment Card Polish

**File:** `src/components/PaymentCard.tsx`

- Reduce the amount font size from 20px to 17px -- it currently dominates the card too much.
- Move the `DaysRing` from below the amount to inline with the date text for a more compact layout.
- Add a subtle left border accent using the category color for quick visual scanning.

---

### 5. Overview Page -- New Features

**File:** `src/pages/Overview.tsx`

Add two new lightweight features:

- **Highest Expense Highlight:** A small card above the category breakdown showing the single largest payment this month with its name, amount, and category. Quick insight without clutter.
- **Monthly Average:** Below the "This month" insight, add a line showing the rolling 3-month average spend. Simple but useful for context.

Also fix the "Quick Actions" buttons -- "Add Payment" navigates to `/` which is Index/login. Should navigate to `/schedule`.

---

### 6. Settings Page Polish

**File:** `src/pages/Settings.tsx`

- Add a **"Feedback"** row in a new "SUPPORT" section with a mail icon -- opens a mailto link. Minimal addition that feels professional.
- Add a **"Rate App"** row (cosmetic, shows a toast for now) -- common in native apps.
- Refine the About modal: add a small app icon at the top (styled div, not an image), and format the changelog with version badges.

---

### 7. Version Bump

**File:** `src/pages/Settings.tsx`

- Bump to **v2.2**
- Update changelog:
  - Refined tab switcher and navigation bar
  - Polished payment card layout
  - Highest expense insight on Overview
  - Monthly average spending tracker
  - Support and feedback options in Settings

---

### Technical Summary

| File | Changes |
|---|---|
| `src/pages/Schedule.tsx` | Header banner refinement, tab switcher redesign, segmented progress dots |
| `src/components/BottomNav.tsx` | Always-visible labels, dot indicator, reduced height, refined glass |
| `src/components/PaymentCard.tsx` | Compact amount, inline days ring, category accent border |
| `src/pages/Overview.tsx` | Highest expense card, monthly average, fix navigation links |
| `src/pages/Settings.tsx` | Support section, rate app, about modal polish, v2.2 bump |

