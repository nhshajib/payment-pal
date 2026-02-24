

# Payment Pal: 5 Standout Features Implementation Plan

## Overview

This plan adds five major frontend features to Payment Pal. No backend/database changes -- all new data properties are managed via local state, extended TypeScript interfaces, and localStorage persistence.

---

## 1. Data Model Updates

Extend the `Payment` interface in `src/hooks/usePayments.ts` with optional frontend-only properties:

- `paymentUrl?: string` -- for Pay Portal links
- `isShared?: boolean`, `totalAmount?: number`, `userShareAmount?: number` -- for Split Bill mode
- `confirmationNumber?: string`, `receiptImage?: string` -- for receipt stash (stored in localStorage)

Add `free_trial` to `src/lib/categories.ts` with a `Timer` icon and orange color.

Create a new local state hook `src/hooks/usePaydays.ts` to manage mock payday dates (stored in localStorage, default: 1st and 15th of each month).

---

## 2. Feature Breakdown

### Feature 1: "Paycheck Survival" View

**Files**: `src/pages/Overview.tsx`, new `src/hooks/usePaydays.ts`

- Add a toggle at the top of the Overview tab: "Monthly View" / "Paycheck View" using pill-style buttons.
- `usePaydays` hook manages an array of upcoming payday dates in localStorage.
- In Paycheck View, bills are grouped by the next upcoming payday instead of Overdue/This Week/Later.
- Summary header reads: "You have X bills totaling $Y due before your next paycheck on [Date]."
- A small settings popover lets users add/edit payday dates.

### Feature 2: Pay Portal Links

**Files**: `src/components/AddPaymentSheet.tsx`, `src/components/overview/BillItem.tsx`

- Add a "Payment Website URL" input field in AddPaymentSheet (with a `Globe` icon).
- In BillItem, if `paymentUrl` exists, render a subtle `ExternalLink` icon button that opens the URL in a new tab via `window.open()`.
- The icon appears between the bill name and the amount, stopping event propagation to avoid triggering the action sheet.

### Feature 3: Split Bill / Roommate Mode

**Files**: `src/components/AddPaymentSheet.tsx`, `src/components/overview/BillItem.tsx`, `src/pages/Overview.tsx`

- Add a "Shared Bill" toggle in AddPaymentSheet. When ON:
  - Replace the single Amount field with "Total Bill Amount" and "My Share" fields.
  - Store `isShared: true`, `totalAmount`, and `userShareAmount` on the payment.
- In BillItem, if `isShared`, show `userShareAmount` as the large number and "Total: $X" as secondary text below.
- The Overview summary card calculates totals using `userShareAmount` when available, falling back to `amount`.

### Feature 4: Free Trial Timebomb

**Files**: `src/lib/categories.ts`, `src/components/overview/BillItem.tsx`, `src/components/PaymentCard.tsx`

- Add a `free_trial` category with `Timer` icon and `hsl(25, 95%, 53%)` orange color.
- In BillItem, if category is `free_trial`:
  - Add a pulsing orange border using a CSS animation.
  - Show a countdown badge (e.g., "Ends in 3 days") next to the amount.
- Apply the same visual treatment in PaymentCard for the Schedule tab.

### Feature 5: Digital Receipt & Confirmation Stash

**Files**: new `src/components/overview/MarkPaidDrawer.tsx`, `src/pages/Overview.tsx`, `src/components/PaymentCard.tsx`

- Create `MarkPaidDrawer` -- a slide-up drawer (using vaul `Drawer` component) that intercepts the "Mark as Paid" action.
- Drawer contents:
  - Header: "Marking [Bill Name] as Paid"
  - Optional text input: "Confirmation Number"
  - Optional "Attach Receipt" button (stores a base64 string or filename in localStorage)
  - Primary "Confirm Payment" button
- Store confirmation data in a localStorage-backed `useReceiptStash` map (`Record<paymentId, { confirmationNumber, receiptImage }>`).
- In the Paid tab (Schedule page), if receipt data exists, show a small `Receipt` icon badge on the payment card. Tapping it opens a small detail popover showing the confirmation number and receipt thumbnail.

---

## 3. File Change Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/usePayments.ts` | Edit | Extend Payment interface with optional fields |
| `src/hooks/usePaydays.ts` | Create | Mock payday state with localStorage |
| `src/hooks/useReceiptStash.ts` | Create | localStorage-backed receipt/confirmation data |
| `src/lib/categories.ts` | Edit | Add `free_trial` category |
| `src/pages/Overview.tsx` | Edit | Paycheck view toggle, shared bill calculations, receipt drawer integration |
| `src/components/AddPaymentSheet.tsx` | Edit | Pay URL field, Shared Bill toggle with dual amount fields |
| `src/components/overview/BillItem.tsx` | Edit | External link button, shared bill display, free trial pulsing border |
| `src/components/overview/MarkPaidDrawer.tsx` | Create | Confirmation number + receipt attachment drawer |
| `src/components/overview/PaymentActionSheet.tsx` | Edit | Route "Mark Paid" through MarkPaidDrawer |
| `src/components/PaymentCard.tsx` | Edit | Free trial visual treatment, receipt badge in Paid tab |

---

## 4. Technical Notes

- All new data persists in **localStorage** only -- no Supabase schema changes.
- The `usePaydays` hook defaults to bi-monthly paydays (1st and 15th) which users can customize.
- Receipt "attachment" uses a file input that reads the image as a base64 data URL, stored in localStorage under a size-limited key.
- Free trial countdown uses `differenceInDays(parseISO(due_date), new Date())` from date-fns.
- All new UI follows the existing design system: rounded-2xl cards, `bg-card`/`bg-secondary` tokens, framer-motion animations, and the established spacing/typography patterns.

