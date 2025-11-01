import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { User } from "lucide-react";
import { getConversations } from "@/services/messages-data";

interface Conversation {
  id: string;
  otherPartyName: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  jobId?: string;
  assignmentId?: string;
}

interface ConversationListProps {
  status: "open" | "past";
  onSelectConversation: (id: string) => void;
  userType: string;
  currentUserId: string;
}

export function ConversationList({
  status,
  onSelectConversation,
  userType,
  currentUserId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, [status, userType, currentUserId]);

  const fetchConversations = () => {
    setLoading(true);
    try {
      const localConversations = getConversations(currentUserId);

      const formattedConversations: Conversation[] = localConversations.map(
        (conv) => ({
          id: conv.otherUserId,
          otherPartyName: conv.otherUserId,
          lastMessage: conv.lastMessage.messageText,
          lastMessageTime: conv.lastMessage.timestamp,
          unread: conv.unreadCount > 0,
        }),
      );

      setConversations(formattedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white/10 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-white/60">
        <p className="text-lg">No {status} conversations</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelectConversation(conv.id)}
          className="w-full bg-white/10 hover:bg-white/15 rounded-2xl p-4 transition-all border border-white/20 hover:border-white/40 text-left"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-[#E11900]/30 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-white truncate">
                  {conv.otherPartyName}
                </h3>
                <span className="text-xs text-white/60 whitespace-nowrap ml-2">
                  {formatDistanceToNow(new Date(conv.lastMessageTime), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <p
                className={`text-sm truncate ${conv.unread ? "text-white font-medium" : "text-white/70"}`}
              >
                {conv.lastMessage}
              </p>
            </div>

            {conv.unread && (
              <div className="h-3 w-3 bg-[#E11900] rounded-full flex-shrink-0 mt-2" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
