import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateStaffRequest {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  role: string;
  password?: string;
  dealership_id?: string;
  is_staff_member?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase service credentials are not configured");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      firstName,
      lastName,
      name,
      email: rawEmail,
      phone,
      role,
      password,
      dealership_id,
      is_staff_member,
    }: CreateStaffRequest = await req.json();

    // Normalize email to lowercase and trim
    const email = rawEmail.trim().toLowerCase();

    // Handle name field (could be full name or first+last)
    const fullName = name || `${firstName || ""} ${lastName || ""}`.trim();

    console.log("Creating staff member:", { fullName, email, role });

    // Find existing user by email (case-insensitive)
    let authUserId: string;
    let createdUser = false;

    const adminApi = supabaseAdmin.auth
      .admin as typeof supabaseAdmin.auth.admin & {
      getUserByEmail?: (email: string) => Promise<{
        data: { user: { id: string } | null };
        error: { message: string } | null;
      }>;
    };

    let existingUserId: string | null = null;

    if (typeof adminApi.getUserByEmail === "function") {
      const { data: existingUserData, error: getUserError } =
        await adminApi.getUserByEmail(email);

      if (getUserError && getUserError.message !== "User not found") {
        console.error("Error checking existing user by email:", getUserError);
        throw new Error("Failed to check existing users");
      }

      existingUserId = existingUserData?.user?.id ?? null;
    } else {
      console.warn(
        "getUserByEmail is not available in this Supabase client version; falling back to admin listUsers.",
      );

      type AdminUser = {
        id: string;
        email?: string | null;
      };

      const { data: userList, error: listError } =
        await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error("Fallback user list lookup failed:", listError);
        throw new Error("Failed to check existing users");
      }

      existingUserId =
        userList.users.find(
          (user: AdminUser) => user.email?.toLowerCase() === email,
        )?.id ?? null;
    }

    if (existingUserId) {
      console.log("User already exists, reusing:", existingUserId);
      authUserId = existingUserId;
      createdUser = false;
    } else {
      // Create new auth user - generate temp password if not provided
      const userPassword = password || Math.random().toString(36).slice(-12);

      const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: userPassword,
          email_confirm: true,
          user_metadata: {
            name: fullName,
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            phone,
            is_staff_member: "true", // Prevent the trigger from creating a dealer
          },
        });

      if (authError) {
        console.error("Auth user creation error:", authError);
        throw authError;
      }

      console.log("Auth user created:", authUser.user.id);
      authUserId = authUser.user.id;
      createdUser = true;
    }

    // 2. Get the dealer_id - either from request or current user context
    let targetDealerId: string;

    if (dealership_id) {
      // For staff signup with dealership code - use the provided dealership_id
      targetDealerId = dealership_id;
    } else {
      // For admin inviting staff - get current user's dealer_id
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("No authorization header");
      }

      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      if (!anonKey) {
        throw new Error("Supabase anon key is not configured");
      }

      const supabaseClient = createClient(supabaseUrl, anonKey, {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      });

      // Get the current user's profile to find their dealer_id
      const { data: currentUser } = await supabaseClient.auth.getUser();
      if (!currentUser.user) {
        throw new Error("Unable to get current user");
      }

      const { data: currentProfile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("dealer_id")
        .eq("user_id", currentUser.user.id)
        .single();

      if (profileError || !currentProfile?.dealer_id) {
        console.error("Profile fetch error:", profileError);
        throw new Error("Unable to get current user dealer_id");
      }

      targetDealerId = currentProfile.dealer_id;
    }

    console.log("Target dealer_id:", targetDealerId);

    // 3. Ensure profile exists (upsert to handle existing users) with name information
    const { data: profileData, error: profileUpsertError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          user_id: authUserId,
          user_type: "dealer",
          dealer_id: targetDealerId,
          full_name: fullName,
          first_name: firstName || fullName.split(" ")[0] || "",
          last_name: lastName || fullName.split(" ").slice(1).join(" ") || "",
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (profileUpsertError) {
      console.error("Profile upsert error:", profileUpsertError);
      throw profileUpsertError;
    }

    console.log("Profile ensured:", profileData.id);

    // 4. Upsert staff membership (idempotent)
    const { data: staffRecord, error: staffError } = await supabaseAdmin
      .from("dealership_staff")
      .upsert(
        {
          user_id: authUserId,
          dealer_id: targetDealerId,
          role: role,
          joined_at: new Date().toISOString(),
          is_active: true,
        },
        {
          onConflict: "user_id,dealer_id",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (staffError) {
      console.error("Staff record upsert error:", staffError);
      throw staffError;
    }

    console.log("Staff record ensured:", staffRecord.id);

    // 5. Auto-populate position based on role for sales staff
    if (role === "sales") {
      // Get the dealer record for this staff member to update their position
      const { data: dealerRecord, error: fetchError } = await supabaseAdmin
        .from("dealers")
        .select("id")
        .eq("id", targetDealerId)
        .single();

      if (!fetchError && dealerRecord) {
        // Update the dealer record's position for this specific user
        const { error: dealerUpdateError } = await supabaseAdmin
          .from("dealers")
          .update({ position: "Client Advisor" })
          .eq("id", targetDealerId);

        if (dealerUpdateError) {
          console.error("Error updating dealer position:", dealerUpdateError);
          // Don't throw - this is not critical to the staff creation process
        } else {
          console.log(
            "Auto-populated position 'Client Advisor' for sales role",
          );
        }
      }
    }

    // Determine what action was taken
    let message = "";
    if (createdUser) {
      message = `Created account and added ${fullName} as a ${role}`;
    } else {
      message = `Linked existing account and updated ${fullName} as a ${role}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authUserId,
        createdUser,
        addedToStaff: true,
        message,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (error: unknown) {
    console.error("Error in create-staff-member function:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create staff member";
    const details =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;
    return new Response(
      JSON.stringify({
        error: message,
        details,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
};

serve(handler);
