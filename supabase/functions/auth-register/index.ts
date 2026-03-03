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
    const { phone_hash, pin_hash, name } = await req.json();

    if (!phone_hash || !pin_hash) {
      return new Response(JSON.stringify({ error: "Missing phone_hash or pin_hash" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use phone_hash as synthetic email
    const email = `${phone_hash.slice(0, 40)}@paytrack.app`;

    // Check if auth user with this email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find((u) => u.email === email);

    if (existingAuthUser) {
      return new Response(
        JSON.stringify({ error: "An account with this phone number already exists. Please sign in instead." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase Auth user (confirmed, no email verification needed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: pin_hash,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      console.error("Auth create error:", authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authId = authData.user.id;

    // Check if a users row with this phone_hash already exists (re-registration)
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("phone_hash", phone_hash)
      .maybeSingle();

    let userId: string;

    if (existingUser) {
      // Re-link existing user to new auth account
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ auth_id: authId, name: name || "", pin_hash })
        .eq("id", existingUser.id);

      if (updateError) {
        console.error("User update error:", updateError);
        // Clean up auth user
        await supabaseAdmin.auth.admin.deleteUser(authId);
        return new Response(JSON.stringify({ error: "Failed to link account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = existingUser.id;
    } else {
      // Create new users row
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert({ phone_hash, name: name || "", pin_hash, auth_id: authId })
        .select("id")
        .single();

      if (insertError) {
        console.error("User insert error:", insertError);
        await supabaseAdmin.auth.admin.deleteUser(authId);
        return new Response(JSON.stringify({ error: "Failed to create user profile" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = newUser.id;
    }

    // Sign in the user to get a session
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: pin_hash,
    });

    if (signInError) {
      console.error("Sign in error:", signInError);
      return new Response(JSON.stringify({ error: "Account created but sign-in failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        user_id: userId,
        auth_id: authId,
        name: name || "",
        session: signInData.session,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
