import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, Edit, Save, X, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const DealerProfile: React.FC = () => {
  const { userProfile, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(
    userProfile?.dealers?.profile_photo_url || null,
  );

  // Editable form state
  const [formData, setFormData] = useState({
    name: userProfile?.dealers?.name || "",
    position: userProfile?.dealers?.position || "",
    store: userProfile?.dealers?.store || "",
  });

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file || !user || !userProfile?.dealers?.id) {
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("dealer-photos")
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("dealer-photos")
        .getPublicUrl(fileName);

      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("dealers")
        .update({ profile_photo_url: publicUrl })
        .eq("id", userProfile.dealers.id);

      if (updateError) {
        throw updateError;
      }

      setProfilePhotoUrl(publicUrl);
      toast({
        title: "Success",
        description: "Profile photo updated successfully!",
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    document.getElementById("dealer-photo-input")?.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveProfile = async () => {
    if (!userProfile?.dealers?.id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("dealers")
        .update({
          name: formData.name,
          position: formData.position,
          store: formData.store,
        })
        .eq("id", userProfile.dealers.id);

      if (error) throw error;

      setEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: userProfile?.dealers?.name || "",
      position: userProfile?.dealers?.position || "",
      store: userProfile?.dealers?.store || "",
    });
    setEditing(false);
  };

  if (!userProfile?.dealers) {
    return null;
  }

  const dealer = userProfile.dealers;

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            Profile
          </CardTitle>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage
                src={profilePhotoUrl || undefined}
                alt="Dealer profile"
              />
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-white">
                {getInitials(editing ? formData.name : dealer.name || "D")}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              variant="secondary"
              className="absolute -bottom-1 -right-1 rounded-full p-1.5 h-auto bg-white/20 hover:bg-white/30 border-white/30"
              onClick={triggerFileInput}
              disabled={uploading}
            >
              {uploading ? (
                <Upload className="w-3 h-3 animate-spin text-white" />
              ) : (
                <Camera className="w-3 h-3 text-white" />
              )}
            </Button>
            <input
              id="dealer-photo-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <div className="flex-1 space-y-3">
            {editing ? (
              <>
                <div>
                  <Label htmlFor="name" className="text-white/70 text-sm">
                    Name / Company
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-1"
                    placeholder="Enter your name or company name"
                  />
                </div>
                <div>
                  <Label htmlFor="position" className="text-white/70 text-sm">
                    Position / Title
                  </Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        position: e.target.value,
                      }))
                    }
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-1"
                    placeholder="e.g. Sales Manager, Owner, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="store" className="text-white/70 text-sm">
                    Store / Dealership
                  </Label>
                  <Input
                    id="store"
                    value={formData.store}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        store: e.target.value,
                      }))
                    }
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-1"
                    placeholder="e.g. ABC Auto Sales, Downtown Motors"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {dealer.name || "Click Edit to add name"}
                  </h3>
                </div>
                {dealer.position && (
                  <p className="text-white/70 text-sm">{dealer.position}</p>
                )}
                {dealer.store && (
                  <p className="text-white/60 text-sm">{dealer.store}</p>
                )}
                <div className="flex items-center gap-4 text-xs pt-2">
                  <span className="text-white/60">
                    Plan:{" "}
                    <span className="text-white font-medium">
                      {dealer.plan || "Standard"}
                    </span>
                  </span>
                  <span className="text-white/60">
                    Status:{" "}
                    <span className="text-green-400 font-medium">
                      {dealer.status}
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {!profilePhotoUrl && !editing && (
          <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-white/70">
              💡 Add your company logo or profile photo by clicking the camera
              icon
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dealer/settings")}
            className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <Settings className="w-4 h-4 mr-2" />
            Dealership Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DealerProfile;
