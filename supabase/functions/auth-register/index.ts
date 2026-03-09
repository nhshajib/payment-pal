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
    const { phone_hash, pin_hash, name } = await req.json();

    // Input validation
    if (!phone_hash || typeof phone_hash !== "string" || phone_hash.length < 10 || phone_hash.length > 128) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!pin_hash || typeof pin_hash !== "string" || pin_hash.length < 10 || pin_hash.length > 128) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Sanitize name
    const sanitizedName = typeof name === "string" ? name.trim().slice(0, 50) : "";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use phone_hash as synthetic email
    const email = `${phone_hash.slice(0, 40)}@paytrack.app`;

    // Try to create auth user directly
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: pin_hash,
      email_confirm: true,
      user_metadata: { name: sanitizedName },
    });

    if (authError) {
      if (authError.message?.includes("already been registered") || authError.message?.includes("already exists")) {
        return new Response(
          JSON.stringify({ error: "An account with this phone number already exists. Please sign in instead." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ error: "Registration failed" }), {
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
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ auth_id: authId, name: sanitizedName, pin_hash })
        .eq("id", existingUser.id);

      if (updateError) {
        await supabaseAdmin.auth.admin.deleteUser(authId);
        return new Response(JSON.stringify({ error: "Failed to link account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = existingUser.id;
    } else {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert({ phone_hash, name: sanitizedName, pin_hash, auth_id: authId })
        .select("id")
        .single();

      if (insertError) {
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
      return new Response(JSON.stringify({ error: "Account created but sign-in failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        user_id: userId,
        auth_id: authId,
        name: sanitizedName,
        session: signInData.session,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
