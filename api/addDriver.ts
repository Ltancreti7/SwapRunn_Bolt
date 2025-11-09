import { getAuthContext } from "./_utils/supabase.js";

type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  on: (event: string, callback: (chunk: any) => void) => void;
  once: (event: string, callback: () => void) => void;
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

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf-8");
  try {
    return JSON.parse(rawBody);
  } catch (error) {
    throw new Error("Invalid JSON payload.");
  }
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = await parseBody(req);
    const { name, full_name, email, phone, checkr_status, available, dealer_id } =
      body ?? {};

    if (!name && !full_name) {
      throw new Error("Driver name is required.");
    }

    if (!email) {
      throw new Error("Driver email is required.");
    }

    const authHeader =
      (req.headers["authorization"] as string | undefined) ??
      (req.headers["Authorization"] as string | undefined);

    const {
      profile,
      clients: { serviceClient },
    } = await getAuthContext(authHeader);

    if (!profile || !profile.user_type) {
      throw new Error("Profile missing. Login required.");
    }

    if (!["dealer", "staff", "admin"].includes(profile.user_type)) {
      throw new Error("You do not have permission to add drivers.");
    }

    let targetDealerId = profile.dealer_id;
    if (profile.user_type === "admin") {
      targetDealerId = dealer_id ?? profile.dealer_id ?? null;
    }

    if (!targetDealerId) {
      throw new Error("Dealer association missing. Cannot add driver.");
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { data, error } = await serviceClient
      .from("drivers")
      .insert({
        name: name ?? full_name,
        email: normalizedEmail,
        phone: phone ?? null,
        checkr_status: checkr_status ?? "pending",
        available: available ?? true,
        dealer_id: targetDealerId,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true, driver: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add driver.";
    res.status(400).json({ error: message });
  }
}
