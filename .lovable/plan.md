

# PayTrack — Payment Schedule Tracker PWA

## Overview
A minimal, Netflix-dark-themed PWA with two pages: a payment schedule dashboard and a settings page. Users identify via a 10-digit phone number (hashed, no verification). Data syncs to Supabase and caches locally.

---

## Database Schema (Supabase)

### Table: `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| phone_hash | text (unique) | SHA-256 hash of phone number |
| default_reminder_days | integer | Default: 3 |
| created_at | timestamptz | Default: now() |

### Table: `payments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (FK -> users.id) | Owner |
| name | text | Payment name |
| amount | numeric | Payment amount |
| due_date | date | Next due date |
| is_paid | boolean | Default: false |
| reminder_days | integer | Days before to remind |
| is_recurring | boolean | Default: false (monthly if true) |
| created_at | timestamptz | Default: now() |

### RLS Policies
- No auth used — RLS will use a custom approach where the client passes the phone_hash and queries filter by user_id. RLS policies will allow public access since there's no auth.uid() available, but all queries will be scoped by user_id in application code.
- Alternative: disable RLS since phone hash acts as a "password" and all queries are scoped client-side.

---

## Dependencies to Add
- `framer-motion` — butter-smooth animations, page transitions, gesture support
- `vite-plugin-pwa` — PWA manifest, service worker, installability
- `crypto-js` — SHA-256 hashing of phone numbers (or use Web Crypto API)

---

## File Structure

```text
src/
  pages/
    Onboarding.tsx        -- Phone number entry (first launch)
    Schedule.tsx           -- Main payment list
    Settings.tsx           -- Change phone, restore data
  components/
    PaymentCard.tsx        -- Animated payment card with swipe/tap
    AddPaymentSheet.tsx    -- Bottom sheet to add/edit payment
    PageTransition.tsx     -- Framer Motion page wrapper
    BottomNav.tsx          -- Two-tab navigation bar
  hooks/
    useUser.ts             -- Phone hash management, local storage
    usePayments.ts         -- CRUD operations, local + Supabase sync
  lib/
    hash.ts                -- Phone number hashing utility
    sync.ts                -- Local storage <-> Supabase sync logic
  App.tsx                  -- Routes with AnimatePresence
public/
  manifest.json            -- PWA manifest
  icons/                   -- PWA icons (192x192, 512x512)
```

---

## Page Details

### Onboarding (shown only on first visit)
- Dark background with animated logo/title fade-in
- Single phone number input (10 digits, formatted)
- "Get Started" button with scale animation
- Hashes phone, creates user in Supabase, stores hash locally
- Redirects to Schedule page

### Schedule Page (main)
- Header: "Your Payments" with current month
- Staggered card list sorted by due date
- Each card: name, amount, due date, days remaining badge
- Color coding: red (overdue), amber (due within reminder window), green (upcoming)
- Tap card to mark as paid (checkmark animation)
- Long-press or edit icon to edit/delete
- Floating "+" button to add payment (opens bottom sheet)
- Monthly recurring payments auto-generate next month's entry when marked paid
- In-app reminder badges for payments within reminder window

### Settings Page
- "Change Phone Number" — update hash, migrate data
- "Restore Data" — enter old phone to pull from Supabase
- Default reminder days slider
- App version info

### Bottom Navigation
- Two tabs: Schedule (calendar icon) and Settings (gear icon)
- Active tab indicator with animated underline

---

## Animations (Framer Motion)
- Page transitions: slide + fade using AnimatePresence
- Card list: staggered fade-in on mount
- Payment cards: spring-based tap feedback, scale on press
- Mark as paid: checkmark draw animation + card color shift
- Add payment sheet: slide up from bottom with backdrop blur
- Bottom nav: active indicator slides between tabs
- Onboarding: sequential fade-in of elements

---

## Data Flow
1. On first launch -> Onboarding -> hash phone -> create Supabase user -> store hash in localStorage
2. On subsequent launches -> read hash from localStorage -> fetch payments from Supabase -> cache locally
3. All mutations (add/edit/delete/mark paid) -> update local state immediately -> sync to Supabase in background
4. On "Restore Data" -> enter phone -> hash it -> query Supabase for user -> replace local data

---

## PWA Setup
- `vite-plugin-pwa` with auto-update strategy
- Manifest: app name "PayTrack", dark theme color, standalone display
- Service worker with `navigateFallbackDenylist: [/^\/~oauth/]`
- App icons in public/icons/

---

## Design Theme
- Background: near-black (#0a0a0a / #141414)
- Cards: dark gray (#1a1a1a) with subtle border
- Accent: Netflix red (#e50914) for primary actions
- Text: white/light gray
- Status colors: red for overdue, amber for due soon, emerald for upcoming
- Font: system font stack for performance

---

## Implementation Order
1. Database migration (create users + payments tables)
2. PWA setup (manifest, service worker, icons)
3. Dark theme CSS variables update
4. Hash utility and user hook
5. Onboarding page
6. Bottom navigation
7. Schedule page with payment cards
8. Add/edit payment bottom sheet
9. Mark as paid functionality with recurring logic
10. Settings page
11. Framer Motion animations throughout
12. Local storage caching and sync logic

