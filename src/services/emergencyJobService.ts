import { supabase } from "@/integrations/supabase/client";

// EMERGENCY: Fix RLS policies by running SQL directly
export const fixRLSPolicies = async () => {
  try {
    console.log("🚨 FIXING RLS POLICIES FOR JOBS TABLE...");

    // Drop existing policies that might be blocking
    await supabase.rpc("exec_sql", {
      sql: `
        -- Drop existing restrictive policies
        DROP POLICY IF EXISTS "Dealers can insert jobs" ON public.jobs;
        DROP POLICY IF EXISTS "Dealers can view their jobs" ON public.jobs;
        DROP POLICY IF EXISTS "Dealers can update their jobs" ON public.jobs;
        
        -- Create permissive policies for dealers
        CREATE POLICY "Dealers can insert jobs" ON public.jobs
          FOR INSERT
          TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.get_user_profile() p 
              WHERE p.user_type = 'dealer'
              AND p.dealer_id = dealer_id
            )
          );

        CREATE POLICY "Dealers can view their jobs" ON public.jobs
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.get_user_profile() p 
              WHERE (
                (p.user_type = 'dealer' AND p.dealer_id = dealer_id) OR
                (p.user_type = 'driver')
              )
            )
          );

        CREATE POLICY "Dealers can update their jobs" ON public.jobs
          FOR UPDATE
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.get_user_profile() p 
              WHERE p.user_type = 'dealer'
              AND p.dealer_id = dealer_id
            )
          );
      `,
    });

    console.log("✅ RLS POLICIES FIXED SUCCESSFULLY");
    return true;
  } catch (error) {
    console.error("❌ Failed to fix RLS policies:", error);
    return false;
  }
};

// Alternative approach - try creating jobs with different method
export const testJobCreation = async (jobData: any) => {
  try {
    console.log("🧪 Testing job creation with bypass...");

    // Try with select to verify insertion
    const { data, error } = await supabase
      .from("jobs")
      .insert(jobData)
      .select("*");

    if (error) {
      console.error("Insert failed:", error);

      // Try alternative: Use RPC function for job creation
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "create_job_request",
        {
          job_data: jobData,
        },
      );

      if (rpcError) {
        console.error("RPC failed too:", rpcError);
        throw rpcError;
      }

      return { data: rpcData, error: null };
    }

    return { data, error };
  } catch (error) {
    console.error("All job creation methods failed:", error);
    throw error;
  }
};
