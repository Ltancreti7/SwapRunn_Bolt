import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { ChatWindow } from "./ChatWindow";
import { supabase } from "@/integrations/supabase/client";
interface ChatButtonProps {
  jobId: string;
  assignmentId: string;
  currentUserType: "driver" | "dealer";
  currentUserId: string;
  size?: "sm" | "default";
}
export const ChatButton = ({
  jobId,
  assignmentId,
  currentUserType,
  currentUserId,
  size = "default",
}: ChatButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    loadUnreadCount();
    setupRealTimeSubscription();
  }, [jobId, assignmentId]);
  const loadUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from("job_messages")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("job_id", jobId)
        .eq("assignment_id", assignmentId)
        .neq("sender_type", currentUserType)
        .is("read_at", null);
      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };
  const setupRealTimeSubscription = () => {
    const channel = supabase
      .channel(`job-chat-unread-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_messages",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          // Increment unread count for messages from other user type
          if (newMessage.sender_type !== currentUserType) {
            setUnreadCount((prev) => prev + 1);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  };
  const handleChatOpen = () => {
    setIsOpen(true);
    // Mark messages as read when opening chat
    markMessagesAsRead();
  };
  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from("job_messages")
        .update({
          read_at: new Date().toISOString(),
        })
        .eq("job_id", jobId)
        .eq("assignment_id", assignmentId)
        .neq("sender_type", currentUserType)
        .is("read_at", null);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };
  return (
    <>
      <Button
        variant="secondary"
        size={size}
        onClick={handleChatOpen}
        className="relative bg-white/20 hover:bg-white/30 border-white/30 text-[#e30202]"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Chat
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        jobId={jobId}
        assignmentId={assignmentId}
        currentUserType={currentUserType}
        currentUserId={currentUserId}
      />
    </>
  );
};
