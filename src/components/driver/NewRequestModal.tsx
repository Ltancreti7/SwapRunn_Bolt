import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Car, MapPin, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NewRequestModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  job: {
    id: string;
    year?: number;
    make?: string;
    model?: string;
    distance_miles?: number;
    estimated_pay_cents?: number;
    pickup_address?: string;
    delivery_address?: string;
  } | null;
}

export function NewRequestModal({
  isOpen,
  onDismiss,
  job,
}: NewRequestModalProps) {
  const navigate = useNavigate();

  if (!job) return null;

  const handleViewNow = () => {
    onDismiss();
    // Navigate to the new requests tab
    navigate("/driver/dashboard#new-requests");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onDismiss}>
      <DialogContent className="bg-gradient-to-br from-black via-neutral-950 to-black border-2 border-[#E11900]/30 shadow-[0_0_50px_rgba(225,25,0,0.3)] max-w-md rounded-3xl">
        <DialogHeader className="space-y-4 pb-2">
          <div className="mx-auto p-4 bg-[#E11900]/10 rounded-full border-2 border-[#E11900]">
            <Car className="h-12 w-12 text-[#E11900]" />
          </div>
          <DialogTitle className="text-3xl font-bold text-white text-center">
            New Delivery Request Received
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Vehicle Info */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <Car className="h-6 w-6 text-[#E11900]" />
              <h3 className="text-xl font-bold text-white">Vehicle</h3>
            </div>
            <p className="text-white/90 text-lg">
              {job.year} {job.make} {job.model}
            </p>
          </div>

          {/* Distance & Pay */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-blue-400" />
                <p className="text-white/60 text-sm font-medium">Distance</p>
              </div>
              <p className="text-white text-xl font-bold">
                {job.distance_miles || 0} mi
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <p className="text-white/60 text-sm font-medium">Est. Pay</p>
              </div>
              <p className="text-white text-xl font-bold">
                ${((job.estimated_pay_cents || 0) / 100).toFixed(0)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleViewNow}
              className="w-full h-14 bg-[#E11900] hover:bg-[#E11900]/90 text-white font-bold text-lg rounded-2xl shadow-[0_4px_20px_rgba(225,25,0,0.4)] transition-all hover:scale-[1.02]"
            >
              View Now
            </Button>
            <Button
              onClick={onDismiss}
              variant="outline"
              className="w-full h-14 border-2 border-white/30 bg-white/5 hover:bg-white/10 text-white font-semibold text-lg rounded-2xl transition-all"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
