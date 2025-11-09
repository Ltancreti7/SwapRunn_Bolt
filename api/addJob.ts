import crypto from "node:crypto";
import { getAuthContext } from "./_utils/supabase.js";

type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  on: (event: string, callback: (chunk: any) => void) => void;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

const parseBody = async (req: ApiRequest) => {
  if (req.body) return req.body;

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve());
    req.on("error", (error) => reject(error));
  });

  if (chunks.length === 0) return {};

  const payload = Buffer.concat(chunks).toString("utf-8");
  try {
    return JSON.parse(payload);
  } catch (error) {
    throw new Error("Invalid JSON payload.");
  }
};

const generateTrackingToken = () =>
  crypto.randomBytes(4).toString("hex").toUpperCase();

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = await parseBody(req);

    const authHeader =
      (req.headers["authorization"] as string | undefined) ??
      (req.headers["Authorization"] as string | undefined);

    if (!authHeader) {
      throw new Error("Authorization header is required.");
    }

    const {
      user,
      profile,
      clients: { serviceClient },
    } = await getAuthContext(authHeader);

    if (!profile || !profile.user_type) {
      throw new Error("Profile missing. Login required.");
    }

    if (!["dealer", "staff", "admin"].includes(profile.user_type)) {
      throw new Error("You do not have permission to create jobs.");
    }

    const {
      type,
      pickup_address,
      delivery_address,
      customer_name,
      customer_phone,
      vin,
      year,
      make,
      model,
      notes,
      timeframe,
      requires_two,
      distance_miles,
      trade_year,
      trade_make,
      trade_model,
      trade_vin,
      trade_transmission,
      dealer_id,
    } = body ?? {};

    if (!type) {
      throw new Error("Job type is required.");
    }

    if (!pickup_address || !delivery_address) {
      throw new Error("Pickup and delivery addresses are required.");
    }

    let targetDealerId: string | null = profile.dealer_id;
    if (profile.user_type === "admin") {
      targetDealerId = dealer_id ?? profile.dealer_id ?? null;
    }

    if (!targetDealerId) {
      throw new Error("Dealer association missing. Cannot create job.");
    }

    const trackingToken = generateTrackingToken();

    const insertPayload = {
      dealer_id: targetDealerId,
      created_by: user.id,
      type,
      status: "open",
      pickup_address,
      delivery_address,
      customer_name: customer_name ?? null,
      customer_phone: customer_phone ?? null,
      timeframe: timeframe ?? null,
      notes: notes ?? null,
      vin: vin ?? null,
      year: year ?? null,
      make: make ?? null,
      model: model ?? null,
      requires_two: requires_two ?? false,
      distance_miles: distance_miles ?? 25,
      trade_year: trade_year ?? null,
      trade_make: trade_make ?? null,
      trade_model: trade_model ?? null,
      trade_vin: trade_vin ?? null,
      trade_transmission: trade_transmission ?? null,
      track_token: trackingToken,
    };

    const { data: job, error } = await serviceClient
      .from("jobs")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    try {
      await serviceClient.functions.invoke("notify-drivers-new-job", {
        body: {
          job_id: job.id,
          type: job.type,
          year: job.year,
          make: job.make,
          model: job.model,
          pickup_address: job.pickup_address,
          delivery_address: job.delivery_address,
          distance_miles: job.distance_miles ?? 0,
          requires_two: job.requires_two ?? false,
          customer_name: job.customer_name ?? null,
        },
      });
    } catch (notificationError) {
      console.error(
        "⚠️ Failed to dispatch driver notification:",
        notificationError,
      );
    }

    res.status(200).json({ success: true, job });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create job.";
    res.status(400).json({ error: message });
  }
}
