import { supabase } from "@/integrations/supabase/client";

/**
 * Update the status of a job row in Supabase.
 */
export async function updateJobStatus(jobId, newStatus) {
  if (!jobId) {
    throw new Error("A jobId is required to update a job status.");
  }

  const { data, error } = await supabase
    .from("jobs")
    .update({ status: newStatus })
    .eq("id", jobId)
    .select();

  if (error) {
    console.error("Failed to update job status:", error);
    throw error;
  }

  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
}

export default updateJobStatus;
