import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Trash2 } from "lucide-react";
import { z } from "zod";

const editDriverProfileSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email too long")
    .optional(),
  day_off: z
    .enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ])
    .optional(),
  max_miles: z
    .number()
    .min(10, "Minimum 10 miles")
    .max(200, "Maximum 200 miles"),
  city_ok: z.boolean(),
  available: z.boolean(),
});

interface DriverData {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  day_off?: string;
  max_miles?: number;
  city_ok?: boolean;
  available?: boolean;
  profile_photo_url?: string | null;
}

interface EditDriverProfileProps {
  isOpen: boolean;
  onClose: () => void;
  driverData: DriverData;
  onUpdate: (updatedData: Partial<DriverData>) => void;
}

export const EditDriverProfile = ({
  isOpen,
  onClose,
  driverData,
  onUpdate,
}: EditDriverProfileProps) => {
  const [phone, setPhone] = useState(driverData.phone || "");
  const [email, setEmail] = useState(driverData.email || "");
  const [dayOff, setDayOff] = useState(driverData.day_off || "");
  const [maxMiles, setMaxMiles] = useState(driverData.max_miles || 50);
  const [cityOk, setCityOk] = useState(driverData.city_ok ?? true);
  const [available, setAvailable] = useState(driverData.available ?? true);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    driverData.profile_photo_url || "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("driver-photos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("driver-photos")
        .getPublicUrl(fileName);

      setProfilePhotoUrl(data.publicUrl);

      toast({
        title: "Photo uploaded",
        description: "Photo will be saved when you update your profile",
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhotoUrl("");
    toast({
      title: "Photo removed",
      description: "Photo will be removed when you save your profile",
    });
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Validate input
      const validation = editDriverProfileSchema.safeParse({
        phone: phone.trim(),
        email: email.trim() || undefined,
        day_off: dayOff || undefined,
        max_miles: maxMiles,
        city_ok: cityOk,
        available: available,
      });

      if (!validation.success) {
        const errorMessage =
          validation.error.errors[0]?.message || "Invalid input";
        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Update driver profile including photo
      const { error } = await supabase
        .from("drivers" as any)
        .update({
          phone: phone.trim() || null,
          email: email.trim() || null,
          day_off: dayOff || null,
          max_miles: maxMiles,
          city_ok: cityOk,
          available: available,
          profile_photo_url: profilePhotoUrl || null,
        })
        .eq("id", driverData.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      // Update local state
      onUpdate({
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        day_off: dayOff || undefined,
        max_miles: maxMiles,
        city_ok: cityOk,
        available: available,
        profile_photo_url: profilePhotoUrl || null,
      });

      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, "");

    // Format as (XXX) XXX-XXXX for US numbers
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return phoneNumber;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-background border z-[60] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Driver Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Photo Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Profile Photo
            </h3>

            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">
                      {driverData.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "D"}
                    </span>
                  )}
                </div>

                {profilePhotoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-destructive hover:bg-destructive/90 rounded-full flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3 text-destructive-foreground" />
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {uploadingPhoto
                  ? "Uploading..."
                  : profilePhotoUrl
                    ? "Change Photo"
                    : "Add Photo"}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          <Separator />

          {/* Contact Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Contact Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(555) 123-4567"
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                maxLength={255}
              />
            </div>
          </div>

          <Separator />

          {/* Work Preferences Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Work Preferences
            </h3>

            <div className="space-y-2">
              <Label htmlFor="day-off">Preferred Day Off</Label>
              <Select value={dayOff} onValueChange={setDayOff}>
                <SelectTrigger className="bg-background border-border hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  <SelectValue placeholder="Select a day (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border shadow-lg z-[100] max-h-[300px] overflow-auto">
                  <SelectItem
                    value="no-preference"
                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                  >
                    No preference
                  </SelectItem>
                  <SelectItem
                    value="monday"
                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                  >
                    Monday
                  </SelectItem>
                  <SelectItem
                    value="tuesday"
                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                  >
                    Tuesday
                  </SelectItem>
                  <SelectItem
                    value="wednesday"
                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                  >
                    Wednesday
                  </SelectItem>
                  <SelectItem
                    value="thursday"
                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                  >
                    Thursday
                  </SelectItem>
                  <SelectItem
                    value="friday"
                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                  >
                    Friday
                  </SelectItem>
                  <SelectItem
                    value="saturday"
                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                  >
                    Saturday
                  </SelectItem>
                  <SelectItem
                    value="sunday"
                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                  >
                    Sunday
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 py-2">
              <Label htmlFor="max-miles" className="text-sm font-medium">
                Maximum Miles Willing to Drive:{" "}
                <span className="font-bold text-primary">{maxMiles} miles</span>
              </Label>
              <div className="px-2">
                <Slider
                  id="max-miles"
                  min={10}
                  max={200}
                  step={5}
                  value={[maxMiles]}
                  onValueChange={(value) => setMaxMiles(value[0])}
                  className="w-full cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {"Set the maximum distance you're willing to drive for a job"}
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2 py-2">
              <div className="space-y-0.5 flex-1">
                <Label
                  htmlFor="city-ok"
                  className="cursor-pointer text-sm font-medium"
                >
                  Comfortable with City Driving
                </Label>
                <p className="text-xs text-muted-foreground">
                  Are you comfortable driving in city traffic?
                </p>
              </div>
              <Switch
                id="city-ok"
                checked={cityOk}
                onCheckedChange={setCityOk}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between space-x-2 py-2">
              <div className="space-y-0.5 flex-1">
                <Label
                  htmlFor="available"
                  className="cursor-pointer text-sm font-medium"
                >
                  Available for Jobs
                </Label>
                <p className="text-xs text-muted-foreground">
                  {"Turn this off when you're not available to accept new jobs"}
                </p>
              </div>
              <Switch
                id="available"
                checked={available}
                onCheckedChange={setAvailable}
                className="flex-shrink-0"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[80px] cursor-pointer hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="min-w-[120px] cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
