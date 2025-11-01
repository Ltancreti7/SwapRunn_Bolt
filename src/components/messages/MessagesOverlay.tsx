import { useState } from "react";
import { X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationList } from "./ConversationList";
import { ChatThread } from "./ChatThread";

interface MessagesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userType: string;
  currentUserId: string;
}

export function MessagesOverlay({
  isOpen,
  onClose,
  userType,
  currentUserId,
}: MessagesOverlayProps) {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Overlay Panel */}
      <div className="fixed inset-x-0 bottom-0 top-20 bg-black/95 backdrop-blur-md border-t-2 border-white/30 z-50 animate-slide-in-bottom rounded-t-3xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">Messages</h2>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content */}
        {selectedConversation ? (
          <ChatThread
            conversationId={selectedConversation}
            onBack={() => setSelectedConversation(null)}
            userType={userType}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="h-[calc(100%-88px)] overflow-hidden">
            <Tabs defaultValue="open" className="h-full flex flex-col">
              <TabsList className="w-full px-6 pt-4">
                <TabsTrigger value="open" className="flex-1">
                  Open
                </TabsTrigger>
                <TabsTrigger value="past" className="flex-1">
                  Past
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="open"
                className="flex-1 overflow-y-auto px-6 mt-4"
              >
                <ConversationList
                  status="open"
                  onSelectConversation={setSelectedConversation}
                  userType={userType}
                  currentUserId={currentUserId}
                />
              </TabsContent>

              <TabsContent
                value="past"
                className="flex-1 overflow-y-auto px-6 mt-4"
              >
                <ConversationList
                  status="past"
                  onSelectConversation={setSelectedConversation}
                  userType={userType}
                  currentUserId={currentUserId}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </>
  );
}
