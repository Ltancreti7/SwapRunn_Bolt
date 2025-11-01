import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Mail, Calendar, Plus } from "lucide-react";
import { DealerProfilePhoto } from "./DealerProfilePhoto";
interface DealerData {
  id: string;
  name: string;
  email: string;
  store?: string;
  profile_photo_url?: string;
  created_at: string;
  position?: string;
}
interface DealerProfileCardProps {
  dealerData: DealerData | null;
  userEmail?: string;
  onPhotoUpdate: (newUrl: string) => void;
  onEditProfile: () => void;
}
export const DealerProfileCard = ({
  dealerData,
  userEmail,
  onPhotoUpdate,
  onEditProfile,
}: DealerProfileCardProps) => {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
          {/* Profile Photo Section */}
          <div className="flex-shrink-0">
            <DealerProfilePhoto
              photoUrl={dealerData?.profile_photo_url}
              dealerName={dealerData?.name}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full min-w-0 text-center md:text-left">
            {/* Executive Header */}
            <div className="flex flex-col md:flex-row items-center md:items-center gap-3 mb-8">
              <Star className="h-7 w-7 text-yellow-400 fill-current flex-shrink-0" />
              <div className="flex flex-col">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {dealerData?.name}
                </h1>
                {dealerData?.position && (
                  <span className="text-lg md:text-xl text-white/90 font-medium mt-1">
                    {dealerData.position}
                  </span>
                )}
              </div>
            </div>

            {/* Dealer Information */}
            <div className="space-y-4 mb-8">
              {dealerData?.store && (
                <div className="flex items-center justify-center md:justify-start gap-3 text-white">
                  <MapPin className="h-5 w-5 text-white/60 flex-shrink-0" />
                  <span className="font-medium text-base">
                    {dealerData.store}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-center md:justify-start gap-3 text-white/90">
                <Mail className="h-5 w-5 text-white/60 flex-shrink-0" />
                <span className="text-base break-all md:truncate">
                  {dealerData?.email || userEmail}
                </span>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-3 text-white/90">
                <Calendar className="h-5 w-5 text-white/60 flex-shrink-0" />
                <span className="text-base">
                  Member since{" "}
                  {new Date(dealerData?.created_at || "").toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link to="/dealer/create-job" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#E11900] hover:bg-[#E11900]/90 text-white h-12 px-8 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transition-all">
                  <Plus className="h-5 w-5 mr-2" />
                  Request New Driver
                </Button>
              </Link>

              <Button
                onClick={onEditProfile}
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 rounded-2xl border-white/40 text-slate-950 bg-white hover:bg-white/90 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
