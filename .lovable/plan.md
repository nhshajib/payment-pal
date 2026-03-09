

## Plan: Replace Insights Tab with "Split" (Bill Splitting Feature)

### Overview
Move the current Insights content into Settings as a subsection. Replace the Insights tab with a new "Split" tab — a minimal Splitwise-like bill splitting feature with full backend support.

### Database Schema (4 new tables)

```text
split_groups          split_members          split_expenses          split_shares
┌──────────────┐     ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ id (uuid PK) │──┐  │ id (uuid PK)     │   │ id (uuid PK)     │   │ id (uuid PK)     │
│ user_id      │  │  │ group_id → groups │   │ group_id → groups│   │ expense_id →     │
│ name         │  └──│ name             │   │ title            │   │ member_id →      │
│ created_at   │     │ is_owner (bool)  │   │ amount (numeric) │   │ amount (numeric) │
│ emoji        │     │ created_at       │   │ paid_by → member │   │ is_settled (bool)│
└──────────────┘     └──────────────────┘   │ date             │   │ created_at       │
                                            │ notes            │   └──────────────────┘
                                            │ created_at       │
                                            └──────────────────┘
```

- **split_groups**: Events/groups created by the user (max 5 members per group for free users)
- **split_members**: People in each group (name-based, no auth required for members)
- **split_expenses**: Bills within a group — who paid, total amount
- **split_shares**: Per-member share of each expense, with settlement tracking

All tables have RLS policies using `get_internal_user_id()` pattern, scoped through group ownership.

### Frontend Pages & Components

1. **Split.tsx** (new page at `/split`)
   - Groups list view — iOS-style cards with emoji, name, member count, balance summary
   - FAB to create new group
   - Tap group → group detail view

2. **SplitGroupDetail.tsx** (new component)
   - Header: group name + emoji, member avatars
   - Balance summary: who owes whom (simplified)
   - Expenses list with swipe actions
   - Add expense button
   - Members management

3. **AddGroupSheet.tsx** — Bottom sheet to create group (name, emoji, add members up to 5)

4. **AddExpenseSheet.tsx** — Bottom sheet: title, amount, paid by (select member), split among (checkboxes), date

5. **SettlementView.tsx** — Shows optimized "who pays whom" with settle button

### Navigation Changes

- **BottomNav.tsx**: Replace `Lightbulb`/Insights with `Scissors` (or `Split`)/Split icon
- **App.tsx**: Replace `/insights` route with `/split`, add redirect from `/insights` to `/split`
- **Settings.tsx**: Add "Insights" subsection with the Overview page content embedded

### Key Features
- Add up to 5 members per group (name only, no phone required)
- Create expenses, select payer and participants
- Auto-calculate equal splits or custom amounts
- Balance summary per group (who owes whom)
- Mark debts as settled
- All data persisted in Supabase with RLS

### Files to Create
1. `src/pages/Split.tsx` — Main split tab page
2. `src/components/split/SplitGroupDetail.tsx` — Group detail view
3. `src/components/split/AddGroupSheet.tsx` — Create group bottom sheet
4. `src/components/split/AddExpenseSheet.tsx` — Add expense bottom sheet
5. `src/components/split/BalanceSummary.tsx` — Who owes whom calculation
6. `src/hooks/useSplitGroups.ts` — Data hook for all split operations

### Files to Modify
1. `src/components/BottomNav.tsx` — Replace Insights with Split
2. `src/App.tsx` — Update routes
3. `src/pages/Settings.tsx` — Add Insights subsection
4. Database migration — 4 new tables with RLS

### Design
iOS native aesthetic throughout — true black background, rounded cards with `mono-card` style, bottom sheets for creation forms, haptic feedback on actions, Netflix Red for primary actions.

