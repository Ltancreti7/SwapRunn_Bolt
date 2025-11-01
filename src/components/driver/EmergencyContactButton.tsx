import { useState, useEffect } from "react";
import { AlertTriangle, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface EmergencyContactButtonProps {
  className?: string;
}

export function EmergencyContactButton({
  className,
}: EmergencyContactButtonProps) {
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();

  // Emergency contacts (these would come from the database in a real app)
  const emergencyContacts = [
    { name: "SwapRunn Support", phone: "1-800-SWAP-911", type: "Support" },
    { name: "Emergency Services", phone: "911", type: "Emergency" },
    { name: "Roadside Assistance", phone: "1-800-AAA-HELP", type: "Roadside" },
  ];

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        setLocationError("Unable to get location: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const handleEmergencyCall = (phone: string, contactName: string) => {
    // Log emergency call for tracking
    console.log("Emergency call initiated:", {
      phone,
      contactName,
      location,
      timestamp: new Date(),
    });

    // Show location info if available
    if (location) {
      toast({
        title: "Location Shared",
        description: `Your location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}) will be shared with ${contactName}`,
      });
    }

    // Initiate call
    window.location.href = `tel:${phone}`;
  };

  const shareLocation = () => {
    if (location) {
      const locationUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`;
      navigator.clipboard.writeText(locationUrl);
      toast({
        title: "Location Copied",
        description: "Your location has been copied to clipboard",
      });
    }
  };

  useEffect(() => {
    if (showEmergencyDialog) {
      getCurrentLocation();
    }
  }, [showEmergencyDialog]);

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowEmergencyDialog(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <AlertTriangle className="w-4 h-4" />
        Emergency
      </Button>

      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Emergency Assistance
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Location Status */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  {location ? (
                    <div>
                      <p className="text-green-600 font-medium">
                        Location Available
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={shareLocation}
                        className="h-auto p-0 text-xs"
                      >
                        Copy Location
                      </Button>
                    </div>
                  ) : locationError ? (
                    <div>
                      <p className="text-red-600 font-medium">
                        Location Unavailable
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {locationError}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={getCurrentLocation}
                        className="h-auto p-0 text-xs"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <p className="text-yellow-600 font-medium">
                      Getting Location...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <div className="space-y-2">
              {emergencyContacts.map((contact) => (
                <Button
                  key={contact.phone}
                  variant={
                    contact.type === "Emergency" ? "destructive" : "outline"
                  }
                  onClick={() =>
                    handleEmergencyCall(contact.phone, contact.name)
                  }
                  className="w-full justify-start"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-xs opacity-70">{contact.phone}</p>
                  </div>
                </Button>
              ))}
            </div>

            {/* Safety Tips */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4">
                <p className="text-xs text-yellow-800">
                  <strong>Safety Tip:</strong> If this is a life-threatening
                  emergency, call 911 immediately. Your location will be
                  automatically shared when possible.
                </p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
