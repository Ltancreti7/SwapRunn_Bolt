import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DriverSchedule } from "@/components/sales/DriverSchedule";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";

interface StaffRecord {
  role: string | null;
  is_active: boolean | null;
}

const ALLOWED_ROLES = new Set([
  "owner",
  "manager",
  "sales",
  "salesperson",
  "sales_manager",
]);

export default function SalesDashboard() {
  const { user, userProfile } = useAuth();
  const missingDealer = !userProfile?.dealer_id;

  const {
    data: staffRecord,
    isLoading: roleLoading,
    error: roleError,
  } = useQuery<StaffRecord | null, Error>({
    queryKey: ["sales-dashboard-role", user?.id, userProfile?.dealer_id],
    enabled: Boolean(user?.id && userProfile?.dealer_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealership_staff")
        .select("role, is_active")
        .eq("user_id", user?.id as string)
        .eq("dealer_id", userProfile?.dealer_id as string)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const allowed = useMemo(() => {
    if (!staffRecord?.role) return false;
    if (!staffRecord.is_active) return false;
    return ALLOWED_ROLES.has(staffRecord.role);
  }, [staffRecord]);

  const heading = staffRecord?.role
    ? staffRecord.role.replace(/_/g, " ")
    : "Sales";
  const headingTitle = heading.replace(/\b\w/g, (char) => char.toUpperCase());

  if (missingDealer) {
    return (
      <PageContainer>
        <title>Sales Dashboard | SwapRunn</title>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTitle>Dealer profile incomplete</AlertTitle>
            <AlertDescription>
              Your account is not linked to an active dealership. Please
              complete dealer onboarding or contact support.
            </AlertDescription>
          </Alert>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <title>Sales Dashboard | SwapRunn</title>
      <meta
        name="description"
        content="Stay on top of current and upcoming driver assignments."
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
          <p className="text-muted-foreground">
            Track driver assignments and upcoming deliveries for your
            dealership.
          </p>
        </div>

        {roleLoading && (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-background p-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading your staff permissions…
            </span>
          </div>
        )}

        {roleError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Unable to confirm access</AlertTitle>
            <AlertDescription>{roleError.message}</AlertDescription>
          </Alert>
        )}

        {!roleLoading && !roleError && !allowed && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Restricted access</AlertTitle>
            <AlertDescription>
              You need an active sales role to view this dashboard. Please
              contact your dealership manager if you believe this is a mistake.
            </AlertDescription>
          </Alert>
        )}

        {allowed && (
          <>
            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-5 sm:flex sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">
                  Need a driver right now?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Submit a delivery request and SwapRunn alerts available
                  drivers instantly.
                </p>
              </div>
              <Link to="/dealer/create-job" className="mt-4 inline-flex sm:mt-0">
                <Button>New Driver Request</Button>
              </Link>
            </div>

            <Tabs defaultValue="driver-schedule" className="space-y-6">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="driver-schedule">
                  Driver Schedule
                </TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="driver-schedule" className="space-y-6">
                <DriverSchedule />
              </TabsContent>

              <TabsContent value="notes">
                <Card>
                  <CardHeader>
                    <CardTitle>{headingTitle} Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Additional sales tools will appear here. For now, focus on
                      the Driver Schedule tab to coordinate your team.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </PageContainer>
  );
}
