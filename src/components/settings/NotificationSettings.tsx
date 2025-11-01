import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, MessageSquare, Mail, Smartphone } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export const NotificationSettings = () => {
  const { userProfile } = useAuth();
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    requestPermission,
  } = usePushNotifications({
    userId: userProfile?.user_id,
    userType: userProfile?.user_type as "driver" | "dealer",
    enabled: true,
  });

  const getPermissionStatus = () => {
    switch (permission) {
      case "granted":
        return (
          <Badge variant="default" className="text-xs">
            Allowed
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive" className="text-xs">
            Blocked
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            Not Set
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications about jobs and updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Get instant notifications on your device
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                {getPermissionStatus()}
                {isSubscribed && (
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isSupported ? (
                <Badge variant="secondary">Not Supported</Badge>
              ) : permission === "denied" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestPermission}
                  disabled={isLoading}
                >
                  Enable in Browser
                </Button>
              ) : (
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      subscribe();
                    } else {
                      unsubscribe();
                    }
                  }}
                  disabled={isLoading || permission !== "granted"}
                />
              )}
            </div>
          </div>

          {!isSupported && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {
                  "Push notifications are not supported on this browser. You'll still receive in-app notifications."
                }
              </p>
            </div>
          )}

          {permission === "denied" && (
            <div className="bg-destructive/10 p-3 rounded-lg">
              <p className="text-sm text-destructive">
                Notifications are blocked. Please enable them in your browser
                settings to receive real-time updates.
              </p>
            </div>
          )}
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive email updates for important events
            </p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* SMS Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Get text messages for urgent updates
            </p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Notification Types */}
        <div className="space-y-3">
          <Label className="text-base font-medium">What to notify about:</Label>

          {userProfile?.user_type === "driver" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-jobs" className="text-sm">
                  New job opportunities
                </Label>
                <Switch id="new-jobs" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="job-updates" className="text-sm">
                  Job status updates
                </Label>
                <Switch id="job-updates" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="messages" className="text-sm">
                  New messages
                </Label>
                <Switch id="messages" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="payments" className="text-sm">
                  Payment notifications
                </Label>
                <Switch id="payments" defaultChecked />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="job-responses" className="text-sm">
                  Driver responses to jobs
                </Label>
                <Switch id="job-responses" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="delivery-updates" className="text-sm">
                  Delivery progress updates
                </Label>
                <Switch id="delivery-updates" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="messages" className="text-sm">
                  New messages
                </Label>
                <Switch id="messages" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="alerts" className="text-sm">
                  System alerts
                </Label>
                <Switch id="alerts" defaultChecked />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
