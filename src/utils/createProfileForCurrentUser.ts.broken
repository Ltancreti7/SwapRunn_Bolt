import { supabase } from "@/integrations/supabase/client";

export type SupportedUserType = "dealer" | "driver" | "staff" | "admin";

export interface CreateProfileParams {
  userType: SupportedUserType;
  name?: string | null;
  phone?: string | null;
  companyName?: string | null;
  dealerId?: string | null;
}

/**
 * Tries the backend RPC `create_profile_for_current_user` first.
 * If it doesn't exist (404) or fails, falls back to available RPCs or
 * direct inserts that respect RLS to bootstrap the minimal profile rows.
 */
export async function createProfileForCurrentUser(params: CreateProfileParams) {
  const { userType, name, phone, companyName } = params;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // 1) Try the expected RPC if present
  try {
    const { data, error } = await supabase.rpc("create_profile_for_current_user", {
      _user_type: userType,
      _name: name ?? null,
      _phone: phone ?? null,
      _company_name: companyName ?? null,
    });
    if (!error) return data;
  } catch (_) {
    // Continue to fallbacks
  }

  // 2) Dealer-specific RPC fallback
  if (userType === "dealer") {
    try {
      const minimalCompany = (companyName ?? "Pending Dealership").trim() || "Pending Dealership";
      const contactName = (name ?? user.email ?? "Dealer User").toString();
      const businessEmail = user.email ?? `${user.id}@unknown.invalid`;
      const phoneVal = phone ?? "";

      const { data, error } = await supabase.rpc("create_dealer_profile", {
        p_user_id: user.id,
        dealership_name: minimalCompany,
        contact_name: contactName,
        business_email: businessEmail,
        address: "",
        phone: phoneVal,
      });
      if (!error) return data;
    } catch (_) {
      // Continue to RLS inserts
    }
  }

  // 3) RLS-respecting direct inserts as last resort
  // Profiles: policy allows insert when id = auth.uid()
  const profilePayload: Record<string, any> = {
    id: user.id,
    user_id: user.id,
    user_type: userType,
    full_name: name ?? null,
    phone: phone ?? null,
  };

  await supabase.from("profiles").upsert(profilePayload, { onConflict: "user_id" });

  if (userType === "dealer") {
    // Dealership profile requires non-null columns
    const dealershipPayload = {
      user_id: user.id,
      dealership_name: (companyName ?? "Pending Dealership").trim() || "Pending Dealership",
      contact_name: (name ?? user.email ?? "Dealer User").toString(),
      business_email: user.email ?? `${user.id}@unknown.invalid`,
      address: "",
      phone: (phone ?? "").toString(),
    };
    await supabase.from("dealership_profiles").upsert(dealershipPayload, { onConflict: "user_id" });
  } else if (userType === "driver") {
    // Drivers table requires NOT NULL full_name and phone
    const driverPayload = {
      user_id: user.id,
      full_name: (name ?? "Pending Driver").toString(),
      phone: (phone ?? "unknown").toString(),
    } as Record<string, any>;
    await supabase.from("drivers").upsert(driverPayload, { onConflict: "user_id" });
  }

  return { ok: true };
}

export default createProfileForCurrentUser;

