

## v2.5 -- Premium Feature Expansion (5 New Locked Features)

This plan adds 5 new genuinely useful premium features, all visible to free users but locked behind premium purchase. Each feature shows its UI but requires premium to interact, pushing users toward the upgrade.

---

### New Premium Feature 1: Calendar View (Schedule Page)

**What it does:** A visual month calendar showing colored dots on dates where payments are due. Tap a date to see that day's payments. Overdue dates show red dots, upcoming show primary color, paid show green.

**Implementation in `src/pages/Schedule.tsx`:**
- Add a third tab option in the tab switcher: "Upcoming | Paid | Calendar"
- Calendar tab renders a custom month grid (not a full date-picker -- a simple 7-column grid)
- Each day cell shows small colored dots for payments on that date
- Tapping a date expands a list of payments for that day below the calendar
- Free users see the calendar rendered but tapping any date shows a premium lock overlay with "Unlock Calendar View" button
- The calendar tab itself shows a small Crown/Lock icon for free users

**New component: `src/components/PaymentCalendar.tsx`**
- Accepts payments array and isPremium boolean
- Renders current month grid with navigation arrows (prev/next month)
- Dots: red = overdue, primary = upcoming unpaid, green = paid
- Selected date highlights with primary color ring
- Below calendar: list of payments for selected date (or "No payments" empty state)

---

### New Premium Feature 2: Monthly Budget Goal (Overview Page)

**What it does:** Users set a monthly spending limit. A prominent progress ring/bar shows how much of the budget is used. Color shifts from green to yellow to red as they approach/exceed the limit.

**Implementation:**
- **Database:** Add `monthly_budget` column (numeric, nullable, default null) to `users` table
- **`src/pages/Overview.tsx`:** New "Budget" card between summary cards and upcoming bills
  - Shows a circular progress ring with amount spent vs budget
  - Below ring: "X remaining" or "X over budget" text
  - If no budget set: shows "Set Budget" button
  - Free users see the card with a blurred overlay and lock icon
- **`src/pages/Settings.tsx`:** Add "Monthly Budget" row under PREFERENCES section
  - Premium users can set/edit their budget amount
  - Free users tapping it opens premium modal
- **`src/hooks/usePremium.ts`:** No changes needed -- uses isPremium check

---

### New Premium Feature 3: Spending Predictions (Overview Page)

**What it does:** Shows a "Next Month Forecast" card that estimates next month's spending based on recurring payments plus historical average of non-recurring spending.

**Implementation in `src/pages/Overview.tsx`:**
- New card below the monthly insight section
- Calculates: sum of all recurring payment amounts + average non-recurring spending from last 3 months
- Shows: "Estimated next month: $X" with a small breakdown tooltip
- Recurring total shown separately from variable spending
- Free users see the card blurred with lock overlay and "Unlock Predictions" CTA
- Uses only existing payment data -- no new database columns needed

---

### New Premium Feature 4: Recurring Cost Summary (Overview Page)

**What it does:** A dedicated card showing the total monthly recurring cost and an annual projection. Helps users understand their fixed monthly obligations at a glance.

**Implementation in `src/pages/Overview.tsx`:**
- New card showing:
  - "Monthly Recurring: $X" (sum of all recurring, unpaid payments)
  - "Annual Projection: $X" (monthly * 12)
  - Small list of top 3 recurring payments by amount
- Free users see the card with blurred content and lock overlay
- No database changes needed -- computed from existing `is_recurring` field

---

### New Premium Feature 5: Advanced Filters (Schedule Page)

**What it does:** Adds powerful filtering beyond basic search -- date range picker, amount range slider, and multi-category filter chips. Basic text search remains free.

**Implementation in `src/pages/Schedule.tsx`:**
- Below the existing search bar, add a "Filters" button with a small badge showing active filter count
- Tapping "Filters" opens a filter sheet/panel with:
  - Date range: "From" and "To" date pickers
  - Amount range: min/max input fields
  - Category: tappable chips for multi-select (shows all categories, selected ones highlighted)
- Free users tapping "Filters" button see premium lock modal
- The filter button itself shows a Crown icon for free users as a visual cue
- Premium users get the full filter sheet, active filters show as dismissible chips below the search bar

---

### Updated Premium Comparison Modal

Update the premium modal in Settings to show all 8 features (3 existing + 5 new):

**Free tier:**
- Payment tracking and reminders
- Push notifications
- Basic search
- Pull-to-refresh and data sync

**Premium tier ($0.99 one-time):**
- Calendar view with date navigation
- Monthly budget goals and tracking
- Spending predictions and forecasts
- Recurring cost analysis (monthly + annual)
- Advanced search filters (date, amount, category)
- Custom accent colors (6 themes)
- Export payments as CSV
- Advanced 6-month analytics

---

### Premium Lock Component

**New file: `src/components/PremiumLock.tsx`**
- Reusable overlay component used across all locked features
- Props: `title`, `subtitle`, `onUpgrade`, `compact` (boolean for inline vs overlay)
- Renders: blurred backdrop + centered lock icon + text + "Unlock" button
- Consistent iOS-native styling across all premium gates
- Used in: Calendar view, Budget card, Predictions card, Recurring card, Advanced filters

---

### Database Migration

```sql
ALTER TABLE public.users ADD COLUMN monthly_budget numeric DEFAULT null;
```

---

### Files Summary

| File | Changes |
|---|---|
| `src/components/PremiumLock.tsx` | New -- reusable premium lock overlay component |
| `src/components/PaymentCalendar.tsx` | New -- calendar month grid view with payment dots |
| `src/pages/Schedule.tsx` | Add Calendar tab (3rd tab), advanced filters button with premium gate |
| `src/pages/Overview.tsx` | Budget goal card, spending predictions card, recurring cost summary card -- all premium-locked |
| `src/pages/Settings.tsx` | Monthly Budget row, updated premium comparison modal with all 8 features, v2.5 bump |
| Migration | Add `monthly_budget` column to `users` table |

---

### Design Principles

- Every premium feature is VISIBLE but LOCKED -- users see the value before paying
- Lock overlays use consistent glassmorphism blur with the reusable `PremiumLock` component
- All new cards follow existing iOS-native card styling (rounded-2xl, bg-card, border-border/50)
- Animations use existing spring physics patterns (stiffness: 300, damping: 28)
- Theme-aware throughout -- all new components use semantic Tailwind tokens

