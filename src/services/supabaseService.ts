import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Job {
  id: string;
  type: "delivery" | "swap" | "parts" | "service";
  vin?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  stock_number?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  drivers_needed?: number | null;
  specific_driver_id?: string | null;
  pickup_address?: string | null;
  delivery_address?: string | null;
  distance_miles?: number | null;
  requires_two?: boolean | null;
  status: string;
  track_token: string;
  notes?: string | null;
  payment_method?: string | null;
  amount_to_collect?: string | null;
  paperwork?: string[] | null;
  pre_delivery_checklist?: Record<string, unknown> | null;
  has_trade_in?: boolean | null;
  trade_year?: number | null;
  trade_make?: string | null;
  trade_model?: string | null;
  trade_transmission?: string | null;
  trade_vin?: string | null;
  created_at: string;
  // Assignment data
  driver_id?: string | null;
  driver_name?: string | null;
  accepted_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  assignment_id?: string | null;
  assigned_driver?: string | null;
  // Driver-specific fields
  dealer_name?: string | null;
  dealer_store?: string | null;
  estimated_pay_cents?: number | null;
  salesperson_name?: string | null;
  salesperson_phone?: string | null;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  rating_avg: number;
  rating_count: number;
  city_ok: boolean;
  max_miles: number;
  available: boolean;
}

export interface CreateJobData {
  type: "delivery" | "swap";
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  customer_name: string;
  customer_phone?: string;
  pickup_address: string;
  delivery_address: string;
  notes?: string;
  timeframe?: string;
  transmission?: string;
  specific_time?: string;
  specific_date?: string;
  distance_miles?: number;
  requires_two?: boolean;
  stock_number?: string | null;
  drivers_needed?: number;
  specific_driver_id?: string | null;
  payment_method?: string | null;
  amount_to_collect?: string | null;
  paperwork?: string[] | null;
  pre_delivery_checklist?: Record<string, unknown> | null;
  has_trade_in?: boolean;
  trade_year?: number | null;
  trade_make?: string | null;
  trade_model?: string | null;
  trade_transmission?: string | null;
  dealerId: string;
  createdBy: string;
}

export interface DriverOpenJob {
  id: string;
  type: string | null;
  status: string | null;
  pickup_address: string | null;
  delivery_address: string | null;
  distance_miles: number | null;
  dealer_name: string | null;
  dealer_store: string | null;
  estimated_pay_cents: number | null;
  created_at: string | null;
}

