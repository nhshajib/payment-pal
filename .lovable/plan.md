

## v2.1 Polish and Feature Upgrade

This plan covers four areas: fixing the Install App popup, upgrading pull-to-refresh, adding new Overview features, and polishing the Schedule page -- all culminating in a version bump.

---

### 1. Fix "Install App" iOS Instructions Popup

**Problem:** The "Got it" button gets hidden behind the bottom navigation.

**Fix:** Change the popup positioning from `top-1/2 -translate-y-1/2` with `mb-20` to a proper bottom-sheet style modal that sits safely above the nav bar. Use `bottom-24` anchoring instead of vertical centering so the button never overlaps.

**File:** `src/pages/Settings.tsx` (lines 551-586)

---

### 2. Smooth Native Pull-to-Refresh

**Problem:** The current implementation uses raw touch events and a basic spinner -- feels janky.

**Fix in** `src/pages/Schedule.tsx`:
- Replace the raw `touchStart/Move/End` with a smoother `framer-motion` `drag="y"` approach on a wrapper, constrained to downward only
- Add a lottie-style animated indicator: an expanding circle that morphs into a checkmark on release
- Use `useSpring` for the pull distance so the indicator has elastic, rubber-band physics
- Show a subtle progress arc (SVG circle) that fills as the user pulls, with haptic feedback at the trigger threshold
- On release above threshold: animate the indicator into a success state, then collapse smoothly
- On release below threshold: spring back with no jank

---

### 3. Overview Page -- New Features

**Current state:** Summary cards (Due/Paid), progress bar, monthly insight, and a collapsible monthly chart.

**New additions in** `src/pages/Overview.tsx`:

- **Upcoming Bills (Next 7 Days):** A compact list showing the next few bills due within 7 days, with relative date labels ("Tomorrow", "Wednesday") and amounts. Tapping navigates to the Schedule tab. Gives users an at-a-glance urgency view.

- **Category Spending Breakdown:** A horizontal bar or donut showing spending by category (Rent, Utilities, Subscriptions, etc.) using the existing `CATEGORIES` data. Each bar uses the category color. Only shows categories that have payments.

- **Streak / Consistency Indicator:** "On-time payment streak" -- counts consecutive payments marked paid before or on their due date. Displayed as a small card with a flame/shield icon and the streak count. Gamifies the experience and drives engagement.

- **Quick Actions Row:** Two compact action buttons at the top -- "Add Payment" and "View Schedule" -- for fast navigation without switching tabs.

---

### 4. Schedule Page Design Polish

**File:** `src/pages/Schedule.tsx`

- **Tab switcher refinement:** Add a subtle inner shadow to the tab container and increase the active tab's shadow for more depth. Add a tiny colored dot indicator instead of just background color change.

- **Payment card spacing:** Increase gap from `space-y-2.5` to `space-y-3` for more breathing room.

- **Section headers:** Add date-grouped section headers (e.g., "Today", "This Week", "Later") above payment cards in the upcoming tab to create visual hierarchy, similar to how iOS groups notifications.

- **Empty state upgrade:** Replace the generic empty state with a more engaging illustration-style layout using layered shapes and a more actionable CTA.

- **Pull indicator polish:** As described in section 2.

---

### 5. Version Bump and Changelog

**File:** `src/pages/Settings.tsx`

- Update version from `2.0` to `2.1`
- Update "What's New" list:
  - Smoother native pull-to-refresh
  - Upcoming bills at-a-glance on Overview
  - Category spending breakdown
  - On-time payment streak tracker
  - Date-grouped payment sections
  - Install popup fix

---

### Technical Summary

| File | Changes |
|---|---|
| `src/pages/Settings.tsx` | Fix iOS install popup positioning; bump version to 2.1; update changelog |
| `src/pages/Schedule.tsx` | Rebuild pull-to-refresh with spring physics; add date-grouped sections; tab polish; spacing |
| `src/pages/Overview.tsx` | Add upcoming bills section, category breakdown, payment streak card, quick actions |
| `src/components/PaymentCard.tsx` | No changes needed |

