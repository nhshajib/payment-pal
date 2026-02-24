

# Settings Page Redesign: Clean & Organized

## Problem
The current Settings page is a 1,577-line monolith with 7 sections (Premium, Account, Preferences, Data, Notifications, Support, Danger Zone) all visible at once in a long scroll. Users are overwhelmed by ~15+ rows and numerous modals competing for attention.

## Solution: Category-Based Navigation

Replace the flat scroll with a **two-level navigation** pattern -- a clean top-level menu with 4-5 grouped categories, each opening into its own focused sub-page (rendered inline with a back button, no route change). This mirrors how iOS Settings actually works.

### Top-Level Categories

```text
+----------------------------------+
|  Settings                        |
|                                  |
|  [Premium Banner - stays here]   |
|                                  |
|  GENERAL                         |
|  +------------------------------+|
|  | Profile & Account        >   ||
|  |------------------------------|
|  | Appearance & Display     >   ||
|  +------------------------------+|
|                                  |
|  APP                             |
|  +------------------------------+|
|  | Notifications & Reminders >  ||
|  |------------------------------|
|  | Data & Export             >  ||
|  +------------------------------+|
|                                  |
|  +------------------------------+|
|  | About PayTrack            >  ||
|  +------------------------------+|
|                                  |
|  [Sign Out]                      |
|                                  |
|  PayTrack v2.5                   |
+----------------------------------+
```

### Sub-Pages (slide-in from right)

Each category page shows only its relevant settings:

- **Profile & Account**: Name, Phone/Restore, Install App
- **Appearance & Display**: Theme toggle, Accent Color, Currency
- **Notifications & Reminders**: Master toggle, notification types, default reminder days, clear paid day
- **Data & Export**: Monthly Budget, Export CSV

This cuts the visible items on the main page from ~15 to ~5 categories, making it instantly scannable.

---

## Technical Approach

### File Changes

| File | Action | Purpose |
|------|------|---------|
| `src/pages/Settings.tsx` | Edit | Restructure into category navigation with sub-views |

No new files needed -- the sub-pages are rendered inline using a `currentView` state variable (`'main' | 'profile' | 'appearance' | 'notifications' | 'data'`).

### Implementation Details

1. **Navigation state**: Add `const [currentView, setCurrentView] = useState<string>('main')` to control which sub-page is shown.

2. **Animated transitions**: Use `framer-motion` `AnimatePresence` with slide-left/slide-right transitions when navigating between the main menu and sub-pages (matching iOS drill-down behavior).

3. **Back button**: Each sub-page gets a top bar with a `ChevronLeft` back button and the category title.

4. **Premium banner**: Stays on the main page at the top -- it's the most important CTA and should not be buried.

5. **Sign Out**: Stays on the main page at the bottom as a standalone red button -- not hidden inside a sub-page.

6. **All existing modals preserved**: The bottom sheet modals (currency picker, reminder slider, etc.) continue to work exactly as they do now, just triggered from within their respective sub-pages instead of the main scroll.

7. **Reduced cognitive load**: Each sub-page has at most 3-5 items, making every screen easy to scan in under 2 seconds.

### Sub-Page Content Breakdown

**Profile & Account** (3 items):
- Name (opens existing name modal)
- Restore / Change Device (opens existing restore modal)
- Install App (if available)

**Appearance & Display** (3 items):
- Theme (Light/Auto/Dark segmented control -- inline, no modal needed)
- Accent Color (opens existing accent modal, premium-gated)
- Currency (opens existing currency modal)

**Notifications & Reminders** (4 items):
- Notifications toggle + settings (opens existing notification modal)
- Default Reminder (opens existing reminder modal)
- Clear Paid List (opens existing clear day modal)
- Monthly Budget (opens existing budget modal, premium-gated)

**Data & Export** (2 items):
- Export Payments CSV (direct action, premium-gated)
- About / Changelog (opens existing about modal)

### Animation Pattern

```text
Main -> Sub-page:  Main slides left + fades, Sub-page slides in from right
Sub-page -> Main:  Sub-page slides right + fades, Main slides in from left
```

Using framer-motion variants with `x` offset and opacity for smooth 300ms transitions.

