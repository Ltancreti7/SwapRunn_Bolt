import React, { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: "dealer" | "driver" | "staff" | "admin";
}

export function ProtectedRoute({
  children,
  requiredUserType,
}: ProtectedRouteProps) {
  const { user, userProfile, loading, profileLoading } = useAuth();
  const hasRedirected = useRef(false);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">
          {profileLoading ? "Loading profile..." : "Authenticating..."}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Handle users without profiles - redirect to account setup
  // Only show account setup if we're sure profile loading is complete
  if (!userProfile && user && !profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md p-6">
          <CardContent className="space-y-4">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <h2 className="text-lg font-semibold">Account Setup Required</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Your account needs to be set up properly. Please choose your
                account type to continue.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => (window.location.href = "/dealer/signin")}
                className="flex-1"
              >
                I'm a Dealer
              </Button>
              <Button
                onClick={() => (window.location.href = "/driver/auth")}
                variant="outline"
                className="flex-1"
              >
                I'm a Driver
              </Button>
              <Button
                variant="ghost"
                onClick={() => supabase.auth.signOut()}
                className="flex-1 mt-2"
                size="sm"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiredUserType && userProfile?.user_type !== requiredUserType) {
    // One-time redirect guard to prevent redirect loops
    if (hasRedirected.current) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="w-full max-w-md p-6">
            <CardContent className="text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <h2 className="text-lg font-semibold">Access Denied</h2>
              <p className="text-sm text-muted-foreground mb-4">
                You don't have permission to access this page.
              </p>
              <Button onClick={() => (window.location.href = "/")}>
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    hasRedirected.current = true;

    // Redirect to appropriate landing page for actual user type
    let redirectPath = "/";
    if (userProfile?.user_type === "dealer") {
      // All dealers go to admin dashboard (they can manage their own dealership)
      redirectPath = "/dealer/admin";
    } else if (userProfile?.user_type === "staff") {
      // Staff members go to limited dashboard
      redirectPath = "/dealer/dashboard";
    } else if (userProfile?.user_type === "driver") {
      redirectPath = "/driver/dashboard";
    } else if (userProfile?.user_type === "admin") {
      redirectPath = "/dealer/admin";
    }
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
