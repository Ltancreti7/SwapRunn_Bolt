import { useState } from "react";
import {
  MessageSquare,
  Clock,
  MapPin,
  Truck,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommunicationTemplatesProps {
  onSendMessage?: (message: string) => void;
  customerPhone?: string;
  className?: string;
}

const messageTemplates = [
  {
    id: "arrival",
    category: "Delivery Updates",
    title: "Arriving Soon",
    message:
      "Hi! I'm your SwapRunn driver and I'll be arriving in about 10 minutes for your vehicle pickup/delivery. I'll call when I arrive. Thanks!",
    icon: Clock,
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: "arrived",
    category: "Delivery Updates",
    title: "Arrived at Location",
    message:
      "Hi! I've arrived at your location for the vehicle pickup/delivery. I'm in a [vehicle description]. Please let me know when you're ready!",
    icon: MapPin,
    color: "bg-green-50 border-green-200",
  },
  {
    id: "delayed",
    category: "Delivery Updates",
    title: "Running Late",
    message:
      "Hi! I'm running about [X] minutes late due to traffic. I apologize for the delay and will be there as soon as possible. Thanks for your patience!",
    icon: AlertCircle,
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    id: "completed",
    category: "Delivery Updates",
    title: "Delivery Complete",
    message:
      "Your vehicle delivery has been completed successfully! Thank you for choosing SwapRunn. Please rate your experience when you have a moment.",
    icon: CheckCircle,
    color: "bg-green-50 border-green-200",
  },
  {
    id: "inspection",
    category: "Vehicle Info",
    title: "Vehicle Inspection",
    message:
      "I'm conducting the pre-delivery vehicle inspection now. Everything looks good and I'll be starting the delivery shortly. ETA: [time]",
    icon: Truck,
    color: "bg-purple-50 border-purple-200",
  },
  {
    id: "location_update",
    category: "Delivery Updates",
    title: "En Route Update",
    message:
      "I'm currently en route with your vehicle. Current location: [location]. Estimated arrival: [time]. I'll update you again when I'm close!",
    icon: MapPin,
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: "contact_info",
    category: "Professional",
    title: "Driver Introduction",
    message:
      "Hello! I'm [driver name], your SwapRunn driver. I'll be handling your vehicle delivery today. You can reach me at this number if needed. Thanks!",
    icon: MessageSquare,
    color: "bg-gray-50 border-gray-200",
  },
  {
    id: "thank_you",
    category: "Professional",
    title: "Thank You",
    message:
      "Thank you for your business! It was a pleasure serving you today. If you need any future vehicle deliveries, SwapRunn is here to help!",
    icon: MessageSquare,
    color: "bg-green-50 border-green-200",
  },
];

export function CommunicationTemplates({
  onSendMessage,
  customerPhone,
  className,
}: CommunicationTemplatesProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    ...Array.from(new Set(messageTemplates.map((t) => t.category))),
  ];

  const filteredTemplates =
    selectedCategory === "All"
      ? messageTemplates
      : messageTemplates.filter((t) => t.category === selectedCategory);

  const handleTemplateSelect = (template: (typeof messageTemplates)[0]) => {
    setSelectedTemplate(template.id);
    setCustomMessage(template.message);
  };

  const handleSendTemplate = () => {
    if (customMessage.trim()) {
      if (onSendMessage) {
        onSendMessage(customMessage);
      } else if (customerPhone) {
        // Fallback to SMS
        const smsUrl = `sms:${customerPhone}?body=${encodeURIComponent(customMessage)}`;
        window.location.href = smsUrl;
      }
      setShowTemplates(false);
      setSelectedTemplate(null);
      setCustomMessage("");
    }
  };

  const handleQuickSend = (template: (typeof messageTemplates)[0]) => {
    if (onSendMessage) {
      onSendMessage(template.message);
    } else if (customerPhone) {
      const smsUrl = `sms:${customerPhone}?body=${encodeURIComponent(template.message)}`;
      window.location.href = smsUrl;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowTemplates(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <MessageSquare className="w-4 h-4" />
        Quick Messages
      </Button>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Communication Templates</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Template Selection */}
            {!selectedTemplate ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${template.color}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <template.icon className="w-5 h-5 mt-1 text-primary" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{template.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {template.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {template.message}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTemplateSelect(template)}
                              >
                                Customize
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleQuickSend(template)}
                              >
                                Send Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              /* Template Customization */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Customize Message</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setCustomMessage("");
                    }}
                  >
                    Back to Templates
                  </Button>
                </div>

                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Edit your message..."
                  className="min-h-[120px]"
                />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setCustomMessage("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendTemplate}
                    disabled={!customMessage.trim()}
                    className="flex-1"
                  >
                    Send Message
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
