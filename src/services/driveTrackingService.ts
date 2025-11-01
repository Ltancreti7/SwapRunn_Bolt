import { supabase } from "@/integrations/supabase/client";
import { mobileGeolocationService } from "./mobileGeolocationService";

export interface DriveSession {
  assignmentId: string;
  jobId: string;
  driverId: string;
  startedAt: Date;
  startLocation: { latitude: number; longitude: number };
  currentLocation?: { latitude: number; longitude: number };
  totalDistance: number;
  elapsedSeconds: number;
  isActive: boolean;
}

export interface DriveStats {
  totalDistance: number;
  elapsedTime: string;
  isActive: boolean;
}

class DriveTrackingService {
  private activeDrive: DriveSession | null = null;
  private trackingInterval: NodeJS.Timeout | null = null;
  private locationWatchId: string | null = null;
  private listeners: ((stats: DriveStats) => void)[] = [];

  async startDrive(
    assignmentId: string,
    jobId: string,
    driverId: string,
  ): Promise<void> {
    // Get current location
    const currentLocation = await mobileGeolocationService.getCurrentPosition();
    if (!currentLocation) {
      throw new Error("Unable to get current location. Please enable GPS.");
    }

    // Update assignment started_at
    const { error: assignmentError } = await supabase
      .from("assignments")
      .update({ started_at: new Date().toISOString() })
      .eq("id", assignmentId);

    if (assignmentError) throw assignmentError;

    // Update job status to in_progress
    const { error: jobError } = await supabase
      .from("jobs")
      .update({ status: "in_progress" })
      .eq("id", jobId);

    if (jobError) throw jobError;

    // Create timesheet record
    const { error: timesheetError } = await supabase.from("timesheets").insert({
      assignment_id: assignmentId,
      job_id: jobId,
      driver_id: driverId,
      started_at: new Date().toISOString(),
      pay_rate_cents: 1800,
    });

    if (timesheetError) throw timesheetError;

    // Initialize drive session
    this.activeDrive = {
      assignmentId,
      jobId,
      driverId,
      startedAt: new Date(),
      startLocation: currentLocation,
      currentLocation,
      totalDistance: 0,
      elapsedSeconds: 0,
      isActive: true,
    };

    // Start tracking
    this.startTracking();

    // Save to localStorage for persistence
    localStorage.setItem("activeDrive", JSON.stringify(this.activeDrive));
  }

  async completeDrive(): Promise<void> {
    if (!this.activeDrive) {
      throw new Error("No active drive to complete");
    }

    const endTime = new Date().toISOString();
    const totalSeconds = Math.floor(
      (Date.now() - this.activeDrive.startedAt.getTime()) / 1000,
    );

    // Stop tracking
    this.stopTracking();

    // Update assignment
    const { error: assignmentError } = await supabase
      .from("assignments")
      .update({ ended_at: endTime })
      .eq("id", this.activeDrive.assignmentId);

    if (assignmentError) throw assignmentError;

    // Update job status
    const { error: jobError } = await supabase
      .from("jobs")
      .update({ status: "completed" })
      .eq("id", this.activeDrive.jobId);

    if (jobError) throw jobError;

    // Update timesheet
    const { error: timesheetError } = await supabase
      .from("timesheets")
      .update({
        ended_at: endTime,
        total_seconds: totalSeconds,
      })
      .eq("assignment_id", this.activeDrive.assignmentId);

    if (timesheetError) throw timesheetError;

    // Clear active drive
    this.activeDrive = null;
    localStorage.removeItem("activeDrive");
    this.notifyListeners();
  }

  private startTracking(): void {
    if (!this.activeDrive) return;

    // Start location tracking
    mobileGeolocationService.startWatching((position) => {
      if (this.activeDrive) {
        const previousLocation =
          this.activeDrive.currentLocation || this.activeDrive.startLocation;
        const distance = this.calculateDistance(
          previousLocation.latitude,
          previousLocation.longitude,
          position.latitude,
          position.longitude,
        );

        this.activeDrive.currentLocation = position;
        this.activeDrive.totalDistance += distance;
      }
    });

    // Start timer
    this.trackingInterval = setInterval(() => {
      if (this.activeDrive) {
        this.activeDrive.elapsedSeconds = Math.floor(
          (Date.now() - this.activeDrive.startedAt.getTime()) / 1000,
        );

        // Save updated state
        localStorage.setItem("activeDrive", JSON.stringify(this.activeDrive));
        this.notifyListeners();
      }
    }, 1000);
  }

  private stopTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    mobileGeolocationService.stopWatching();
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private formatElapsedTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  getCurrentDriveStats(): DriveStats | null {
    if (!this.activeDrive) return null;

    return {
      totalDistance: Math.round(this.activeDrive.totalDistance * 100) / 100,
      elapsedTime: this.formatElapsedTime(this.activeDrive.elapsedSeconds),
      isActive: this.activeDrive.isActive,
    };
  }

  getActiveDrive(): DriveSession | null {
    return this.activeDrive;
  }

  isTrackingActive(): boolean {
    return this.activeDrive?.isActive || false;
  }

  // Resume tracking from localStorage on app restart
  resumeTrackingIfNeeded(): void {
    const savedDrive = localStorage.getItem("activeDrive");
    if (savedDrive) {
      try {
        const driveData = JSON.parse(savedDrive);
        this.activeDrive = {
          ...driveData,
          startedAt: new Date(driveData.startedAt),
        };

        if (this.activeDrive.isActive) {
          this.startTracking();
        }
      } catch (error) {
        console.error("Error resuming drive tracking:", error);
        localStorage.removeItem("activeDrive");
      }
    }
  }

  // Subscribe to real-time updates
  subscribe(callback: (stats: DriveStats) => void): void {
    this.listeners.push(callback);
  }

  unsubscribe(callback: (stats: DriveStats) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    const stats = this.getCurrentDriveStats();
    if (stats) {
      this.listeners.forEach((callback) => callback(stats));
    }
  }
}

export const driveTrackingService = new DriveTrackingService();
