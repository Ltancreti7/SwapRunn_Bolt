import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  MapPin,
  Car,
  Calendar,
  UserCircle,
  ChevronDown,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  year?: number;
  make?: string;
  model?: string;
  customer_name?: string;
  distance_miles?: number;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  status: string;
  vin?: string;
  specific_date?: string;
  specific_time?: string;
  created_by?: string;
}

interface JobCardProps {
  job: Job;
  onCancel?: () => void;
}

export const JobCard = ({ job, onCancel }: JobCardProps) => {
  const [salespersonName, setSalespersonName] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  const handleCancelRequest = async () => {
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "cancelled" })
        .eq("id", job.id);

      if (error) throw error;

      toast({
        title: "Request Cancelled",
        description: "The delivery request has been cancelled.",
      });

      onCancel?.();
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Error",
        description: "Failed to cancel the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    const fetchSalesperson = async () => {
      if (job.created_by) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, first_name, last_name")
          .eq("user_id", job.created_by)
          .single();

        if (data) {
          setSalespersonName(
            data.full_name ||
              `${data.first_name || ""} ${data.last_name || ""}`.trim() ||
              "Staff Member",
          );
        }
      }
    };
    fetchSalesperson();
  }, [job.created_by]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-300 border border-green-400/30 px-2 py-0.5 text-xs rounded-xl";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 text-xs rounded-xl";
      default:
        return "bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 text-xs rounded-xl";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      default:
        return "Open";
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl hover:shadow-[0_0_30px_rgba(225,25,0,0.1)] transition-all duration-300 rounded-2xl">
        <CardContent className="p-4">
          <CollapsibleTrigger className="w-full text-left cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              {/* Left side: Main info */}
              <div className="flex-1 space-y-2">
                {/* Customer Name & Vehicle */}
                <div>
                  {job.customer_name && (
                    <h3 className="font-bold text-base text-white mb-1">
                      <span className="text-white/50 font-normal">
                        Customer:{" "}
                      </span>
                      {job.customer_name}
                    </h3>
                  )}
                  <div className="flex items-center gap-2">
                    <Car className="h-3.5 w-3.5 text-[#E11900]" />
                    <h4 className="font-semibold text-sm text-white/90">
                      {job.year} {job.make} {job.model}
                    </h4>
                  </div>
                </div>

                {/* Created Date */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  <p className="text-xs text-white/70">
                    {format(new Date(job.created_at), "MMM d, yyyy • h:mm a")}
                  </p>
                </div>
              </div>

              {/* Right side: Status & Chevron */}
              <div className="flex flex-col items-end gap-2">
                <Badge className={getStatusColor(job.status)}>
                  {getStatusText(job.status)}
                </Badge>
                <ChevronDown
                  className={`h-5 w-5 text-white/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 pt-4 border-t border-white/10 space-y-3">
            {/* VIN */}
            {job.vin && (
              <div className="pb-3 border-b border-white/10">
                <p className="text-xs text-white/40 mb-0.5">VIN</p>
                <p className="text-sm text-white/70 font-mono">{job.vin}</p>
              </div>
            )}

            {/* Requested Delivery Date/Time */}
            {job.specific_date && (
              <div className="pb-3 border-b border-white/10">
                <p className="text-xs text-white/40 mb-0.5">
                  Requested Delivery
                </p>
                <p className="text-sm text-white/70">
                  {job.specific_date}{" "}
                  {job.specific_time && `at ${job.specific_time}`}
                </p>
              </div>
            )}

            {/* Route/Locations */}
            <div className="pb-3 border-b border-white/10">
              <p className="text-xs text-white/40 mb-2">Route</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <MapPin className="h-3 w-3 text-blue-400" />
                    <span className="text-xs font-medium text-white/60">
                      Pickup
                    </span>
                  </div>
                  <p className="text-xs text-white/80 line-clamp-2">
                    {job.pickup_address}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <MapPin className="h-3 w-3 text-[#E11900]" />
                    <span className="text-xs font-medium text-white/60">
                      Delivery
                    </span>
                  </div>
                  <p className="text-xs text-white/80 line-clamp-2">
                    {job.delivery_address}
                  </p>
                </div>
              </div>
              {job.distance_miles && (
                <p className="text-xs text-white/40 mt-1">
                  {job.distance_miles} miles
                </p>
              )}
            </div>

            {/* Salesperson */}
            {salespersonName && (
              <div className="pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-xs text-white/40">Requested by</span>
                  <span className="text-sm text-white/80 font-medium">
                    {salespersonName}
                  </span>
                </div>
              </div>
            )}

            {/* Cancel Button - Only show for open/pending jobs */}
            {job.status === "open" && (
              <div className="pt-2">
                <Button
                  onClick={handleCancelRequest}
                  disabled={isCancelling}
                  variant="destructive"
                  size="sm"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  {isCancelling ? "Cancelling..." : "Cancel Request"}
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
};
