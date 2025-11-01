import { useState, useEffect } from "react";
import {
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface JobRecord {
  id: string;
  type: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  customer_name: string;
  distance_miles: number;
  estimated_pay_cents: number;
  actual_pay_cents?: number;
  started_at?: string;
  ended_at?: string;
  rating?: number;
}

interface JobHistoryStats {
  totalJobs: number;
  totalEarnings: number;
  totalMiles: number;
  totalHours: number;
  averageRating: number;
  completionRate: number;
  weeklyEarnings: number[];
  jobsByStatus: Record<string, number>;
}

interface JobHistoryDashboardProps {
  driverId: string;
  jobs: JobRecord[];
}

export function JobHistoryDashboard({
  driverId,
  jobs,
}: JobHistoryDashboardProps) {
  const [timeframe, setTimeframe] = useState("this_month");
  const [stats, setStats] = useState<JobHistoryStats | null>(null);
  const [filteredJobs, setFilteredJobs] = useState<JobRecord[]>([]);

  useEffect(() => {
    calculateStats();
  }, [jobs, timeframe]);

  const calculateStats = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case "this_week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case "this_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    const filtered = jobs.filter(
      (job) => new Date(job.created_at) >= startDate,
    );
    setFilteredJobs(filtered);

    const completed = filtered.filter((job) => job.status === "completed");
    const totalEarnings = completed.reduce(
      (sum, job) =>
        sum + (job.actual_pay_cents || job.estimated_pay_cents || 0),
      0,
    );
    const totalMiles = completed.reduce(
      (sum, job) => sum + job.distance_miles,
      0,
    );
    const totalHours = completed.reduce((sum, job) => {
      if (job.started_at && job.ended_at) {
        const hours =
          (new Date(job.ended_at).getTime() -
            new Date(job.started_at).getTime()) /
          (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    const ratedJobs = completed.filter((job) => job.rating);
    const averageRating =
      ratedJobs.length > 0
        ? ratedJobs.reduce((sum, job) => sum + (job.rating || 0), 0) /
          ratedJobs.length
        : 0;

    const completionRate =
      filtered.length > 0 ? (completed.length / filtered.length) * 100 : 0;

    // Weekly earnings for the last 7 weeks
    const weeklyEarnings = Array.from({ length: 7 }, (_, i) => {
      const weekStart = new Date(
        now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000,
      );
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const weekJobs = jobs.filter((job) => {
        const jobDate = new Date(job.created_at);
        return (
          jobDate >= weekStart &&
          jobDate < weekEnd &&
          job.status === "completed"
        );
      });

      return (
        weekJobs.reduce(
          (sum, job) =>
            sum + (job.actual_pay_cents || job.estimated_pay_cents || 0),
          0,
        ) / 100
      );
    }).reverse();

    const jobsByStatus = filtered.reduce(
      (acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    setStats({
      totalJobs: filtered.length,
      totalEarnings: totalEarnings / 100,
      totalMiles,
      totalHours,
      averageRating,
      completionRate,
      weeklyEarnings,
      jobsByStatus,
    });
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatHours = (hours: number) => `${hours.toFixed(1)}h`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!stats) {
    return <div>Loading job history...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Time Frame Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Job History & Analytics</h2>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
            <SelectItem value="all_time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{stats.totalJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalEarnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Miles</p>
                <p className="text-2xl font-bold">
                  {stats.totalMiles.toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">
                  {formatHours(stats.totalHours)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Completion Rate</span>
                <span>{stats.completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-2" />
            </div>

            {stats.averageRating > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Average Rating</span>
                  <span>⭐ {stats.averageRating.toFixed(1)}</span>
                </div>
                <Progress
                  value={(stats.averageRating / 5) * 100}
                  className="h-2"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Avg. Hourly Rate</span>
                <span>
                  {stats.totalHours > 0
                    ? formatCurrency(stats.totalEarnings / stats.totalHours)
                    : "$0"}
                  /hr
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.jobsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={getStatusColor(status)}>
                    {status.replace("_", " ").toUpperCase()}
                  </Badge>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredJobs.slice(0, 10).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{job.customer_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {job.pickup_address} → {job.delivery_address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    {formatCurrency(
                      (job.actual_pay_cents || job.estimated_pay_cents || 0) /
                        100,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {job.distance_miles} mi
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
