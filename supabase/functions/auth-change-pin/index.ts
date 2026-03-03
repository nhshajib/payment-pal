import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { current_pin_hash, new_pin_hash } = await req.json();

    if (!current_pin_hash || !new_pin_hash) {
      return new Response(JSON.stringify({ error: "Missing current or new PIN hash" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the caller's identity
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify current PIN by checking pin_hash in users table
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("id, pin_hash")
      .eq("auth_id", authUser.id)
      .single();

    if (!userData || userData.pin_hash !== current_pin_hash) {
      return new Response(JSON.stringify({ error: "Current PIN is incorrect" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update auth password
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: new_pin_hash }
    );

    if (updateAuthError) {
      return new Response(JSON.stringify({ error: "Failed to update PIN" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update pin_hash in users table
    await supabaseAdmin
      .from("users")
      .update({ pin_hash: new_pin_hash })
      .eq("id", userData.id);

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
