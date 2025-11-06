import { supabase } from "@/integrations/supabase/client";

export interface JobCreationParams {
  type: "delivery" | "swap";
  pickup_address: string;
  delivery_address: string;
  year: number;
  make: string;
  model: string;
  vin?: string | null;
  customer_name: string;
  customer_phone: string;
  timeframe: string;
  notes?: string | null;
  requires_two?: boolean;
  distance_miles?: number;
  trade_year?: number | null;
  trade_make?: string | null;
  trade_model?: string | null;
  trade_vin?: string | null;
  trade_transmission?: string | null;
}

type SupabaseUser = {
  id: string;
  email?: string | null;
};

type ProfileRecord = {
  user_type: string | null;
  dealer_id: string | null;
};

const ensureSession = async (): Promise<{ user: SupabaseUser; token: string }> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Auth error: ${userError.message}`);
  }

  if (!user) {
    throw new Error("Session missing. Login required.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Auth error: ${sessionError.message}`);
  }

  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error("Session token missing. Please sign in again.");
  }

  return { user: { id: user.id, email: user.email }, token: accessToken };
};

const fetchDealerProfile = async (): Promise<ProfileRecord> => {
  const { data, error } = await supabase.rpc("get_user_profile").maybeSingle();

  if (error && (error as any).code !== "PGRST116") {
    throw new Error(`Profile error: ${error.message}`);
  }

  const profile = data ?? null;
  if (!profile) {
    throw new Error("No user profile found. Please log out and log back in.");
  }

  return {
    user_type: profile.user_type ?? null,
    dealer_id: profile.dealer_id ?? null,
  };
};

const buildTradeNote = (params: JobCreationParams, baseNotes: string | null) => {
  const tradeDetails = [
    params.trade_year ? `Year: ${params.trade_year}` : null,
    params.trade_make ? `Make: ${params.trade_make}` : null,
    params.trade_model ? `Model: ${params.trade_model}` : null,
    params.trade_vin ? `VIN: ${params.trade_vin}` : null,
    params.trade_transmission
      ? `Transmission: ${params.trade_transmission}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  if (!tradeDetails) {
    return baseNotes;
  }

  const tradeNote = `[Trade Vehicle]\n${tradeDetails}`;
  return baseNotes ? `${baseNotes}\n\n${tradeNote}` : tradeNote;
};

const buildJobPayload = (
  params: JobCreationParams,
  notes: string | null,
  includeTradeFields: boolean,
) => ({
  type: params.type,
  pickup_address: params.pickup_address,
  delivery_address: params.delivery_address,
  year: params.year,
  make: params.make,
  model: params.model,
  vin: params.vin ?? null,
  customer_name: params.customer_name,
  customer_phone: params.customer_phone,
  timeframe: params.timeframe,
  notes,
  requires_two: params.requires_two ?? false,
  distance_miles: params.distance_miles ?? 25,
  trade_year: includeTradeFields ? params.trade_year ?? null : null,
  trade_make: includeTradeFields ? params.trade_make ?? null : null,
  trade_model: includeTradeFields ? params.trade_model ?? null : null,
  trade_vin: includeTradeFields ? params.trade_vin ?? null : null,
  trade_transmission: includeTradeFields
    ? params.trade_transmission ?? null
    : null,
});

const callCreateJobApi = async (
  token: string,
  payload: Record<string, unknown>,
) => {
  const response = await fetch("/api/addJob", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result?.success) {
    const message =
      (result && typeof result.error === "string" && result.error) ||
      "Failed to create job.";
    const error = new Error(message);
    (error as Error & { details?: unknown }).details = result;
    throw error;
  }

  return result.job;
};

const shouldFallbackWithoutTradeColumns = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes("trade_") &&
    normalized.includes("column") &&
    normalized.includes("does not exist")
  );
};

export const createJob = async (params: JobCreationParams) => {
  try {
    try {
      await supabase.rpc("auto_repair_dealer_profile");
    } catch (repairError) {
      console.warn("Dealer profile auto-repair failed (continuing):", repairError);
    }

    const { token } = await ensureSession();
    const profile = await fetchDealerProfile();

    if (!profile.user_type) {
      throw new Error("Profile missing user type. Please contact support.");
    }

    if (!["dealer", "staff", "admin"].includes(profile.user_type)) {
      throw new Error("You do not have permission to create jobs.");
    }

    if (!profile.dealer_id && profile.user_type !== "admin") {
      throw new Error(
        "Dealer account is missing dealership information. Please contact support.",
      );
    }

    const sanitizedNotes = params.notes?.trim() ? params.notes.trim() : null;
    const tradeFieldsPresent = [
      params.trade_year,
      params.trade_make,
      params.trade_model,
      params.trade_vin,
      params.trade_transmission,
    ].some((value) => value !== null && value !== undefined && value !== "");

    const initialPayload = buildJobPayload(
      params,
      sanitizedNotes,
      tradeFieldsPresent,
    );

    try {
      return await callCreateJobApi(token, initialPayload);
    } catch (initialError) {
      if (tradeFieldsPresent && shouldFallbackWithoutTradeColumns(initialError)) {
        const fallbackNotes = buildTradeNote(params, sanitizedNotes);
        const fallbackPayload = buildJobPayload(params, fallbackNotes, false);
        return await callCreateJobApi(token, fallbackPayload);
      }

      throw initialError;
    }
  } catch (error) {
    console.error("💥 BULLETPROOF JOB CREATION FAILED:", error);
    throw error;
  }
};
