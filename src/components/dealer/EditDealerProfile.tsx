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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Trash2 } from "lucide-react";
import { z } from "zod";

const editDealerProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(100, "Name too long")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long")
    .optional(),
  position: z
    .string()
    .min(1, "Position cannot be empty")
    .max(100, "Position too long")
    .optional(),
  store: z.string().max(200, "Store name too long").optional(),
});

interface DealerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  store?: string;
  profile_photo_url?: string | null;
}

interface EditDealerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  dealerData: DealerData;
  onUpdate: (updatedData: Partial<DealerData>) => void;
}

export const EditDealerProfile = ({
  isOpen,
  onClose,
  dealerData,
  onUpdate,
}: EditDealerProfileProps) => {
  const [name, setName] = useState(dealerData.name || "");
  const [email, setEmail] = useState(dealerData.email || "");
  const [phone, setPhone] = useState(dealerData.phone || "");
  const [position, setPosition] = useState(dealerData.position || "");
  const [store, setStore] = useState(dealerData.store || "");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    dealerData.profile_photo_url || "",
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
        .from("dealer-photos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("dealer-photos")
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
      const validation = editDealerProfileSchema.safeParse({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        position: position.trim() || undefined,
        store: store.trim() || undefined,
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

      // Update dealer profile including photo
      const { error } = await supabase
        .from("dealers")
        .update({
          name: name.trim() || null,
          email: email.trim() || null,
          position: position.trim() || null,
          store: store.trim() || null,
          profile_photo_url: profilePhotoUrl || null,
        })
        .eq("id", dealerData.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      // Update local state
      onUpdate({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        position: position.trim() || undefined,
        store: store.trim() || undefined,
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
      <DialogContent className="sm:max-w-md bg-background border">
        <DialogHeader>
          <DialogTitle>Edit Dealer Profile</DialogTitle>
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
                      {dealerData.name
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

          <div className="space-y-2">
            <Label htmlFor="name">Name / Company</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name or company name"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position/Role</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Select your position" />
              </SelectTrigger>
              <SelectContent className="bg-background border">
                <SelectItem value="Sale Manager">Sale Manager</SelectItem>
                <SelectItem value="Client Advisor">Client Advisor</SelectItem>
                <SelectItem value="Sales Consultant">
                  Sales Consultant
                </SelectItem>
                <SelectItem value="Parts">Parts</SelectItem>
                <SelectItem value="Service Writer">Service Writer</SelectItem>
                <SelectItem value="Service Manager">Service Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="store">Store/Location</Label>
            <Input
              id="store"
              type="text"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="e.g., Downtown Location, Main Branch"
              maxLength={200}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
