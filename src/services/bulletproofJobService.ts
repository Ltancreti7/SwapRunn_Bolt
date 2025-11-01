import { supabase } from "@/integrations/supabase/client";
import { repairDealerProfile } from "@/utils/repairDealerProfile";

interface JobCreationParams {
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
  created_by?: string | null;
}

type PreparedJobInsert = {
  type: "delivery" | "swap";
  pickup_address: string;
  delivery_address: string;
  year: number;
  make: string;
  model: string;
  vin: string | null;
  customer_name: string;
  customer_phone: string;
  timeframe: string;
  notes: string | null;
  status: string;
  requires_two: boolean;
  distance_miles: number;
  dealer_id: string;
  track_token: string;
  trade_year?: number | null;
  trade_make?: string | null;
  trade_model?: string | null;
  trade_vin?: string | null;
  trade_transmission?: string | null;
  created_by?: string | null;
};

type CreatedJobRecord = {
  id: string;
  type: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  pickup_address: string;
  delivery_address: string;
  distance_miles?: number | null;
  requires_two?: boolean | null;
  customer_name?: string | null;
};

export const createJob = async (params: JobCreationParams) => {
  try {
    // First, ensure the dealer profile is properly configured using the new auto-repair function
    try {
      console.log("🔧 Auto-repairing dealer profile...");
      const { data: repairResult, error: repairError } = await supabase.rpc(
        "auto_repair_dealer_profile",
      );

      if (repairError) {
        console.warn("⚠️ Auto-repair failed:", repairError);
      } else {
        console.log("✅ Profile repair result:", repairResult);
      }
    } catch (profileFixError) {
      console.warn(
        "Profile repair failed, continuing anyway:",
        profileFixError,
      );
    }

    console.log("🔍 Fetching user profile...");
    const { data: profiles, error: profileError } =
      await supabase.rpc("get_user_profile");

    if (profileError) {
      console.error("❌ Profile fetch error:", profileError);
      throw new Error(`Profile error: ${profileError.message}`);
    }

    console.log("📋 Profiles data:", profiles);

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      console.error("❌ No profiles returned");
      throw new Error("No user profile found. Please log out and log back in.");
    }

    const profile = profiles[0];
    console.log("👤 Current profile:", profile);

    if (!profile || profile.user_type !== "dealer") {
      console.error("❌ User is not a dealer:", profile?.user_type);
      throw new Error("Only dealers can create job requests");
    }

    if (!profile.dealer_id) {
      console.error("❌ Profile missing dealer_id after repair");
      throw new Error(
        "Dealer account not properly configured. Please contact support.",
      );
    }

    console.log("✅ Profile validated. Dealer ID:", profile.dealer_id);

    let requestingUserId = params.created_by ?? null;

    if (!requestingUserId) {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        throw new Error(`Auth error: ${userError.message}`);
      }

      requestingUserId = userData?.user?.id ?? null;
    }

    if (!requestingUserId) {
      throw new Error("Unable to determine requesting user");
    }

    // Generate tracking token
    const trackingToken =
      "SR-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    const sanitizedNotes = params.notes?.trim() ? params.notes.trim() : null;
    const tradeFieldsPresent = [
      params.trade_year,
      params.trade_make,
      params.trade_model,
      params.trade_vin,
      params.trade_transmission,
    ].some((value) => value !== null && value !== undefined && value !== "");

    const jobData: PreparedJobInsert = {
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
      notes: sanitizedNotes,
      status: "open",
      requires_two: params.requires_two || false,
      distance_miles: params.distance_miles || 25,
      dealer_id: profile.dealer_id,
      track_token: trackingToken,
      created_by: requestingUserId,
    };

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

    const tradeNote =
      tradeDetails.length > 0
        ? `[Trade Vehicle]\n${tradeDetails}`
        : "[Trade Vehicle]\nDetails provided but columns unavailable.";

    const jobDataWithTrade: PreparedJobInsert = tradeFieldsPresent
      ? {
          ...jobData,
          trade_year: params.trade_year ?? null,
          trade_make: params.trade_make ?? null,
          trade_model: params.trade_model ?? null,
          trade_vin: params.trade_vin ?? null,
          trade_transmission: params.trade_transmission ?? null,
        }
      : jobData;

    const notifyDrivers = async (jobRecord: CreatedJobRecord) => {
      try {
        await supabase.functions.invoke("notify-drivers-new-job", {
          body: {
            job_id: jobRecord.id,
            type: jobRecord.type,
            year: jobRecord.year,
            make: jobRecord.make,
            model: jobRecord.model,
            pickup_address: jobRecord.pickup_address,
            delivery_address: jobRecord.delivery_address,
            distance_miles: jobRecord.distance_miles ?? 0,
            requires_two: jobRecord.requires_two ?? false,
            customer_name: jobRecord.customer_name ?? null,
          },
        });
      } catch (notificationError) {
        console.error(
          "⚠️ Driver notification dispatch failed:",
          notificationError,
        );
      }
    };

    const insertJob = async (payload: PreparedJobInsert) => {
      // Use the secure dealer_create_job RPC function
      const { data, error } = await supabase.rpc("dealer_create_job", {
        p_type: payload.type,
        p_pickup_address: payload.pickup_address,
        p_delivery_address: payload.delivery_address,
        p_year: payload.year,
        p_make: payload.make,
        p_model: payload.model,
        p_vin: payload.vin,
        p_customer_name: payload.customer_name,
        p_customer_phone: payload.customer_phone,
        p_timeframe: payload.timeframe,
        p_notes: payload.notes,
        p_requires_two: payload.requires_two,
        p_distance_miles: payload.distance_miles,
        p_trade_year: payload.trade_year ?? null,
        p_trade_make: payload.trade_make ?? null,
        p_trade_model: payload.trade_model ?? null,
        p_trade_vin: payload.trade_vin ?? null,
        p_trade_transmission: payload.trade_transmission ?? null,
      });

      if (error) {
        throw error;
      }

      // RPC returns JSON, parse it to object
      return typeof data === 'string' ? JSON.parse(data) : data;
    };

    const extractMessage = (unknownError: unknown) => {
      if (!unknownError) {
        return "Unknown error";
      }

      if (unknownError instanceof Error) {
        return unknownError.message;
      }

      if (typeof unknownError === "object") {
        const err = unknownError as {
          message?: string;
          details?: string;
          hint?: string;
        };
        return err.message || err.details || err.hint || "Database error";
      }

      return String(unknownError);
    };

    const isMissingTradeColumn = (unknownError: unknown) => {
      const message = extractMessage(unknownError).toLowerCase();
      return (
        message.includes("trade_") &&
        message.includes("column") &&
        message.includes("does not exist")
      );
    };

    const appendTradeNote = (baseNotes: string | null) => {
      if (!tradeFieldsPresent) {
        return baseNotes;
      }

      return baseNotes ? `${baseNotes}\n\n${tradeNote}` : tradeNote;
    };

    console.log("📝 Job data prepared (initial attempt):", jobDataWithTrade);

    try {
      const createdJob = await insertJob(jobDataWithTrade);
      console.log("✅ Job created successfully:", createdJob);
      await notifyDrivers(createdJob);
      return createdJob;
    } catch (initialError) {
      if (tradeFieldsPresent && isMissingTradeColumn(initialError)) {
        console.warn(
          "⚠️ Trade columns missing in jobs table, retrying with trade details stored in notes.",
          initialError,
        );

        const fallbackJobData: PreparedJobInsert = {
          ...jobData,
          notes: appendTradeNote(jobData.notes),
        };

        console.log(
          "📝 Job data prepared (fallback attempt):",
          fallbackJobData,
        );

        const createdJob = await insertJob(fallbackJobData);
        console.log("✅ Job created successfully after fallback:", createdJob);
        await notifyDrivers(createdJob);
        return createdJob;
      }

      console.error("❌ Database insertion failed:", initialError);
      throw new Error(`Database error: ${extractMessage(initialError)}`);
    }
  } catch (error) {
    console.error("💥 BULLETPROOF JOB CREATION FAILED:", error);
    throw error;
  }
};
