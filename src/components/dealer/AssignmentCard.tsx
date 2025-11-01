import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Star,
  Phone,
  MapPin,
  User,
  Car,
  Calendar,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import { ChatButton } from "@/components/chat/ChatButton";
import { format } from "date-fns";
import { VehicleInspectionPhotos } from "./VehicleInspectionPhotos";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface Driver {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rating_avg?: number;
  rating_count?: number;
  profile_photo_url?: string;
  available?: boolean;
  day_off?: string;
  max_miles?: number;
  city_ok?: boolean;
  trust_score?: number;
}

interface Job {
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
  created_by?: string;
  vin?: string;
  specific_date?: string;
  specific_time?: string;
}

interface Assignment {
  id: string;
  job_id: string;
  driver_id: string;
  accepted_at: string;
  started_at?: string;
  ended_at?: string;
  jobs: Job;
  drivers?: Driver;
}

interface AssignmentCardProps {
  assignment: Assignment;
  currentUserId: string;
}

export const AssignmentCard = ({
  assignment,
  currentUserId,
}: AssignmentCardProps) => {
  const { jobs: job, drivers } = assignment;
  const driver = drivers || {
    id: assignment.driver_id,
    name: "Driver",
    email: "",
    phone: "",
    rating_avg: 5.0,
    rating_count: 0,
    profile_photo_url: "",
    available: true,
    city_ok: true,
    trust_score: 100
  };
  const hasStarted = !!assignment.started_at;
  const [salespersonName, setSalespersonName] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchSalesperson = async () => {
      if (job.created_by) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", job.created_by)
          .single();

        if (data) {
          setSalespersonName(data.full_name || "Staff Member");
        }
      }
    };
    fetchSalesperson();
  }, [job.created_by]);

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

                {/* Delivery Date */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  <p className="text-xs text-white/70">
                    {format(
                      new Date(
                        hasStarted
                          ? assignment.started_at!
                          : assignment.accepted_at,
                      ),
                      "MMM d, yyyy • h:mm a",
                    )}
                  </p>
                </div>

                {/* Driver */}
                <div className="flex items-center gap-2">
                  {driver.profile_photo_url ? (
                    <img
                      src={driver.profile_photo_url}
                      alt={driver.name}
                      className="w-6 h-6 rounded-lg object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                      <User className="h-3 w-3 text-white/30" />
                    </div>
                  )}
                  <span className="text-sm text-white/50">Driver: </span>
                  <span className="text-sm text-white/80 font-semibold">
                    {driver.name}
                  </span>
                </div>
              </div>

              {/* Right side: Status & Chevron */}
              <div className="flex flex-col items-end gap-2">
                <Badge
                  className={
                    hasStarted
                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 text-xs rounded-xl"
                      : "bg-green-500/20 text-green-300 border border-green-400/30 px-2 py-0.5 text-xs rounded-xl"
                  }
                >
                  {hasStarted ? "In Progress" : "Accepted"}
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

            {/* Full Driver Information */}
            <div className="pb-3 border-b border-white/10">
              <p className="text-xs text-white/40 mb-2">Driver Details</p>
              <div className="flex items-start gap-3">
                {driver.profile_photo_url ? (
                  <img
                    src={driver.profile_photo_url}
                    alt={driver.name}
                    className="w-10 h-10 rounded-xl object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <User className="h-4 w-4 text-white/30" />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <h5 className="font-bold text-sm text-white">
                      {driver.name}
                    </h5>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs font-medium text-white">
                        {driver.rating_avg?.toFixed(1) || "5.0"}
                      </span>
                    </div>
                  </div>

                  {driver.phone && (
                    <a
                      href={`tel:${driver.phone}`}
                      className="text-xs text-white/50 hover:text-[#E11900] transition-colors"
                    >
                      {driver.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

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

            {/* Actions */}
            <div className="flex items-center gap-3 pb-3">
              <ChatButton
                jobId={job.id}
                assignmentId={assignment.id}
                currentUserType="dealer"
                currentUserId={currentUserId}
                size="sm"
              />
              {driver.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-9"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${driver.phone}`, "_self");
                  }}
                >
                  <Phone className="h-3 w-3 mr-2" />
                  Call
                </Button>
              )}
            </div>

            {/* Vehicle Inspection Photos */}
            {(hasStarted || assignment.ended_at) && (
              <div className="pt-3 border-t border-white/10">
                <VehicleInspectionPhotos assignmentId={assignment.id} />
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
};
