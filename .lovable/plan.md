
### Premium Upgrade Redesign & Subscription Plan

**1. UI Redesign (src/pages/Premium.tsx)**
- **Modern & Classy Aesthetic:** Redesign the upgrade screen with a polished, glassmorphism-inspired "Apple Wallet" look. We'll use smooth animations (`framer-motion`), soft glowing gradients, and distinct visual hierarchy.
- **Three Pricing Tiers:** 
  - **Monthly:** $0.99/mo (includes clear "auto-renews" language)
  - **Yearly:** $2.99/yr (highlighted as "Best Value" or "Popular", includes "auto-renews" language)
  - **Lifetime:** $4.99 one-time (marked as "Ultimate")
- **Interactive Selection:** A sleek segmented control or stacked interactive cards to let the user select their preferred plan before proceeding to payment.
- **Features List:** We'll keep the feature list but present it in a more refined, clean checklist format.

**2. Auto-Renewal & Payment Backend**
- **Current State:** The app currently uses a custom Supabase Edge Function (`paypal-payment`) that handles one-time PayPal orders.
- **New Requirement:** To actually perform auto-renewals, we need a subscription management system.
- **Proposed Approach:** 
  - **Option A (Stripe Integration - Recommended):** We can enable Lovable's built-in Stripe integration, which natively handles monthly/yearly subscriptions, auto-renewals, and lifetime (one-time) payments perfectly. It provides a highly optimized checkout UI.
  - **Option B (Update PayPal):** Alternatively, we can rewrite the `paypal-payment` Edge Function to use the PayPal Subscriptions API for the monthly/yearly plans and keep the Orders API for the lifetime plan.

**3. Database Updates**
- We will need to update the `users` table to track the subscription status more precisely (e.g., `premium_plan_type`: 'monthly' | 'yearly' | 'lifetime', and `premium_expires_at` for tracking renewal periods).

**Next Steps:**
Once you approve this plan, let me know if you would prefer to switch to **Stripe** (which handles subscriptions very smoothly) or if we should stick with **PayPal** and update the existing edge function!
