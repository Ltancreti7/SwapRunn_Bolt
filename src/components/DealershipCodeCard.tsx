import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const DealershipCodeCard = () => {
  const [dealershipCode, setDealershipCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDealershipCode = async () => {
      if (!userProfile?.dealer_id) return;

      try {
        const { data, error } = await supabase
          .from("dealers")
          .select("dealership_code, name")
          .eq("id", userProfile.dealer_id)
          .single();

        if (error) throw error;

        setDealershipCode(data.dealership_code || "");
      } catch (error) {
        console.error("Error fetching dealership code:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealershipCode();
  }, [userProfile?.dealer_id]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(dealershipCode);
      toast({
        title: "Copied!",
        description: "Dealership code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const openStaffSignup = () => {
    const signupUrl = `${window.location.origin}/staff/signup`;
    window.open(signupUrl, "_blank");
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dealershipCode) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Users className="w-5 h-5" />
          Team Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-blue-700 mb-2">Your Dealership Code:</p>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-lg font-mono px-3 py-1 bg-blue-100 text-blue-800 border-blue-300"
            >
              {dealershipCode}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 w-8 p-0 border-blue-300 hover:bg-blue-100"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Share this code with new team members
          </p>
        </div>

        <div className="pt-2 border-t border-blue-200">
          <p className="text-sm text-blue-700 mb-3">Add new team members:</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openStaffSignup}
              className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <ExternalLink className="w-4 h-4" />
              Staff Signup Page
            </Button>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Send staff members to the signup page with your dealership code
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
