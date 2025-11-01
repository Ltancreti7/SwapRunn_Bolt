import { supabase } from "@/integrations/supabase/client";

export const repairUserProfile = async () => {
  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Get user metadata for profile creation
    const userType = user.user_metadata?.user_type;
    const name =
      user.user_metadata?.full_name || user.user_metadata?.company_name;
    const phone = user.user_metadata?.phone;
    const companyName = user.user_metadata?.company_name;

    // CRITICAL: Do not assume a default user type
    // If no user_type is found, throw an error to force proper account setup
    if (!userType) {
      throw new Error(
        "Account setup incomplete: No user type found. Please contact support or re-register with the correct account type.",
      );
    }

    // Validate that the user_type is one of the expected values
    if (userType !== "dealer" && userType !== "driver") {
      throw new Error(
        `Invalid user type: ${userType}. Expected 'dealer' or 'driver'.`,
      );
    }

    // Use the secure database function to create profile
    const { data, error } = await supabase.rpc(
      "create_profile_for_current_user",
      {
        _user_type: userType,
        _name: name,
        _phone: phone,
        _company_name: companyName,
      },
    );

    if (error) {
      throw error;
    }

    console.log("Profile created successfully:", data);
    return data;
  } catch (error) {
    console.error("Profile repair failed:", error);
    throw error;
  }
};
