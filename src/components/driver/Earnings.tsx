import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { EarningsData } from "@/services/driver-data";

interface EarningsProps {
  earnings: EarningsData | null;
  isLoading: boolean;
}

export function Earnings({ earnings, isLoading }: EarningsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Earnings Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!earnings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Earnings Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-text-secondary">
            <p className="text-lg font-medium mb-2">
              Earnings Integration Coming Soon
            </p>
            <p className="text-sm">
              Real-time earnings tracking will be available when payroll system
              is implemented.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Earnings Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-surface-secondary rounded-lg text-center">
            <div className="text-2xl font-bold text-text-secondary mb-1">
              {earnings.today > 0 ? formatCurrency(earnings.today) : "—"}
            </div>
            <div className="text-sm text-text-secondary">Today</div>
          </div>

          <div className="p-4 bg-surface-secondary rounded-lg text-center">
            <div className="text-2xl font-bold text-text-secondary mb-1">
              {earnings.week > 0 ? formatCurrency(earnings.week) : "—"}
            </div>
            <div className="text-sm text-text-secondary">This Week</div>
          </div>

          <div className="p-4 bg-surface-secondary rounded-lg text-center">
            <div className="text-2xl font-bold text-text-secondary mb-1">
              {earnings.month > 0 ? formatCurrency(earnings.month) : "—"}
            </div>
            <div className="text-sm text-text-secondary">This Month</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