class SupabaseService {
  private async requireSession(): Promise<{
    user: User;
    session: Session;
  }> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error("Session missing. Login required.");
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      throw new Error("Session token missing. Please sign in again.");
    }

    return { user, session };
  }

  // Job Management
  async listJobs(): Promise<Job[]> {
    await this.requireSession();

    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        *,
        assignments (
          id,
          driver_id,
          accepted_at,
          started_at,
          completed_at
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((job) => ({
      ...job,
      assignment_id: job.assignments?.[0]?.id,
      driver_id: job.assignments?.[0]?.driver_id,
      driver_name: null, // Driver name needs to be fetched separately
      accepted_at: job.assignments?.[0]?.accepted_at,
      started_at: job.assignments?.[0]?.started_at,
      ended_at: job.assignments?.[0]?.completed_at, // Use completed_at instead of ended_at
    }));
  }

  async createJob(jobData: CreateJobData): Promise<Job> {
    const {
      session: { access_token: accessToken },
    } = await this.requireSession();

    if (!accessToken) {
      throw new Error("Session token missing. Please sign in again.");
    }

    const response = await fetch("/api/addJob", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        type: jobData.type,
        pickup_address: jobData.pickup_address,
        delivery_address: jobData.delivery_address,
        year: jobData.year,
        make: jobData.make,
        model: jobData.model,
        vin: jobData.vin ?? null,
        customer_name: jobData.customer_name,
        customer_phone: jobData.customer_phone ?? null,
        timeframe: jobData.timeframe ?? null,
        notes: jobData.notes ?? null,
        requires_two: jobData.requires_two ?? false,
        distance_miles: jobData.distance_miles ?? 25,
        trade_year: jobData.trade_year ?? null,
        trade_make: jobData.trade_make ?? null,
        trade_model: jobData.trade_model ?? null,
        trade_vin: jobData.trade_vin ?? null,
        trade_transmission: jobData.trade_transmission ?? null,
        dealer_id: jobData.dealerId,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result?.success) {
      throw new Error(result?.error || "Failed to create job");
    }

    return result.job as Job;
  }

  async getJobById(id: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        *,
        assignments (
          id,
          driver_id,
          accepted_at,
          started_at,
          completed_at
        )
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      assignment_id: data.assignments?.[0]?.id,
      driver_id: data.assignments?.[0]?.driver_id,
      driver_name: null, // Driver name needs to be fetched separately
      accepted_at: data.assignments?.[0]?.accepted_at,
      started_at: data.assignments?.[0]?.started_at,
      ended_at: data.assignments?.[0]?.completed_at, // Use completed_at instead of ended_at
    };
  }

  async getJobByTrackingToken(token: string): Promise<Job | null> {
    // Query job by track_token directly
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        assignments (
          id,
          driver_id,
          accepted_at,
          started_at,
          completed_at
        )
      `)
      .eq("track_token", token)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // For tracking, we only return limited safe information
    // No customer personal information is exposed
    return {
      id: data.id,
      type: data.type,
      status: data.status,
      created_at: data.created_at,
      pickup_address: data.pickup_address,
      delivery_address: data.delivery_address,
      track_token: data.track_token,
      // No customer name, phone, or other sensitive data
      customer_name: null,
      customer_phone: null,
      customer_address: null,
      vin: null,
      year: null,
      make: null,
      model: null,
      distance_miles: null,
      requires_two: null,
      notes: null,
      driver_id: null,
      driver_name: null,
      accepted_at: null,
      started_at: null,
      ended_at: null,
      assignment_id: null,
    };
  }

  async acceptJob(jobId: string, driverId?: string): Promise<Job | null> {
    const { user } = await this.requireSession();
    const activeDriverId = driverId ?? user.id;

    if (!activeDriverId) {
      throw new Error("Unable to determine driver for job acceptance.");
    }

    // Check if job is already assigned
    const { data: existingAssignment } = await supabase
      .from("assignments")
      .select("driver_id")
      .eq("job_id", jobId)
      .maybeSingle();

    // If job is already assigned to a different driver, throw specific error
    if (
      existingAssignment &&
      existingAssignment.driver_id !== activeDriverId
    ) {
      throw new Error("JOB_ALREADY_TAKEN");
    }

    // If job is already assigned to this driver, return the job
    if (
      existingAssignment &&
      existingAssignment.driver_id === activeDriverId
    ) {
      return this.getJobById(jobId);
    }

    // Create assignment for this driver
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .insert({
        job_id: jobId,
        driver_id: activeDriverId,
        accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (assignmentError) {
      // Handle unique constraint violation specifically
      if (assignmentError.code === "23505") {
        throw new Error("JOB_ALREADY_TAKEN");
      }
      throw assignmentError;
    }

    // Update job status
    const { error: jobError } = await supabase
      .from("jobs")
      .update({
        status: "assigned",
        assigned_driver: activeDriverId,
      })
      .eq("id", jobId);

    if (jobError) throw jobError;

    return this.getJobById(jobId);
  }

  async clockIn(jobId: string, assignmentId: string): Promise<Job | null> {
    await this.requireSession();

    // Update assignment start time
    const { error: assignmentError } = await supabase
      .from("assignments")
      .update({ started_at: new Date().toISOString() })
      .eq("id", assignmentId);

    if (assignmentError) throw assignmentError;

    // Update job status
    const { error: jobError } = await supabase
      .from("jobs")
      .update({ status: "in_progress" })
      .eq("id", jobId);

    if (jobError) throw jobError;

    return this.getJobById(jobId);
  }

  async clockOut(jobId: string, assignmentId: string): Promise<Job | null> {
    await this.requireSession();

    // Update assignment end time
    const { error: assignmentError } = await supabase
      .from("assignments")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", assignmentId);

    if (assignmentError) throw assignmentError;

    // Update job status
    const { error: jobError } = await supabase
      .from("jobs")
      .update({ status: "completed" })
      .eq("id", jobId);

    if (jobError) throw jobError;

    return this.getJobById(jobId);
  }

  // Driver Management - fetch driver profiles linked to authenticated dealership
  async getDrivers(): Promise<Driver[]> {
    await this.requireSession();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "driver")
      .order("full_name");

    if (error) throw error;
    // Map profiles to Driver interface
    return (data || []).map(profile => ({
      id: profile.id,
      name: profile.full_name || "Unknown Driver",
      phone: profile.phone || "",
      rating_avg: 5.0, // Default values since not stored
      rating_count: 0,
      city_ok: true,
      max_miles: 50, // Default max miles
      available: true
    }));
  }

  async getDriver(id: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("user_type", "driver")
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    
    // Map profile to Driver interface
    return {
      id: data.id,
      name: data.full_name || "Unknown Driver",
      phone: data.phone || "",
      rating_avg: 5.0, // Default values since not stored
      rating_count: 0,
      city_ok: true,
      max_miles: 50, // Default max miles
      available: true
    };
  }

  // Get open jobs for drivers (secure - no customer personal info)
  async getOpenJobsForDrivers(): Promise<DriverOpenJob[]> {
    const { data, error } = await supabase.rpc("get_open_jobs_for_drivers");

    if (error) throw error;

    return (data ?? []) as DriverOpenJob[];
  }

  // History
  async getCompletedJobs(): Promise<Job[]> {
    const jobs = await this.listJobs();
    return jobs
      .filter((job) => job.status === "completed")
      .sort((a, b) => {
        const aTime = new Date(a.ended_at || a.created_at).getTime();
        const bTime = new Date(b.ended_at || b.created_at).getTime();
        return bTime - aTime;
      });
  }

  // Create test job
  async createTestJob(dealerId: string, createdBy: string): Promise<Job> {
    return this.createJob({
      type: "delivery",
      vin: "TESTVIN123",
      year: 2023,
      make: "Toyota",
      model: "Camry",
      customer_name: "Test Customer",
      customer_phone: "(555) 123-4567",
      pickup_address: "168 Charlestown Rd, Claremont, NH 03743",
      delivery_address: "456 Oak Ave, Cambridge, MA",
      distance_miles: 45,
      timeframe: "asap",
      transmission: "automatic",
      notes: "Test delivery job - please handle with care",
      dealerId,
      createdBy,
    });
  }
}

export const supabaseService = new SupabaseService();
