import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  message: string;
  sender_type: "driver" | "dealer";
  sender_id: string;
  created_at: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  assignmentId: string;
  currentUserType: "driver" | "dealer";
  currentUserId: string;
}

export const ChatWindow = ({
  isOpen,
  onClose,
  jobId,
  assignmentId,
  currentUserType,
  currentUserId,
}: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load messages when chat opens
  useEffect(() => {
    if (isOpen && jobId && assignmentId) {
      loadMessages();
      setupRealTimeSubscription();
    }
  }, [isOpen, jobId, assignmentId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("job_messages")
        .select("*")
        .eq("job_id", jobId)
        .eq("assignment_id", assignmentId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      const messages = (data || []).map((msg) => ({
        id: msg.id,
        message: msg.message,
        sender_type: msg.sender_type as "driver" | "dealer",
        sender_id: msg.sender_id,
        created_at: msg.created_at,
      }));
      setMessages(messages);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    }
  };

  const setupRealTimeSubscription = () => {
    const channel = supabase
      .channel(`job-chat-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_messages",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          const newMessage: Message = {
            id: newMsg.id,
            message: newMsg.message,
            sender_type: newMsg.sender_type as "driver" | "dealer",
            sender_id: newMsg.sender_id,
            created_at: newMsg.created_at,
          };
          setMessages((prev) => [...prev, newMessage]);

          // Show toast for messages from other user
          if (newMessage.sender_type !== currentUserType) {
            toast({
              title: "New Message",
              description: `${newMessage.sender_type === "driver" ? "Driver" : "Dealer"}: ${newMessage.message.slice(0, 50)}${newMessage.message.length > 50 ? "..." : ""}`,
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("job_messages").insert({
        job_id: jobId,
        assignment_id: assignmentId,
        sender_type: currentUserType,
        sender_id: currentUserId,
        message: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[500px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Job Chat</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message.message}
                senderType={message.sender_type}
                timestamp={message.created_at}
                isCurrentUser={message.sender_type === currentUserType}
              />
            ))
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
