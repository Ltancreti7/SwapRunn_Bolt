import { Phone, MessageSquare, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QuickActionTemplates } from "./QuickActionTemplates";

interface QuickActionsProps {
  showTemplates?: boolean;
  jobId?: string;
  customerPhone?: string;
}

export function QuickActions({
  showTemplates = false,
  jobId,
  customerPhone,
}: QuickActionsProps) {
  const { toast } = useToast();

  const handleCallSupport = () => {
    // Try to make a phone call if supported, otherwise show toast
    const phoneNumber = "tel:+15551234567";
    try {
      window.location.href = phoneNumber;
    } catch (error) {
      toast({
        title: "Call Support",
        description: "Support: (555) 123-4567",
      });
    }
  };

  const handleMessageDispatch = () => {
    // Try to open email client, otherwise show toast
    const emailAddress = "mailto:dispatch@swaprunn.com?subject=Driver Message";
    try {
      window.location.href = emailAddress;
    } catch (error) {
      toast({
        title: "Message Dispatch",
        description: "Email: dispatch@swaprunn.com",
      });
    }
  };

  const handleReportIssue = () => {
    toast({
      title: "Report Issue",
      description: "Issue reporting form would open here.",
    });
  };

  return (
    <div className="space-y-4">
      {showTemplates && (
        <QuickActionTemplates jobId={jobId} customerPhone={customerPhone} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={handleCallSupport}
              className="flex items-center gap-2 h-12"
            >
              <Phone className="h-4 w-4" />
              Call Rider Support
            </Button>

            <Button
              variant="outline"
              onClick={handleMessageDispatch}
              className="flex items-center gap-2 h-12"
            >
              <MessageSquare className="h-4 w-4" />
              Message Dispatch
            </Button>

            <Button
              variant="outline"
              onClick={handleReportIssue}
              className="flex items-center gap-2 h-12"
            >
              <AlertTriangle className="h-4 w-4" />
              Report Issue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
