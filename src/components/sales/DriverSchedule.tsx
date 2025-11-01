import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWithinInterval,
  parseISO,
  isSameDay,
  addWeeks,
  isValid,
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type DriverScheduleEntry = {
  job_id: string;
  assignment_id: string | null;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  pickup_address: string | null;
  delivery_address: string | null;
  specific_date: string | null;
  specific_time: string | null;
  job_status: string | null;
  created_at: string;
};

const statusVariantMap: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  completed: "secondary",
  cancelled: "destructive",
  archived: "destructive",
};

const allowedStatus: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  archived: "Archived",
};

function resolveStatusVariant(status?: string | null) {
  if (!status) return "default" as const;
  return statusVariantMap[status] ?? "default";
}

function resolveStatusLabel(status?: string | null) {
  if (!status) return "Pending";
  return allowedStatus[status] ?? status.replace(/_/g, " ");
}

function parseEntryDate(entry: DriverScheduleEntry) {
  if (entry.specific_date) {
    const parsed = parseISO(entry.specific_date);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  const fallback = new Date(entry.created_at);
  return isValid(fallback) ? fallback : new Date();
}

function getDisplayTime(timeValue: string | null) {
  if (!timeValue) return "TBD";
  try {
    const normalized = normalizeTimeString(timeValue);
    const parsed = parseISO(`1970-01-01T${normalized}`);
    if (isValid(parsed)) {
      return format(parsed, "p");
    }
  } catch (error) {
    // ignore parsing errors and fall back to raw value
  }
  return timeValue;
}

function normalizeTimeString(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return `${value}:00`;
  }
  return value;
}

function getTimeSortValue(timeValue: string | null) {
  if (!timeValue) return Number.MAX_SAFE_INTEGER;
  try {
    const normalized = normalizeTimeString(timeValue);
    const parsed = parseISO(`1970-01-01T${normalized}`);
    if (isValid(parsed)) {
      return parsed.getTime();
    }
  } catch (error) {
    // swallow errors and fall through
  }
  return Number.MAX_SAFE_INTEGER;
}

export function DriverSchedule() {
  const { user, userProfile } = useAuth();

  const { data, isLoading, error, refetch, isFetching } = useQuery<
    DriverScheduleEntry[],
    Error
  >({
    queryKey: ["driver-schedule", user?.id],
    enabled: Boolean(user?.id && userProfile?.dealer_id),
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      const { data: schedule, error: scheduleError } = await supabase.rpc(
        "get_driver_schedule",
        {
          _user_id: user.id,
        },
      );
      if (scheduleError) {
        throw scheduleError;
      }
      return (schedule as DriverScheduleEntry[]) ?? [];
    },
    staleTime: 60 * 1000,
  });

  const scheduleByDay = useMemo(() => {
    const entries = data ?? [];

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const nextWeekStart = addWeeks(weekStart, 1);
    const nextWeekEnd = addWeeks(weekEnd, 1);

    const currentWeekEntries = entries.filter((entry) => {
      const entryDate = parseEntryDate(entry);
      return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
    });

    const nextWeekEntries = entries.filter((entry) => {
      const entryDate = parseEntryDate(entry);
      return isWithinInterval(entryDate, {
        start: nextWeekStart,
        end: nextWeekEnd,
      });
    });

    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const grouped = daysInWeek.map((day) => {
      const itemsForDay = currentWeekEntries
        .filter((entry) => isSameDay(parseEntryDate(entry), day))
        .sort(
          (a, b) =>
            getTimeSortValue(a.specific_time) -
            getTimeSortValue(b.specific_time),
        );

      return {
        day,
        items: itemsForDay,
      };
    });

    const sortedNextWeek = nextWeekEntries.sort((a, b) => {
      const dateDiff =
        parseEntryDate(a).getTime() - parseEntryDate(b).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return (
        getTimeSortValue(a.specific_time) - getTimeSortValue(b.specific_time)
      );
    });

    return {
      currentWeek: grouped,
      nextWeek: sortedNextWeek,
    };
  }, [data]);

  if (!userProfile?.dealer_id) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Dealer context missing</AlertTitle>
        <AlertDescription>
          You are not linked to an active dealership. Please contact your
          administrator for access.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Driver Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load schedule</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Current Week</CardTitle>
              <p className="text-sm text-muted-foreground">
                Jobs grouped by day for the current week.
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="text-sm font-medium text-primary hover:underline"
              disabled={isFetching}
            >
              {isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {scheduleByDay.currentWeek.map(({ day, items }) => (
            <div key={format(day, "yyyy-MM-dd")} className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold">
                  {format(day, "EEEE, MMM d")}
                </h3>
                <Badge variant={items.length ? "secondary" : "outline"}>
                  {items.length === 1 ? "1 job" : `${items.length} jobs`}
                </Badge>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No jobs scheduled.
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={`${item.job_id}-${item.assignment_id ?? "unassigned"}`}
                      className="rounded-lg border border-border bg-background p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {item.driver_name ?? "Unassigned"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.driver_phone || "No phone on file"}
                          </p>
                        </div>
                        <Badge variant={resolveStatusVariant(item.job_status)}>
                          {resolveStatusLabel(item.job_status)}
                        </Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Pickup
                          </p>
                          <p className="font-medium">
                            {item.pickup_address || "TBD"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Drop-off
                          </p>
                          <p className="font-medium">
                            {item.delivery_address || "TBD"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Time:
                        </span>{" "}
                        {getDisplayTime(item.specific_time)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scheduleByDay.nextWeek.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No jobs scheduled for next week yet.
            </p>
          ) : (
            <div className="space-y-3">
              {scheduleByDay.nextWeek.map((item) => (
                <div
                  key={`${item.job_id}-${item.assignment_id ?? "unassigned"}`}
                  className="rounded-lg border border-border bg-background p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {item.driver_name ?? "Unassigned"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.driver_phone || "No phone on file"}
                      </p>
                    </div>
                    <Badge variant={resolveStatusVariant(item.job_status)}>
                      {resolveStatusLabel(item.job_status)}
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="font-medium">
                        {item.pickup_address || "TBD"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Drop-off</p>
                      <p className="font-medium">
                        {item.delivery_address || "TBD"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Scheduled:
                    </span>{" "}
                    {item.specific_date
                      ? format(parseEntryDate(item), "EEEE, MMM d")
                      : "TBD"}{" "}
                    · {getDisplayTime(item.specific_time)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
