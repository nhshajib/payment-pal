

# Free Trials as a Standalone Feature on Schedule Page

## What Changes

### 1. FAB becomes a "Type Picker" (Schedule page)
When the user taps the "+" FAB on the Schedule page, instead of immediately opening the AddPaymentSheet, a small bottom action sheet appears with two options:
- **Regular Payment** -- opens AddPaymentSheet as before
- **Free Trial** (with a Crown icon for premium) -- if premium, opens the enhanced AddTrialSheet; if not premium, shows the premium upsell toast/popup

### 2. Replace "Calendar" tab with "Free Trials" tab
The segmented control changes from `Upcoming | Paid | Calendar` to `Upcoming | Paid | Trials`. The Trials tab:
- Shows a Crown icon next to "Trials" label (like Calendar did)
- If not premium, tapping it shows a premium upsell
- If premium, displays all active (non-cancelled) trials sorted by expiration, with countdown badges and swipe-to-cancel

### 3. Enhanced AddTrialSheet
The existing AddTrialSheet gets additional fields:
- **Website/Service URL** (optional) -- the website the trial is from
- **Reminder days before expiry** -- a selector (1 day, 3 days, 1 week) so users know when to cancel
- **Category** -- reuse existing category picker or a simple "type" field

### 4. Free Trial Cards in the Trials Tab
Each trial card shows:
- Trial name (bold)
- "Expires in X days" badge (green if >7 days, orange if 3-7, red if <=3)
- Cancel URL as a tappable link button
- Swipe-left to delete, tap to mark cancelled
- Cancelled trials shown dimmed at the bottom

### 5. Free Trials also appear on Overview page
The existing Free Trials section on Overview stays but becomes a compact summary (top 3 expiring-soonest trials with a "See All" link that navigates to Schedule > Trials tab).

---

## Technical Details

### Files Modified

| File | Changes |
|------|---------|
| `src/pages/Schedule.tsx` | Replace Calendar tab with Trials tab; add "type picker" sheet state for FAB; import and render AddTrialSheet and trial cards; integrate `useFreeTrials` hook |
| `src/components/AddTrialSheet.tsx` | Add reminder_days field, website URL field; enhance form layout to match AddPaymentSheet style |
| `src/components/AddPaymentSheet.tsx` | No changes needed |
| `src/hooks/useFreeTrials.ts` | No changes (existing hook covers all CRUD) |

### No database changes needed
The `free_trials` table already has all required columns (`name`, `expires_on`, `cancel_url`, `is_cancelled`, `notes`). The reminder days can be stored in the `notes` field as a prefix or we can add a `reminder_days` column via migration. Since the notification system already reads from `notes`, storing reminder preference in `notes` as JSON is simpler and avoids a migration.

### Implementation Flow

**FAB Type Picker**: A small `AnimatePresence` bottom sheet with two tappable rows. State: `fabPickerOpen: boolean`. Tapping "Regular Payment" sets `fabPickerOpen=false` and `sheetOpen=true`. Tapping "Free Trial" checks premium status first.

**Trials Tab Content**: Render trials from `useFreeTrials` hook grouped into "Active" and "Cancelled" sections. Each trial card uses the same minimalist iOS list-item style as PaymentCard (circular icon, name, countdown badge, swipe gesture).

**Premium Gating**: The "Trials" tab and "Free Trial" FAB option both check `isPremium`. Non-premium users see a toast: "Upgrade to Premium for Free Trial Tracking" with a Crown icon.

**AddTrialSheet Enhancements**: Add a "Remind me" row with pill buttons (1 day, 3 days, 1 week before expiry) matching the existing reminder UI pattern in PaymentActionSheet. Add a website URL input field.

