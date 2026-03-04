import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone_hash, new_pin_hash } = await req.json();

    if (!phone_hash || !new_pin_hash) {
      return new Response(JSON.stringify({ error: "Missing phone_hash or new_pin_hash" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by phone_hash
    const { data: user, error: findError } = await supabaseAdmin
      .from("users")
      .select("id, auth_id")
      .eq("phone_hash", phone_hash)
      .maybeSingle();

    if (findError || !user) {
      return new Response(JSON.stringify({ error: "No account found with that phone number" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user.auth_id) {
      return new Response(
        JSON.stringify({ error: "This account needs to be re-registered first" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update auth password
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.auth_id,
      { password: new_pin_hash }
    );

    if (authUpdateError) {
      console.error("Auth update error:", authUpdateError);
      return new Response(JSON.stringify({ error: "Failed to reset PIN" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update pin_hash in users table
    const { error: userUpdateError } = await supabaseAdmin
      .from("users")
      .update({ pin_hash: new_pin_hash })
      .eq("id", user.id);

    if (userUpdateError) {
      console.error("User update error:", userUpdateError);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
