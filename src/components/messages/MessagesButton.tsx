import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessagesButtonProps {
  onClick: () => void;
  unreadCount: number;
}

export function MessagesButton({ onClick, unreadCount }: MessagesButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="icon"
      className="relative h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white shadow-lg border border-white/10 active:scale-95 transition-transform"
    >
      <MessageCircle className="h-5 w-5 text-white" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E11900] text-xs font-bold text-white border-2 border-black">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  );
}
