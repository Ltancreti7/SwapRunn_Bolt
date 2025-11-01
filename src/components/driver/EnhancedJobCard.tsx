import { useState } from "react";
import {
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  DollarSign,
  Car,
  User,
  Navigation,
  CheckCircle,
  XCircle,
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
interface JobData {
  id: string;
  type: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  distance_miles: number;
  requires_two: boolean;
  notes?: string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  customer_name?: string;
  customer_phone?: string;
  dealer_name?: string;
  estimated_pay_cents?: number;
  timeframe?: string;
  specific_time?: string;
  salesperson_name?: string;
  salesperson_phone?: string;
}
interface EnhancedJobCardProps {
  job: JobData;
  onAccept?: (jobId: string) => void;
  onDecline?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
  showQuickActions?: boolean;
  isCompact?: boolean;
}
export function EnhancedJobCard({
  job,
  onAccept,
  onDecline,
  onViewDetails,
  showQuickActions = true,
  isCompact = false,
}: EnhancedJobCardProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const jobDate = new Date(dateString);
    const diffMs = now.getTime() - jobDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-600 text-white border-green-500";
      case "assigned":
        return "bg-yellow-600 text-white border-yellow-500";
      case "in_progress":
        return "bg-blue-600 text-white border-blue-500";
      case "completed":
        return "bg-gray-600 text-white border-gray-500";
      default:
        return "bg-gray-600 text-white border-gray-500";
    }
  };
  const getUrgencyColor = () => {
    const hoursOld =
      (new Date().getTime() - new Date(job.created_at).getTime()) /
      (1000 * 60 * 60);
    if (hoursOld > 24) return "text-red-600";
    if (hoursOld > 12) return "text-orange-600";
    return "text-gray-600";
  };
  const handleCall = (
    phoneNumber: string,
    type: "customer" | "salesperson",
  ) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      toast({
        title: "No Phone Number",
        description: `${type === "customer" ? "Customer" : "Salesperson"} phone number not available`,
        variant: "destructive",
      });
    }
  };
  const handleNavigate = () => {
    if (job.pickup_address) {
      // Open in Google Maps
      const address = encodeURIComponent(job.pickup_address);
      window.open(`https://maps.google.com/maps?q=${address}`, "_blank");
    }
  };
  return (
    <Card className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-md border-white/50 shadow-2xl shadow-black/40 ring-1 ring-white/10 hover:shadow-[#E11900]/20 hover:ring-[#E11900]/30 transition-all duration-300 rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {job.customer_name && (
              <p className="text-base text-white flex items-center gap-2 font-semibold mb-1">
                <User className="h-4 w-4" />
                {job.customer_name}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              className={`${getStatusColor(job.status)} text-sm px-4 py-1.5`}
            >
              {job.status.toUpperCase()}
            </Badge>
            <span className="text-sm font-semibold text-white">
              {formatTimeAgo(job.created_at)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Locations */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-800/95 rounded-2xl p-4 border border-gray-700">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-blue-300 mb-1">Pickup</p>
                <p className="text-sm text-white break-words">
                  {job.pickup_address}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/95 rounded-2xl p-4 border border-gray-700">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-300 mb-1">
                  Delivery
                </p>
                <p className="text-sm text-white break-words">
                  {job.delivery_address}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        {job.year && job.make && job.model && (
          <div className="flex items-center gap-3 text-white bg-gray-800/80 p-4 rounded-2xl border border-gray-700">
            <Car className="h-5 w-5" />
            <span className="text-base font-semibold">
              {job.year} {job.make} {job.model}
            </span>
          </div>
        )}

        {/* Earnings */}
        {job.estimated_pay_cents && (
          <div className="bg-gradient-to-r from-[#E11900] to-[#C41500] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-white drop-shadow-lg" />
                <span className="text-base font-semibold text-white drop-shadow-lg">
                  Estimated Pay
                </span>
              </div>
              <span className="text-4xl font-black text-white drop-shadow-lg">
                {formatCurrency(job.estimated_pay_cents)}
              </span>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 gap-5">
          <div className="flex items-center gap-3 text-white bg-gray-800/80 p-4 rounded-2xl border border-gray-700">
            <Navigation className="h-5 w-5" />
            <span className="text-base font-semibold">
              {job.distance_miles} miles
            </span>
          </div>

          {job.timeframe && (
            <div className="flex items-center gap-3 text-white bg-gray-800/80 p-4 rounded-2xl border border-gray-700">
              <Clock className="h-5 w-5" />
              <span className="text-base font-semibold">{job.timeframe}</span>
            </div>
          )}

          {job.requires_two && (
            <div className="flex items-center gap-3 text-white bg-gray-800/80 p-4 rounded-2xl border border-gray-700">
              <User className="h-5 w-5" />
              <span className="text-base font-semibold">2 Drivers</span>
            </div>
          )}

          {job.dealer_name && (
            <div className="flex items-center gap-3 text-white bg-gray-800/80 p-4 rounded-2xl border border-gray-700">
              <Briefcase className="h-5 w-5" />
              <span className="text-base font-semibold">{job.dealer_name}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {job.notes && !isCompact && (
          <div className="bg-gray-800/80 rounded-2xl p-5 border border-gray-700">
            <p className="text-sm font-bold text-white mb-2">Notes</p>
            <p className="text-base text-white">{job.notes}</p>
          </div>
        )}

        {/* Actions */}
        {showQuickActions && job.status === "open" && (
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => onAccept?.(job.id)}
              className="flex-1 bg-[#E11900] hover:bg-[#E11900]/90 text-white h-14 rounded-2xl font-bold text-base shadow-xl shadow-[#E11900]/50"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Accept Job
            </Button>
            {onViewDetails && (
              <Button
                onClick={() => onViewDetails(job.id)}
                variant="outline"
                className="border-white/40 text-white bg-white/10 backdrop-blur hover:bg-white/20 h-14 rounded-2xl font-bold"
              >
                Details
              </Button>
            )}
          </div>
        )}

        {/* Contact Buttons */}
        {!isCompact && (job.customer_phone || job.salesperson_phone) && (
          <div className="flex gap-3">
            {job.customer_phone && (
              <Button
                onClick={() => handleCall(job.customer_phone!, "customer")}
                variant="outline"
                className="flex-1 border-white/40 text-white bg-white/10 hover:bg-white/20 h-12 rounded-2xl font-semibold"
              >
                <Phone className="h-5 w-5 mr-2" />
                Customer
              </Button>
            )}
            {job.salesperson_phone && (
              <Button
                onClick={() =>
                  handleCall(job.salesperson_phone!, "salesperson")
                }
                variant="outline"
                className="flex-1 border-white/40 text-white bg-white/10 hover:bg-white/20 h-12 rounded-2xl font-semibold"
              >
                <Phone className="h-5 w-5 mr-2" />
                Sales
              </Button>
            )}
            <Button
              onClick={handleNavigate}
              variant="outline"
              className="border-white/40 text-white bg-white/10 hover:bg-white/20 h-12 w-12 rounded-2xl p-0"
            >
              <Navigation className="h-5 w-5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
