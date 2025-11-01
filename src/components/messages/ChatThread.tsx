import { useEffect, useState, useRef } from "react";
import { ChevronLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  getConversationMessages,
  addMessage,
  Message,
} from "@/services/messages-data";

interface ChatThreadProps {
  conversationId: string;
  onBack: () => void;
  userType: string;
  currentUserId: string;
}

export function ChatThread({
  conversationId,
  onBack,
  userType,
  currentUserId,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, [conversationId, currentUserId]);

  const fetchMessages = () => {
    setLoading(true);
    try {
      const conversationMessages = getConversationMessages(
        currentUserId,
        conversationId,
      );
      setMessages(conversationMessages);
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const message = addMessage({
        sender: currentUserId,
        receiver: conversationId,
        messageText: newMessage.trim(),
        timestamp: new Date().toISOString(),
      });

      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white/60">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100%-88px)] flex flex-col">
      {/* Thread Header */}
      <div className="flex items-center gap-4 p-6 border-b border-white/20">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        <h3 className="text-xl font-bold text-white">Conversation</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => {
          const isOwnMessage = msg.sender === currentUserId;

          return (
            <div
              key={msg.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  isOwnMessage
                    ? "bg-[#E11900] text-white"
                    : "bg-white/10 text-white"
                }`}
              >
                <p className="text-sm break-words">{msg.messageText}</p>
                <p
                  className={`text-xs mt-1 ${isOwnMessage ? "text-white/80" : "text-white/60"}`}
                >
                  {formatDistanceToNow(new Date(msg.timestamp), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-6 border-t border-white/20"
      >
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50 rounded-2xl h-12"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-[#E11900] hover:bg-[#E11900]/90 text-white h-12 w-12 rounded-2xl p-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
