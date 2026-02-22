

## v2.4 -- Real Premium Features + PayPal Payment Integration

This plan implements actual premium-gated features, updates the premium comparison modal to reflect them, and sets up real PayPal payment processing with server-side verification.

---

### 1. Real Premium Features to Implement

**Feature A: CSV Export (Premium only)**
- Add an "Export Data" row in Settings under a new "DATA" section
- When tapped by a premium user, generates a CSV file of all payments (name, amount, due date, category, status, notes) and triggers a browser download
- When tapped by a free user, shows the premium upgrade modal instead

**Feature B: Custom Accent Color (Premium only)**
- Add an "Accent Color" row in Settings under PREFERENCES
- Premium users can pick from 6 preset accent colors: Red (default), Blue, Purple, Green, Orange, Teal
- Selecting a color updates the CSS `--primary` variable at runtime and persists the choice in `localStorage`
- Free users see the option but tapping it opens the premium upgrade modal

**Feature C: Advanced Analytics (Premium only) -- on Overview page**
- Show a "Monthly Trend" line/area chart using recharts (already installed) showing the last 6 months of spending
- Free users see the chart blurred with a "Unlock with Premium" overlay
- This replaces the existing basic `MonthlyChart` collapsible with a richer, always-visible chart for premium users

---

### 2. PayPal Payment Integration

**Architecture:**
- Create a Supabase Edge Function `paypal-payment` that handles two actions:
  1. `create-order` -- creates a PayPal order for $0.99 via PayPal Orders API
  2. `capture-order` -- captures (verifies) the payment after user approval
- Store the PayPal email as a Supabase secret (not in code)
- The frontend uses the PayPal JavaScript SDK to render the PayPal button inside the premium modal
- On successful capture, the edge function returns success, and the frontend calls `setPremium(true)`

**Edge Function: `supabase/functions/paypal-payment/index.ts`**
- Uses PayPal REST API (sandbox for now, easy to switch to live)
- `create-order`: calls PayPal `/v2/checkout/orders` to create a $0.99 order
- `capture-order`: calls PayPal `/v2/checkout/orders/{id}/capture` to verify payment
- Requires secrets: `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` (PayPal Business app credentials)
- The PayPal recipient email is configured in the PayPal Business account, not in code

**Frontend Changes in `src/pages/Settings.tsx`:**
- Replace the mock "Purchase" confirmation dialog with a real PayPal checkout flow
- Load PayPal JS SDK dynamically when the premium modal opens
- Show PayPal buttons (Pay with PayPal, Pay with Card) inside the premium comparison modal
- On approval, call the edge function to capture, then activate premium
- Show loading states and error handling

---

### 3. Updated Premium Comparison Modal

Update the premium modal to show the real features:

**Free tier:**
- Payment tracking and reminders
- Push notifications
- Basic monthly overview
- Pull-to-refresh and data sync

**Premium tier ($0.99 one-time):**
- Export payments as CSV
- Custom accent colors (6 themes)
- Advanced 6-month spending analytics
- Priority support badge

---

### 4. Premium Status Persistence

- Keep `localStorage` for instant UI access
- Additionally store `is_premium` in the `users` table (new column) so premium status persists across devices
- The edge function's `capture-order` action updates the user's `is_premium` flag in the database
- On app load, `usePremium` checks both localStorage and the database

---

### 5. Files and Changes Summary

| File | Changes |
|---|---|
| `supabase/functions/paypal-payment/index.ts` | New -- PayPal order creation and capture |
| `supabase/config.toml` | Add paypal-payment function config with verify_jwt = false |
| `src/hooks/usePremium.ts` | Enhance to sync with Supabase `users.is_premium` column, add accent color management |
| `src/pages/Settings.tsx` | Real PayPal checkout in premium modal, CSV export row, accent color picker row, update comparison list |
| `src/pages/Overview.tsx` | Advanced 6-month trend chart (premium) with blur overlay for free users |
| `src/index.css` | CSS custom property overrides for accent color themes |

### 6. Secrets Needed

Before implementation, two secrets must be added:
- `PAYPAL_CLIENT_ID` -- from PayPal Developer Dashboard (Business app)
- `PAYPAL_CLIENT_SECRET` -- from PayPal Developer Dashboard (Business app)

The user's PayPal email (nsajib.9@gmail.com) is configured in their PayPal Business account settings as the receiving account -- it is not stored in code.

### 7. Database Migration

Add `is_premium` column to the `users` table:
```sql
ALTER TABLE users ADD COLUMN is_premium boolean NOT NULL DEFAULT false;
```

---

### Important Notes

- PayPal requires a Business account and a REST API app created at developer.paypal.com
- The client ID is public (used in the frontend SDK script tag), the client secret is private (used only in the edge function)
- The edge function validates payment server-side before granting premium, preventing client-side manipulation
- The implementation starts with PayPal Sandbox; switching to production only requires changing the API base URL and using live credentials

