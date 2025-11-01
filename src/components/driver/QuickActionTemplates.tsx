import { useState } from "react";
import {
  MessageSquare,
  Clock,
  AlertTriangle,
  ThumbsUp,
  Navigation,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CommunicationTemplates } from "./CommunicationTemplates";
import { EmergencyContactButton } from "./EmergencyContactButton";

interface QuickActionTemplatesProps {
  jobId?: string;
  customerPhone?: string;
  onSendMessage?: (message: string) => void;
}

const MESSAGE_TEMPLATES = [
  {
    id: "on_way",
    title: "On My Way",
    icon: Navigation,
    message:
      "Hi! I'm your SwapRunn driver and I'm on my way to pick up your vehicle. I should arrive in about 15 minutes. Thanks!",
    color: "text-blue-600",
  },
  {
    id: "arrived",
    title: "I've Arrived",
    icon: ThumbsUp,
    message:
      "I've arrived at the pickup location. Please let me know where I can find the vehicle and keys. Thanks!",
    color: "text-green-600",
  },
  {
    id: "delayed",
    title: "Running Late",
    icon: Clock,
    message:
      "I'm running about 10-15 minutes behind schedule due to traffic. I apologize for the delay and will be there shortly.",
    color: "text-orange-600",
  },
  {
    id: "issue",
    title: "Report Issue",
    icon: AlertTriangle,
    message:
      "I'm experiencing an issue with the pickup. Could you please give me a call when you have a moment? Thanks.",
    color: "text-red-600",
  },
  {
    id: "delivered",
    title: "Delivered",
    icon: ThumbsUp,
    message:
      "Your vehicle has been safely delivered to the destination. Thank you for choosing SwapRunn!",
    color: "text-green-600",
  },
];

const STATUS_UPDATES = [
  {
    id: "available",
    title: "Set Available",
    description: "Ready to accept new jobs",
    action: () => "available",
  },
  {
    id: "break",
    title: "Take Break",
    description: "Temporarily unavailable",
    action: () => "break",
  },
  {
    id: "end_shift",
    title: "End Shift",
    description: "Done for the day",
    action: () => "offline",
  },
];

export function QuickActionTemplates({
  jobId,
  customerPhone,
  onSendMessage,
}: QuickActionTemplatesProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleTemplateMessage = (template: (typeof MESSAGE_TEMPLATES)[0]) => {
    if (onSendMessage) {
      onSendMessage(template.message);
      toast({
        title: "Message Sent",
        description: `"${template.title}" message sent to customer`,
      });
    } else {
      // Fallback to SMS if no message handler
      const phoneUrl = `sms:${customerPhone}?body=${encodeURIComponent(template.message)}`;
      window.location.href = phoneUrl;
    }
  };

  const handleCustomMessage = () => {
    if (!customMessage.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    if (onSendMessage) {
      onSendMessage(customMessage);
      setCustomMessage("");
      setIsDialogOpen(false);
      toast({
        title: "Message Sent",
        description: "Custom message sent to customer",
      });
    } else {
      const phoneUrl = `sms:${customerPhone}?body=${encodeURIComponent(customMessage)}`;
      window.location.href = phoneUrl;
    }
  };

  const handleCall = () => {
    if (customerPhone) {
      window.location.href = `tel:${customerPhone}`;
    } else {
      toast({
        title: "No Phone Number",
        description: "Customer phone number not available",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = (statusAction: () => string) => {
    const newStatus = statusAction();
    toast({
      title: "Status Updated",
      description: `Your status has been set to ${newStatus}`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Quick Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MESSAGE_TEMPLATES.map((template) => {
              const IconComponent = template.icon;
              return (
                <Button
                  key={template.id}
                  variant="outline"
                  onClick={() => handleTemplateMessage(template)}
                  className="h-auto p-3 flex flex-col items-center gap-2 text-center"
                  disabled={!customerPhone && !onSendMessage}
                >
                  <IconComponent className={`h-5 w-5 ${template.color}`} />
                  <span className="text-sm font-medium">{template.title}</span>
                </Button>
              );
            })}
          </div>

          <div className="mt-4 space-y-3">
            {/* Enhanced Communication Tools */}
            <div className="flex gap-2 flex-wrap">
              <CommunicationTemplates
                onSendMessage={onSendMessage}
                customerPhone={customerPhone}
                className="flex-1"
              />
              <EmergencyContactButton />
            </div>

            {/* Legacy Custom Message and Call */}
            <div className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Custom Message
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Custom Message</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Type your message to the customer..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleCustomMessage} className="flex-1">
                        Send Message
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={handleCall} disabled={!customerPhone}>
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Status Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Status Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {STATUS_UPDATES.map((status) => (
              <Button
                key={status.id}
                variant="outline"
                onClick={() => handleStatusUpdate(status.action)}
                className="h-auto p-3 flex flex-col items-center gap-1 text-center"
              >
                <span className="text-sm font-medium">{status.title}</span>
                <span className="text-xs text-muted-foreground">
                  {status.description}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
