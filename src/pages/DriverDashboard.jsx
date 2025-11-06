import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { updateJobStatus } from "@/utils/jobs";
import { useJobNotifications } from "@/hooks/useJobNotifications";
import { useAuth } from "@/hooks/useAuth";

const STATUS_ACTIONS = {
  accept: "accepted",
  complete: "completed",
};

const DriverDashboard = () => {
  let supabaseSession = null;

  try {
    supabaseSession = useSession();
  } catch (error) {
    console.warn("useSession is not available. Falling back to useAuth.", error);
  }

  const { user, userProfile } = useAuth();
  // Try profile.driver_id if the RPC populates it in your project; otherwise
  // fall back to auth user id for environments where RLS expects auth.uid().
  const driverId = userProfile?.driver_id || supabaseSession?.user?.id || user?.id || null;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingJobId, setUpdatingJobId] = useState(null);

  const lastEvent = useJobNotifications(null, driverId);

  const canManageJobs = useMemo(() => Boolean(driverId), [driverId]);

  const fetchJobs = useCallback(async () => {
    if (!driverId) {
      setJobs([]);
      return;
    }

    setError(null);

    const { data, error: fetchError } = await supabase
      .from("jobs")
      .select("id, customer_name, status, dealer_id, driver_id, created_at")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Failed to fetch driver jobs:", fetchError);
      setError(fetchError.message);
      return;
    }

    setJobs(data ?? []);
  }, [driverId]);

  useEffect(() => {
    let isMounted = true;

    if (!driverId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    fetchJobs()
      .catch((fetchErr) => {
        console.error("Error loading jobs:", fetchErr);
        if (isMounted) {
          setError(fetchErr.message ?? "Unable to load jobs.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [driverId, fetchJobs]);

  useEffect(() => {
    if (!lastEvent?.job) {
      return;
    }

    setJobs((previous) => {
      if (!Array.isArray(previous)) {
        return previous;
      }

      const { job, type } = lastEvent;

      if (type === "DELETE") {
        return previous.filter((existingJob) => existingJob.id !== job.id);
      }

      const existingIndex = previous.findIndex(
        (existingJob) => existingJob.id === job.id,
      );

      if (existingIndex === -1) {
        return [job, ...previous];
      }

      const updated = [...previous];
      updated[existingIndex] = { ...updated[existingIndex], ...job };
      return updated;
    });
  }, [lastEvent]);

  const handleUpdateJobStatus = useCallback(
    async (jobId, statusKey) => {
      const nextStatus = STATUS_ACTIONS[statusKey];

      if (!nextStatus) {
        console.warn("Unknown status key provided:", statusKey);
        return;
      }

      setUpdatingJobId(jobId);
      setError(null);

      try {
        const updatedJob = await updateJobStatus(jobId, nextStatus);

        if (updatedJob) {
          setJobs((previous) =>
            (previous ?? []).map((job) =>
              job.id === updatedJob.id ? { ...job, ...updatedJob } : job,
            ),
          );
        }
      } catch (updateError) {
        console.error("Unable to update job status:", updateError);
        setError(updateError.message ?? "Failed to update job status.");
      } finally {
        setUpdatingJobId(null);
      }
    },
    [],
  );

  if (!canManageJobs) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h1 className="text-3xl font-semibold">Driver Dashboard</h1>
          <p className="mt-6 text-neutral-400">
            You need to be signed in as a driver to view and manage your job
            queue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Driver Dashboard</h1>
          <p className="mt-2 text-neutral-400">
            Review deliveries assigned to you and update each job&apos;s status as
            you work through your list.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-10 text-center text-neutral-300">
            Loading your jobs…
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-10 text-center text-neutral-400">
            You do not have any assigned jobs yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="rounded-lg border border-neutral-800 bg-neutral-900 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-medium">
                      {job.customer_name ?? "Unnamed customer"}
                    </p>
                    <p className="mt-1 text-sm text-neutral-400">
                      Status:{" "}
                      <span className="capitalize text-neutral-200">
                        {job.status ?? "pending"}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdateJobStatus(job.id, "accept")}
                      disabled={
                        updatingJobId === job.id ||
                        job.status?.toLowerCase() === STATUS_ACTIONS.accept
                      }
                      className="rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-800/60 disabled:text-neutral-500"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleUpdateJobStatus(job.id, "complete")}
                      disabled={
                        updatingJobId === job.id ||
                        job.status?.toLowerCase() === STATUS_ACTIONS.complete
                      }
                      className="rounded-md bg-[#E11900] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#B51400] disabled:cursor-not-allowed disabled:bg-[#E11900]/40 disabled:text-neutral-200"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
