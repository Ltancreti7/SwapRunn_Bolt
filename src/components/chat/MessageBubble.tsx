import { format, parseISO } from "date-fns";
import { Download, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: string;
  senderType: "driver" | "dealer";
  timestamp: string;
  isCurrentUser: boolean;
  messageType?: "text" | "image" | "file";
  fileUrl?: string;
  fileName?: string;
}

export const MessageBubble = ({
  message,
  senderType,
  timestamp,
  isCurrentUser,
  messageType = "text",
  fileUrl,
  fileName,
}: MessageBubbleProps) => {
  const formatTime = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), "HH:mm");
    } catch (error) {
      return "--:--";
    }
  };

  const handleFileDownload = () => {
    if (fileUrl) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderContent = () => {
    switch (messageType) {
      case "image":
        return (
          <div className="space-y-2">
            {fileUrl && (
              <img
                src={fileUrl}
                alt="Shared image"
                className="max-w-[200px] rounded-lg cursor-pointer"
                onClick={() => window.open(fileUrl, "_blank")}
              />
            )}
            <p className="text-sm">{message}</p>
          </div>
        );

      case "file":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded border">
              <FileText className="h-4 w-4" />
              <span className="text-sm flex-1">{fileName}</span>
              <Button size="sm" variant="ghost" onClick={handleFileDownload}>
                <Download className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm">{message}</p>
          </div>
        );

      default:
        return <p className="text-sm">{message}</p>;
    }
  };

  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div className={`max-w-[80%] ${isCurrentUser ? "order-2" : "order-1"}`}>
        <div
          className={`p-3 rounded-2xl ${
            isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          {renderContent()}
        </div>
        <div
          className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}
        >
          <span className="capitalize">{senderType}</span> •{" "}
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  );
};
