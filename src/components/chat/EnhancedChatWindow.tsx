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
import { Badge } from "@/components/ui/badge";
import {
  Send,
  X,
  Paperclip,
  Image,
  Search,
  Check,
  CheckCheck,
  Phone,
  MessageSquare,
} from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CommunicationTemplates } from "../driver/CommunicationTemplates";

interface Message {
  id: string;
  message: string;
  sender_type: "driver" | "dealer";
  sender_id: string;
  created_at: string;
  read_at?: string;
  message_type?: "text" | "image" | "file";
  file_url?: string;
  file_name?: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  assignmentId: string;
  currentUserType: "driver" | "dealer";
  currentUserId: string;
  driverName?: string;
  dealerName?: string;
}

export const EnhancedChatWindow = ({
  isOpen,
  onClose,
  jobId,
  assignmentId,
  currentUserType,
  currentUserId,
  driverName = "Driver",
  dealerName = "Dealer",
}: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages when chat opens
  useEffect(() => {
    if (isOpen && jobId && assignmentId) {
      loadMessages();
      setupRealTimeSubscription();
      markMessagesAsRead();
    }
  }, [isOpen, jobId, assignmentId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 2000);
  };

  const sendTypingIndicator = async (typing: boolean) => {
    try {
      await supabase.from("job_messages").upsert(
        {
          job_id: jobId,
          assignment_id: assignmentId,
          sender_type: currentUserType,
          sender_id: currentUserId,
          message: "__TYPING_INDICATOR__",
          metadata: { typing, timestamp: new Date().toISOString() },
        },
        { onConflict: "sender_id,job_id" },
      );
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("job_messages")
        .select("*")
        .eq("job_id", jobId)
        .eq("assignment_id", assignmentId)
        .neq("message", "__TYPING_INDICATOR__")
        .order("created_at", { ascending: true });

      if (error) throw error;
      const messages = (data || []).map((msg) => ({
        id: msg.id,
        message: msg.message,
        sender_type: msg.sender_type as "driver" | "dealer",
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        read_at: msg.read_at,
        message_type: (msg.metadata as any)?.message_type || "text",
        file_url: (msg.metadata as any)?.file_url,
        file_name: (msg.metadata as any)?.file_name,
      }));
      setMessages(messages);

      // Count unread messages
      const unread = messages.filter(
        (msg) => msg.sender_type !== currentUserType && !msg.read_at,
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from("job_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("job_id", jobId)
        .eq("assignment_id", assignmentId)
        .neq("sender_type", currentUserType)
        .is("read_at", null);
    } catch (error) {
      console.error("Error marking messages as read:", error);
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

          // Handle typing indicators
          if (newMsg.message === "__TYPING_INDICATOR__") {
            if (newMsg.sender_type !== currentUserType) {
              setOtherUserTyping(newMsg.metadata?.typing || false);
            }
            return;
          }

          const newMessage: Message = {
            id: newMsg.id,
            message: newMsg.message,
            sender_type: newMsg.sender_type as "driver" | "dealer",
            sender_id: newMsg.sender_id,
            created_at: newMsg.created_at,
            read_at: newMsg.read_at,
            message_type: newMsg.metadata?.message_type || "text",
            file_url: newMsg.metadata?.file_url,
            file_name: newMsg.metadata?.file_name,
          };

          setMessages((prev) => [...prev, newMessage]);

          // Update unread count and show notification for messages from other user
          if (newMessage.sender_type !== currentUserType) {
            setUnreadCount((prev) => prev + 1);
            toast({
              title: "New Message",
              description: `${newMessage.sender_type === "driver" ? driverName : dealerName}: ${newMessage.message.slice(0, 50)}${newMessage.message.length > 50 ? "..." : ""}`,
            });

            // Auto-mark as read if chat is open
            if (isOpen) {
              setTimeout(() => markMessagesAsRead(), 1000);
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "job_messages",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as any;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMsg.id
                ? { ...msg, read_at: updatedMsg.read_at }
                : msg,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleFileUpload = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `chat-files/${fileName}`;

    try {
      setIsLoading(true);

      const { error: uploadError } = await supabase.storage
        .from("dealer-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("dealer-photos")
        .getPublicUrl(filePath);

      await sendMessage(
        file.type.startsWith("image/")
          ? "Sent an image"
          : `Sent file: ${file.name}`,
        file.type.startsWith("image/") ? "image" : "file",
        data.publicUrl,
        file.name,
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (
    message?: string,
    messageType: "text" | "image" | "file" = "text",
    fileUrl?: string,
    fileName?: string,
  ) => {
    const messageText = message || newMessage.trim();
    if (!messageText || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("job_messages").insert({
        job_id: jobId,
        assignment_id: assignmentId,
        sender_type: currentUserType,
        sender_id: currentUserId,
        message: messageText,
        metadata: {
          message_type: messageType,
          file_url: fileUrl,
          file_name: fileName,
        },
      });

      if (error) throw error;
      if (!message) setNewMessage("");
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

  const filteredMessages = messages.filter(
    (msg) =>
      !searchQuery ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getDeliveryStatus = (message: Message) => {
    if (message.sender_type === currentUserType) {
      return message.read_at ? (
        <CheckCheck className="h-3 w-3 text-blue-500" />
      ) : (
        <Check className="h-3 w-3 text-gray-400" />
      );
    }
    return null;
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={(e) =>
          e.target.files?.[0] && handleFileUpload(e.target.files[0])
        }
        className="hidden"
      />

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle>
                  {currentUserType === "driver" ? dealerName : driverName}
                </DialogTitle>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-2 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {showSearch && (
              <div className="mt-3">
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8"
                />
              </div>
            )}
          </DialogHeader>

          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            {filteredMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {searchQuery
                  ? "No messages found."
                  : "No messages yet. Start the conversation!"}
              </div>
            ) : (
              <>
                {filteredMessages.map((message) => (
                  <div key={message.id} className="mb-4">
                    <MessageBubble
                      message={message.message}
                      senderType={message.sender_type}
                      timestamp={message.created_at}
                      isCurrentUser={message.sender_type === currentUserType}
                      messageType={message.message_type}
                      fileUrl={message.file_url}
                      fileName={message.file_name}
                    />
                    <div
                      className={`flex ${message.sender_type === currentUserType ? "justify-end" : "justify-start"} mt-1`}
                    >
                      {getDeliveryStatus(message)}
                    </div>
                  </div>
                ))}

                {otherUserTyping && (
                  <div className="text-sm text-muted-foreground italic">
                    {currentUserType === "driver" ? dealerName : driverName} is
                    typing...
                  </div>
                )}
              </>
            )}
          </ScrollArea>

          <div className="p-4 border-t space-y-3">
            {/* Communication Templates */}
            <div className="flex justify-center">
              <CommunicationTemplates
                onSendMessage={(message) => sendMessage(message)}
              />
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!newMessage.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
