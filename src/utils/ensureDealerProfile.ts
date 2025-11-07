import { supabase } from "@/integrations/supabase/client";

/**
 * Ensure the current user is set up as a dealer.
 * - Updates auth metadata to user_type=dealer
 * - Converts existing profile.user_type to 'dealer'
 * - Ensures profiles.dealer_id points to a dealers row (creates one if absent)
 */
export async function ensureDealerProfile(options?: {
  companyName?: string | null;
  fullName?: string | null;
  phone?: string | null;
}): Promise<{ ok: boolean; dealerId?: string | null }>
{
  // 1) Get current user
  const { data: userResp, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userResp.user) {
    return { ok: false };
  }

  const user = userResp.user;

  // 2) Best-effort: update auth metadata to dealer
  try {
    await supabase.auth.updateUser({ data: { user_type: "dealer" } });
  } catch (_) {
    // Non-fatal
  }

  // 3) Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_type, dealer_id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    // If profile not found, attempt to bootstrap minimal dealer profile
    // using the direct RLS-respecting path.
    const name = (options?.fullName ?? user.user_metadata?.full_name ?? "Dealer").toString();
    const store = (options?.companyName ?? user.user_metadata?.company_name ?? "Pending Dealership").toString();

    // Create dealers row
    const { data: dealerRow, error: dealerErr } = await supabase
      .from("dealers")
      .insert({
        name,
        email: user.email,
        store,
      })
      .select("id")
      .single();

    if (dealerErr) {
      // Try to find by email if insert rejected
      const { data: existing, error: findErr } = await supabase
        .from("dealers")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (!findErr && existing) {
        // Upsert profile pointing to dealer
        await supabase.from("profiles").upsert({
          user_id: user.id,
          user_type: "dealer",
          full_name: name,
          dealer_id: existing.id,
        }, { onConflict: "user_id" });
        return { ok: true, dealerId: existing.id };
      }
      return { ok: false };
    }

    // Upsert profile pointing to dealer
    await supabase.from("profiles").upsert({
      user_id: user.id,
      user_type: "dealer",
      full_name: name,
      dealer_id: dealerRow.id,
    }, { onConflict: "user_id" });
    return { ok: true, dealerId: dealerRow.id };
  }

  // 4) Convert profile.user_type to dealer if needed
  if (profile && profile.user_type !== "dealer") {
    await supabase
      .from("profiles")
      .update({ user_type: "dealer" })
      .eq("user_id", user.id);
  }

  // 5) Ensure dealer_id exists
  if (profile?.dealer_id) {
    return { ok: true, dealerId: profile.dealer_id };
  }

  // Try to find existing dealer by email
  const { data: existingDealer, error: findErr2 } = await supabase
    .from("dealers")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (existingDealer && !findErr2) {
    await supabase
      .from("profiles")
      .update({ dealer_id: existingDealer.id, user_type: "dealer" })
      .eq("user_id", user.id);
    return { ok: true, dealerId: existingDealer.id };
  }

  // Create new dealer as last resort
  const name = (options?.fullName ?? profile?.full_name ?? user.user_metadata?.full_name ?? "Dealer").toString();
  const store = (options?.companyName ?? user.user_metadata?.company_name ?? "Pending Dealership").toString();

  const { data: newDealer, error: createErr } = await supabase
    .from("dealers")
    .insert({ name, email: user.email, store })
    .select("id")
    .single();

  if (createErr || !newDealer) {
    return { ok: false };
  }

  await supabase
    .from("profiles")
    .update({ dealer_id: newDealer.id, user_type: "dealer" })
    .eq("user_id", user.id);

  return { ok: true, dealerId: newDealer.id };
}

export default ensureDealerProfile;

