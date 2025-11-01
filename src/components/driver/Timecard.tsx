import { useState } from "react";
import { Clock, Play, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { TimecardData } from "@/services/driver-data";
import { clockInOut } from "@/services/driver-data";

interface TimecardProps {
  driverId: string | null;
  timecard: TimecardData | null;
  isLoading: boolean;
  onUpdate: (timecard: TimecardData) => void;
}

export function Timecard({
  driverId,
  timecard,
  isLoading,
  onUpdate,
}: TimecardProps) {
  const [isClocking, setIsClocking] = useState(false);
  const { toast } = useToast();

  const handleClockInOut = async () => {
    if (!driverId || !timecard) return;

    setIsClocking(true);
    try {
      const newClockState = !timecard.clockedIn;
      const success = await clockInOut(driverId, newClockState);

      if (success) {
        const updatedTimecard: TimecardData = {
          ...timecard,
          clockedIn: newClockState,
          lastClockInAt: newClockState
            ? new Date().toISOString()
            : timecard.lastClockInAt,
        };
        onUpdate(updatedTimecard);

        toast({
          title: newClockState ? "Clocked In" : "Clocked Out",
          description: newClockState ? "Timer started" : "Timer stopped",
        });
      } else {
        throw new Error("Clock operation failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update clock status",
        variant: "destructive",
      });
    } finally {
      setIsClocking(false);
    }
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatLastClockIn = (timestamp?: string) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status & Timecard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timecard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status & Timecard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-text-secondary">
            No timecard data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status & Timecard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Clock In/Out Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleClockInOut}
            disabled={isClocking}
            size="lg"
            className={`px-8 py-4 text-lg font-semibold ${
              timecard.clockedIn
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isClocking ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
            ) : timecard.clockedIn ? (
              <Square className="h-5 w-5 mr-2" />
            ) : (
              <Play className="h-5 w-5 mr-2" />
            )}
            {isClocking
              ? "Updating..."
              : timecard.clockedIn
                ? "Clock Out"
                : "Clock In"}
          </Button>
        </div>

        {/* Time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-surface-secondary rounded-lg text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {formatTime(timecard.todayHours)}
            </div>
            <div className="text-sm text-text-secondary">Today</div>
          </div>

          <div className="p-4 bg-surface-secondary rounded-lg text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {formatTime(timecard.weekHours)}
            </div>
            <div className="text-sm text-text-secondary">This Week</div>
          </div>

          <div className="p-4 bg-surface-secondary rounded-lg text-center">
            <div className="text-sm font-semibold text-text-primary mb-1">
              Last Clock-in
            </div>
            <div className="text-sm text-text-secondary">
              {formatLastClockIn(timecard.lastClockInAt)}
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="text-center">
          <div
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              timecard.clockedIn
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                timecard.clockedIn ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            {timecard.clockedIn
              ? "Currently Clocked In"
              : "Currently Clocked Out"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
