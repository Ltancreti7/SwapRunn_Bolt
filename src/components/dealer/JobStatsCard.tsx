import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, User, Clock, CheckCircle } from "lucide-react";
interface JobStatsCardProps {
  openJobs: number;
  assignedJobs: number;
  completedJobs: number;
  totalUnread: number;
}
export const JobStatsCard = ({
  openJobs,
  assignedJobs,
  completedJobs,
  totalUnread,
}: JobStatsCardProps) => {
  const stats = [
    {
      icon: Truck,
      label: "Open Jobs",
      value: openJobs,
      color: "text-blue-600 bg-blue-50",
    },
    {
      icon: User,
      label: "Assigned",
      value: assignedJobs,
      color: "text-green-600 bg-green-50",
      badge: totalUnread > 0 ? totalUnread : undefined,
    },
    {
      icon: CheckCircle,
      label: "Completed",
      value: completedJobs,
      color: "text-gray-600 bg-gray-50",
    },
  ];
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/60 font-medium">
                    {stat.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-white">
                      {stat.value}
                    </p>
                    {stat.badge && (
                      <span className="bg-[#E11900] text-white text-xs px-2 py-1 rounded-full font-semibold">
                        {stat.badge} new
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
