import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Check, X, Mail, Phone, Calendar } from "lucide-react";

interface PendingDriver {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  checkr_status: string | null;
}

export const PendingDriverApproval = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDriverId, setProcessingDriverId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (userProfile?.dealer_id) {
      fetchPendingDrivers();
    }
  }, [userProfile?.dealer_id]);

  const fetchPendingDrivers = async () => {
    if (!userProfile?.dealer_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("drivers")
        .select("id, name, email, phone, created_at, checkr_status")
        .eq("dealer_id", userProfile.dealer_id)
        .eq("approval_status", "pending_approval")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingDrivers(data || []);
    } catch (error) {
      console.error("Error fetching pending drivers:", error);
      toast({
        title: "Error",
        description: "Could not load pending driver applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDriver = async (driverId: string) => {
    setProcessingDriverId(driverId);

    try {
      const { error } = await supabase
        .from("drivers")
        .update({
          approval_status: "approved",
          approved_by: userProfile?.user_id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", driverId);

      if (error) throw error;

      toast({
        title: "Driver Approved",
        description: "The driver can now receive job notifications.",
      });

      // Refresh the list
      await fetchPendingDrivers();
    } catch (error) {
      console.error("Error approving driver:", error);
      toast({
        title: "Approval Failed",
        description: "Could not approve driver. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingDriverId(null);
    }
  };

  const handleRejectDriver = async (driverId: string) => {
    setProcessingDriverId(driverId);

    try {
      const { error } = await supabase
        .from("drivers")
        .update({
          approval_status: "rejected",
          approved_by: userProfile?.user_id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq("id", driverId);

      if (error) throw error;

      toast({
        title: "Driver Rejected",
        description: "The application has been rejected.",
      });

      setRejectionReason("");
      await fetchPendingDrivers();
    } catch (error) {
      console.error("Error rejecting driver:", error);
      toast({
        title: "Rejection Failed",
        description: "Could not reject driver. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingDriverId(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Pending Driver Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-white/10 rounded-lg"></div>
            <div className="h-20 bg-white/10 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingDrivers.length === 0) {
    return null; // Don't show the section if there are no pending drivers
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg rounded-xl sm:rounded-2xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="h-5 w-5" />
          Pending Driver Applications ({pendingDrivers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingDrivers.map((driver) => (
          <Card key={driver.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <h4 className="text-lg font-semibold text-white">{driver.name}</h4>
                  <div className="space-y-1 text-sm text-white/70">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{driver.email}</span>
                    </div>
                    {driver.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{driver.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Applied {new Date(driver.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApproveDriver(driver.id)}
                    disabled={processingDriverId === driver.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={processingDriverId === driver.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-neutral-900 border-white/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Reject Driver Application?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/70">
                          This will reject {driver.name}'s application. You can optionally provide a reason.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Textarea
                        placeholder="Reason for rejection (optional)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/10 text-white border-white/20">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRejectDriver(driver.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Reject Application
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
