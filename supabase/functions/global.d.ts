declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: { port?: number; signal?: AbortSignal },
  ): Promise<void>;
}

declare module "https://esm.sh/@supabase/supabase-js@2.57.4" {
  export * from "@supabase/supabase-js";
}

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};
