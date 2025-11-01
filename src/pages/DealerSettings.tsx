import { useState, useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffManagement } from "@/components/staff/StaffManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Settings,
  Building,
  Users,
  CreditCard,
  Copy,
  Check,
} from "lucide-react";
import BackButton from "@/components/BackButton";

export default function DealerSettings() {
  const { userProfile } = useAuth();
  const [dealerInfo, setDealerInfo] = useState({
    name: userProfile?.dealers?.name || "",
    store: userProfile?.dealers?.store || "",
    position: userProfile?.dealers?.position || "",
  });
  const [dealershipCode, setDealershipCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.dealer_id) {
      fetchDealershipCode();
    }
  }, [userProfile?.dealer_id]);

  const fetchDealershipCode = async () => {
    if (!userProfile?.dealer_id) return;

    try {
      const { data, error } = await supabase
        .from("dealers")
        .select("dealership_code")
        .eq("id", userProfile.dealer_id)
        .single();

      if (error) throw error;
      if (data?.dealership_code) {
        setDealershipCode(data.dealership_code);
      }
    } catch (error) {
      console.error("Error fetching dealership code:", error);
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(dealershipCode);
    setCodeCopied(true);
    toast({
      title: "Copied!",
      description: "Dealership code copied to clipboard",
    });
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSaveDealerInfo = async () => {
    if (!userProfile?.dealer_id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("dealers")
        .update({
          name: dealerInfo.name,
          store: dealerInfo.store,
          position: dealerInfo.position,
        })
        .eq("id", userProfile.dealer_id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your dealership information has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Dealership Settings</h1>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dealership Information</CardTitle>
                <CardDescription>
                  Update your dealership details and contact information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dealership-name">Dealership Name</Label>
                    <Input
                      id="dealership-name"
                      value={dealerInfo.name}
                      onChange={(e) =>
                        setDealerInfo((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter dealership name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-location">Store Location</Label>
                    <Input
                      id="store-location"
                      value={dealerInfo.store}
                      onChange={(e) =>
                        setDealerInfo((prev) => ({
                          ...prev,
                          store: e.target.value,
                        }))
                      }
                      placeholder="Enter store location"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="position">Your Position</Label>
                  <Input
                    id="position"
                    value={dealerInfo.position}
                    onChange={(e) =>
                      setDealerInfo((prev) => ({
                        ...prev,
                        position: e.target.value,
                      }))
                    }
                    placeholder="e.g., General Manager, Sales Manager"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveDealerInfo} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            {dealershipCode && (
              <Card>
                <CardHeader>
                  <CardTitle>Staff Signup Code</CardTitle>
                  <CardDescription>
                    Share this code with your team members so they can create
                    their accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex-1">
                      <Label className="text-sm text-muted-foreground mb-2">
                        Your Dealership Code
                      </Label>
                      <code className="text-3xl font-mono font-bold tracking-wider block">
                        {dealershipCode}
                      </code>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyCodeToClipboard}
                      className="h-10 w-10"
                    >
                      {codeCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Staff members can sign up at <strong>/staff/signup</strong>{" "}
                    using this code
                  </p>
                </CardContent>
              </Card>
            )}
            <StaffManagement />
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription plan and billing information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => (window.location.href = "/billing")}
                  className="w-full sm:w-auto"
                >
                  View Billing Dashboard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
