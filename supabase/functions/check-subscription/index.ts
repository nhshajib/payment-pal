import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map product IDs to plan types
const PRODUCT_PLAN_MAP: Record<string, string> = {
  prod_U79oMbj6jFycgN: "monthly",
  prod_U79pdhGYq49R5y: "yearly",
  prod_U79pRXdLACkCf3: "lifetime",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    
    // Use anon client for getClaims validation
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) throw new Error("Authentication failed");
    
    const userId = claimsData.claims.sub;
    
    // Get user email via service role
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(userId);
    if (authError || !authUser?.user?.email) throw new Error("Could not retrieve user");
    const user = authUser.user;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;

    // Check active subscriptions (monthly/yearly)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      const productId = sub.items.data[0].price.product as string;
      const planType = PRODUCT_PLAN_MAP[productId] || "unknown";
      const subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();

      // Sync premium status to DB
      await supabaseClient
        .from("users")
        .update({ is_premium: true })
        .eq("auth_id", user.id);

      return new Response(JSON.stringify({
        subscribed: true,
        plan_type: planType,
        subscription_end: subscriptionEnd,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check for lifetime one-time payments
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 100,
    });

    const lifetimePurchase = sessions.data.find(
      (s) => s.mode === "payment" && s.payment_status === "paid" && s.metadata?.plan_id === "lifetime"
    );

    if (lifetimePurchase) {
      await supabaseClient
        .from("users")
        .update({ is_premium: true })
        .eq("auth_id", user.id);

      return new Response(JSON.stringify({
        subscribed: true,
        plan_type: "lifetime",
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    await supabaseClient
      .from("users")
      .update({ is_premium: false })
      .eq("auth_id", user.id);

    return new Response(JSON.stringify({ subscribed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
