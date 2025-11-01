import { useState } from "react";
import { QrCode, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { DriverProfile } from "@/services/driver-data";
import { findDriverByIdOrPhone } from "@/services/driver-data";

interface ProfileHeaderProps {
  driver: DriverProfile | null;
  isLoading: boolean;
  onDriverChange: (driver: DriverProfile) => void;
}

export function ProfileHeader({
  driver,
  isLoading,
  onDriverChange,
}: ProfileHeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const foundDriver = await findDriverByIdOrPhone(searchTerm.trim());
      if (foundDriver) {
        onDriverChange(foundDriver);
        setSearchTerm("");
        toast({
          title: "Driver Found",
          description: `Switched to ${foundDriver.name}`,
        });
      } else {
        toast({
          title: "Driver Not Found",
          description: "No driver found with that ID or phone number.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search for driver.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleShareProfile = () => {
    if (driver) {
      const url = `${window.location.origin}/driver/${driver.id}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Profile Link Copied",
        description: "Profile URL copied to clipboard",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex items-start gap-4 flex-1">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
      </CardContent>
    );
  }

  if (!driver) {
    return (
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Find Driver Profile</h2>
          <p className="text-muted-foreground">
            Enter a driver ID or phone number to view their profile
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              placeholder="Driver ID or phone number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
              className="px-4"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side - Driver info */}
        <div className="flex items-start gap-4 flex-1">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">
            {driver.avatarUrl ? (
              <img
                src={driver.avatarUrl}
                alt={driver.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              getInitials(driver.name)
            )}
          </div>

          {/* Driver details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{driver.name}</h1>
              {driver.rating && (
                <Badge variant="secondary" className="text-sm">
                  ⭐ {driver.rating.toFixed(1)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{driver.phone}</p>
            <p className="text-muted-foreground">{driver.email}</p>
          </div>
        </div>

        {/* Right side - Vehicle & actions */}
        <div className="flex flex-col gap-3">
          <Badge variant="outline" className="px-3 py-1 text-sm">
            {driver.vehicle.make} {driver.vehicle.model} •{" "}
            {driver.vehicle.plate}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareProfile}
            className="flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            Share Profile
          </Button>
        </div>
      </div>

      {/* Search to switch driver */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="Switch to another driver (ID or phone)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="text-sm"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchTerm.trim()}
            size="sm"
            variant="secondary"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              "View"
            )}
          </Button>
        </div>
      </div>
    </CardContent>
  );
}
