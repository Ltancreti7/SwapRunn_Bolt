import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  driveTrackingService,
  DriveStats,
} from "@/services/driveTrackingService";
import { ChatButton } from "@/components/chat/ChatButton";
import { MapPin, Clock, Car, Navigation, MessageCircle } from "lucide-react";
import { format } from "date-fns";
interface ActiveAssignment {
  id: string;
  job_id: string;
  driver_id: string;
  accepted_at: string;
  started_at?: string;
  jobs: {
    id: string;
    type: string;
    pickup_address: string;
    delivery_address: string;
    year?: number;
    make?: string;
    model?: string;
    customer_name?: string;
    distance_miles?: number;
    created_at: string;
  };
}
interface PersistentDriveNotificationProps {
  driverId: string;
}
export const PersistentDriveNotification = ({
  driverId,
}: PersistentDriveNotificationProps) => {
  const [activeAssignment, setActiveAssignment] =
    useState<ActiveAssignment | null>(null);
  const [driveStats, setDriveStats] = useState<DriveStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch active assignment
  const fetchActiveAssignment = async () => {
    if (!driverId) return;
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
          id,
          job_id,
          driver_id,
          accepted_at,
          started_at,
          jobs!inner (
            id,
            type,
            pickup_address,
            delivery_address,
            year,
            make,
            model,
            customer_name,
            distance_miles,
            created_at
          )
        `,
        )
        .eq("driver_id", driverId)
        .is("ended_at", null)
        .not("accepted_at", "is", null)
        .single();
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching active assignment:", error);
        return;
      }
      setActiveAssignment(data);
    } catch (error) {
      console.error("Error in fetchActiveAssignment:", error);
    }
  };

  // Subscribe to drive stats updates
  useEffect(() => {
    const handleStatsUpdate = (stats: DriveStats) => {
      setDriveStats(stats);
    };
    driveTrackingService.subscribe(handleStatsUpdate);

    // Get current stats
    const currentStats = driveTrackingService.getCurrentDriveStats();
    if (currentStats) {
      setDriveStats(currentStats);
    }
    return () => {
      driveTrackingService.unsubscribe(handleStatsUpdate);
    };
  }, []);

  // Fetch active assignment on mount and set up real-time subscription
  useEffect(() => {
    fetchActiveAssignment();

    // Subscribe to assignment changes
    const channel = supabase
      .channel(`driver-assignments-${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
          filter: `driver_id=eq.${driverId}`,
        },
        () => {
          fetchActiveAssignment();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);
  const handleStartDrive = async () => {
    if (!activeAssignment) return;
    try {
      setIsLoading(true);
      await driveTrackingService.startDrive(
        activeAssignment.id,
        activeAssignment.job_id,
        driverId,
      );
      toast({
        title: "Drive Started!",
        description: "Location tracking is now active.",
      });
    } catch (error) {
      console.error("Error starting drive:", error);
      toast({
        title: "Error",
        description: "Failed to start drive tracking.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleCompleteDrive = async () => {
    if (!activeAssignment) return;
    try {
      setIsLoading(true);
      await driveTrackingService.completeDrive();
      toast({
        title: "Drive Completed!",
        description: "Great job! The drive has been marked as complete.",
      });

      // Refresh to remove the notification
      setTimeout(() => {
        fetchActiveAssignment();
      }, 1000);
    } catch (error) {
      console.error("Error completing drive:", error);
      toast({
        title: "Error",
        description: "Failed to complete drive.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  if (!activeAssignment) {
    return null;
  }
  const job = activeAssignment.jobs;
  const isTracking = driveStats?.isActive || false;
  const hasStarted = !!activeAssignment.started_at;
  return;
};
