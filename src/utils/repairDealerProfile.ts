import { supabase } from "@/integrations/supabase/client";

export const repairDealerProfile = async (): Promise<void> => {
  try {
    console.log("🔧 Attempting to repair dealer profile...");
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    // Get current profile
    const { data: profiles, error: profileError } = await supabase.rpc("get_user_profile");
    if (profileError) {
      throw new Error(`Failed to get profile: ${profileError.message}`);
    }

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      throw new Error("No profile found");
    }

    const profile = profiles[0];
    console.log("📋 Current profile:", profile);

    // If not a dealer, nothing to fix
    if (profile.user_type !== 'dealer') {
      console.log("✅ Profile is not a dealer, no fix needed");
      return;
    }

    // If dealer_id is already set, nothing to fix
    if (profile.dealer_id) {
      console.log("✅ Profile already has dealer_id, no fix needed");
      return;
    }

    console.log("🚨 Profile missing dealer_id, creating dealer record...");

    // Create a dealer record for this user
    const { data: dealerData, error: dealerError } = await supabase
      .from("dealers")
      .insert({
        name: profile.full_name || "Dealer",
        email: userData.user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dealerError) {
      // Dealer might already exist, try to find it
      console.log("🔍 Dealer creation failed, trying to find existing dealer...");
      const { data: existingDealer, error: findError } = await supabase
        .from("dealers")
        .select()
        .eq("email", userData.user.email)
        .single();

      if (findError || !existingDealer) {
        throw new Error(`Failed to create or find dealer: ${dealerError.message}`);
      }

      console.log("✅ Found existing dealer:", existingDealer);
      
      // Update profile with existing dealer_id
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          dealer_id: existingDealer.id,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userData.user.id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      console.log("✅ Profile updated with existing dealer_id");
      return;
    }

    console.log("✅ Created new dealer:", dealerData);

    // Update profile with new dealer_id
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        dealer_id: dealerData.id,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userData.user.id);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    console.log("✅ Profile updated with new dealer_id");
    console.log("🎉 Dealer profile repair completed successfully!");

  } catch (error) {
    console.error("💥 Dealer profile repair failed:", error);
    throw error;
  }
};