import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface SupabaseClients {
  serviceClient: SupabaseClient;
  sessionClient?: SupabaseClient;
}

interface AuthContext {
  user: {
    id: string;
    email?: string | null;
  };
  profile: {
    id: string;
    user_type: string | null;
    dealer_id: string | null;
  } | null;
  clients: SupabaseClients;
}

const loadEnv = () => {
  const url =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_PROJECT_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Supabase URL environment variable is not configured.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is missing.");
  }

  return { url, serviceRoleKey, anonKey };
};

export const createServiceClient = (): SupabaseClient => {
  const { url, serviceRoleKey } = loadEnv();
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const createSessionClient = (
  authorizationHeader: string,
): SupabaseClient => {
  const { url, anonKey } = loadEnv();

  if (!anonKey) {
    throw new Error("Supabase anon key is required to validate sessions.");
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: authorizationHeader,
      },
    },
  });
};

export const getAuthContext = async (
  authorizationHeader?: string,
): Promise<AuthContext> => {
  if (!authorizationHeader) {
    throw new Error("Authorization header is required.");
  }

  const sessionClient = createSessionClient(authorizationHeader);
  const serviceClient = createServiceClient();

  const {
    data: { user },
    error: sessionError,
  } = await sessionClient.auth.getUser();

  if (sessionError) {
    throw sessionError;
  }

  if (!user) {
    throw new Error("Session missing. Login required.");
  }

  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("id, user_type, dealer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    clients: { serviceClient, sessionClient },
  };
};
