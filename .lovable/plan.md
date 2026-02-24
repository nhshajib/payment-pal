

# Roommate/Partner Management + Free Trial Tracker

## Overview

This plan adds two premium-gated features: (1) a **Roommate & Partner management system** in Settings where users can invite contacts by phone number and manage shared bill connections, and (2) a **Free Trial Tracker** feature that lets users add and monitor free trials with expiration countdown alerts.

## Database Changes

### New Table: `roommates`

Stores the relationship between users who share bills together.

```text
roommates
  id          uuid  (PK, default gen_random_uuid())
  user_id     uuid  (NOT NULL, FK -> users.id ON DELETE CASCADE)
  partner_id  uuid  (nullable, FK -> users.id -- set when partner confirms)
  phone_hash  text  (NOT NULL -- hash of invited phone)
  nickname    text  (NOT NULL, default '')
  status      text  (NOT NULL, default 'pending' -- 'pending' | 'confirmed' | 'declined')
  created_at  timestamptz (default now())
  UNIQUE(user_id, phone_hash)
```

RLS policies: permissive SELECT/INSERT/UPDATE/DELETE with `true` (matching existing pattern for this app's client-side auth model).

### New Table: `free_trials`

Tracks user free trial subscriptions separately from regular payments.

```text
free_trials
  id            uuid  (PK, default gen_random_uuid())
  user_id       uuid  (NOT NULL, FK -> users.id ON DELETE CASCADE)
  name          text  (NOT NULL)
  expires_on    date  (NOT NULL)
  cancel_url    text  (default '')
  is_cancelled  boolean (default false)
  notes         text  (default '')
  created_at    timestamptz (default now())
```

RLS policies: same permissive pattern as payments table.

---

## Feature 1: Roommate & Partner Management

### Settings Sub-Page: "Roommates & Partners"

Add a new settings category in the main menu and a new sub-page view (`'roommates'` added to `SettingsView` type).

**Main Menu Entry** (in GENERAL section):
- Icon: `Users` with a teal/green gradient
- Title: "Roommates & Partners"
- Subtitle: "Manage shared bill contacts"
- Premium-gated: tapping shows premium modal if not premium

**Sub-Page UI**:
1. **Add Roommate Section**: Phone number input field with a "Search" button
   - On search, hash the phone and query `users` table for a matching `phone_hash`
   - If found: show the user's name with a green "Add" button -- inserts into `roommates` with `status: 'confirmed'` and `partner_id` set
   - If not found: show "Not on PayTrack yet" with an orange "Invite" button

2. **Invite Flow** (for unregistered users):
   - Insert into `roommates` with `status: 'pending'`, `partner_id: null`
   - Show share options: "Copy Link" and "Share" (using Web Share API if available)
   - Invitation message: `"Hi! [USER_NAME] invited you to track shared payments on PayTrack. Download the app to get started: [APP_URL]"`
   - The link points to the published app URL

3. **Roommate List**: Shows all roommates grouped by status
   - **Confirmed**: Green dot, name, phone mask. Tap to remove (with confirmation)
   - **Pending**: Orange dot, phone hash mask, "Invite Again" button, "Remove" button

### New Hook: `src/hooks/useRoommates.ts`

Manages CRUD operations for the `roommates` table:
- `fetchRoommates(userId)` -- loads all roommates for this user
- `addRoommate(phoneHash, partnerId?, nickname?)` -- insert
- `removeRoommate(id)` -- delete
- `updateStatus(id, status)` -- update

### Shared Bill Integration in AddPaymentSheet

When the "Shared Bill" toggle is ON:
- Instead of just manual amount entry, show a "Split With" selector
- Display confirmed roommates as tappable chips/pills
- Selecting roommates is informational (no backend linking of payments to roommates yet -- purely UI display)
- The existing `isShared`, `totalAmount`, `userShareAmount` fields continue to work as before

---

## Feature 2: Free Trial Tracker

### Settings Sub-Page Enhancement

Add "Free Trial Tracker" as a row inside the existing main menu or as part of a new "Features" section. Premium-gated.

### New Page Section in Overview

Add a collapsible "Free Trials" section at the bottom of the Overview page:
- Shows active (non-cancelled) trials sorted by expiration date
- Each trial card shows:
  - Trial name
  - "Expires in X days" countdown badge (orange if <=3 days, red if <=1 day)
  - "Cancel" link button (opens `cancel_url` in new tab if provided)
  - Checkmark button to mark as cancelled

### New Hook: `src/hooks/useFreeTrials.ts`

Manages CRUD for the `free_trials` table:
- `fetchTrials(userId)` -- load all
- `addTrial({ name, expires_on, cancel_url, notes })` -- insert
- `cancelTrial(id)` -- update `is_cancelled: true`
- `deleteTrial(id)` -- delete

### Add Trial Drawer

A new `AddTrialSheet` component (simpler than AddPaymentSheet):
- Fields: Trial Name (required), Expiration Date (required), Cancel URL (optional), Notes (optional)
- Triggered from the Free Trials section in Overview or from Settings

---

## File Change Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/` | Create | New `roommates` and `free_trials` tables with RLS |
| `src/hooks/useRoommates.ts` | Create | CRUD hook for roommates table |
| `src/hooks/useFreeTrials.ts` | Create | CRUD hook for free_trials table |
| `src/components/AddTrialSheet.tsx` | Create | Drawer form for adding free trials |
| `src/pages/Settings.tsx` | Edit | Add "Roommates & Partners" sub-page, free trial settings entry |
| `src/pages/Overview.tsx` | Edit | Add Free Trials collapsible section |
| `src/components/AddPaymentSheet.tsx` | Edit | Show roommate chips when Shared Bill is ON |
| `src/integrations/supabase/types.ts` | Auto-updated | Will reflect new tables after migration |

---

## Technical Notes

- Both features are **premium-gated**: non-premium users see the premium upsell modal when tapping these options.
- Phone number search uses the same `hashPhone()` utility from `src/lib/hash.ts` to match against `phone_hash` in the `users` table.
- The invitation system is "soft" -- it creates a pending record and generates a shareable message. There is no server-side invitation tracking or push notification to the invitee. When the invitee registers with the same phone number, the inviter can search again and the status will update to confirmed.
- The Web Share API (`navigator.share()`) is used for social media sharing with a clipboard fallback.
- Free trial countdown uses `differenceInDays` from date-fns, consistent with existing patterns.
- RLS policies follow the existing permissive pattern since the app uses client-side identification (phone-hash based, not Supabase Auth).

