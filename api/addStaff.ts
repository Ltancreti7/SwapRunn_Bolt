import { createServiceClient, getAuthContext } from "./_utils/supabase";

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

const generatePassword = () => Math.random().toString(36).slice(-12);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = await parseBody(req);
    const {
      firstName,
      lastName,
      name,
      email: rawEmail,
      phone,
      role: requestedRole,
      password,
      dealership_id,
      dealershipId,
    } = body ?? {};

    const email = String(rawEmail ?? "").trim().toLowerCase();
    if (!email) {
      throw new Error("Staff email is required.");
    }

    const fullName = (name ||
      `${firstName ?? ""} ${lastName ?? ""}`.trim()).trim();

    if (!fullName) {
      throw new Error("Staff name is required.");
    }

    const authorizationHeader =
      (req.headers["authorization"] as string | undefined) ??
      (req.headers["Authorization"] as string | undefined);

    const serviceClient = createServiceClient();

    let inviterId: string | null = null;
    let requesterProfileType: string | null = null;
    let targetDealerId: string | null =
      dealership_id ?? dealershipId ?? null;

    if (!targetDealerId) {
      if (!authorizationHeader) {
        throw new Error("Authorization header is required.");
      }

      const { user, profile } = await getAuthContext(authorizationHeader);

      if (!profile || !profile.user_type) {
        throw new Error("Profile missing. Login required.");
      }

      if (!["dealer", "admin"].includes(profile.user_type)) {
        throw new Error("You do not have permission to add staff.");
      }

      inviterId = user.id;
      requesterProfileType = profile.user_type;

      if (profile.user_type === "admin") {
        throw new Error(
          "Admins must specify dealership_id when creating staff accounts.",
        );
      }

      if (!profile.dealer_id) {
        throw new Error("Dealer profile is missing a dealership association.");
      }

      targetDealerId = profile.dealer_id;
    } else if (authorizationHeader) {
      // If dealership_id is provided and requester is authenticated, ensure they have permission
      const { user, profile } = await getAuthContext(authorizationHeader);
      inviterId = user.id;
      requesterProfileType = profile?.user_type ?? null;

      if (
        profile?.user_type &&
        !["dealer", "admin"].includes(profile.user_type)
      ) {
        throw new Error("You do not have permission to add staff.");
      }
    }

    if (!targetDealerId) {
      throw new Error("Dealership ID is required to add staff.");
    }

    const adminApi = serviceClient.auth.admin;
    let authUserId: string;
    let createdUser = false;

    const existing = await adminApi.getUserByEmail(email);
    if (existing.error && existing.error.message !== "User not found") {
      throw existing.error;
    }

    if (existing.data.user) {
      authUserId = existing.data.user.id;
    } else {
      const generatedPassword = password || generatePassword();
      const { data: created, error: createError } = await adminApi.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          name: fullName,
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          phone,
          is_staff_member: "true",
        },
      });

      if (createError || !created?.user) {
        throw createError ??
          new Error("Failed to create staff member authentication record.");
      }

      authUserId = created.user.id;
      createdUser = true;
    }

    const { data: profileRecord, error: profileError } = await serviceClient
      .from("profiles")
      .upsert(
        {
          user_id: authUserId,
          user_type: "staff",
          dealer_id: targetDealerId,
          full_name: fullName,
          first_name: firstName ?? fullName.split(" ")[0] ?? "",
          last_name:
            lastName ?? fullName.split(" ").slice(1).join(" ") ?? "",
          phone: phone ?? null,
        },
        { onConflict: "user_id", ignoreDuplicates: false },
      )
      .select("id, dealer_id, user_type")
      .single();

    if (profileError) {
      throw profileError;
    }

    const role = requestedRole || "staff";

    const { data: staffRecord, error: staffError } = await serviceClient
      .from("staff")
      .upsert(
        {
          user_id: authUserId,
          dealer_id: targetDealerId,
          role,
          invited_by: inviterId,
          joined_at: new Date().toISOString(),
          is_active: true,
        },
        { onConflict: "user_id,dealer_id", ignoreDuplicates: false },
      )
      .select("id, role, dealer_id, is_active")
      .single();

    if (staffError) {
      throw staffError;
    }

    let message = "";
    if (createdUser) {
      message = `Created account and added ${fullName} as a ${role}.`;
    } else {
      message = `Linked existing account and updated ${fullName} as a ${role}.`;
    }

    res.status(200).json({
      success: true,
      message,
      createdUser,
      addedToStaff: Boolean(staffRecord),
      profileId: profileRecord.id,
      requesterType: requesterProfileType,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add staff.";
    res.status(400).json({ error: message });
  }
}
