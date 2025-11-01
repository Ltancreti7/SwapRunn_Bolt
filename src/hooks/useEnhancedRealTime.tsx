import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RealTimeConfig {
  tables: string[];
  filters?: Record<string, string>;
  onUpdate?: (table: string, payload: any) => void;
  enablePresence?: boolean;
  userId?: string;
}

interface PresenceState {
  [key: string]: {
    user_id: string;
    online_at: string;
    status: "online" | "away" | "busy";
  }[];
}

export const useEnhancedRealTime = ({
  tables,
  filters = {},
  onUpdate,
  enablePresence = false,
  userId,
}: RealTimeConfig) => {
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [isUserOnline, setIsUserOnline] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const updatePresence = useCallback(
    async (status: "online" | "away" | "busy" = "online") => {
      if (!enablePresence || !userId) return;

      const channel = supabase.channel("presence");
      await channel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
        status,
      });
    },
    [enablePresence, userId],
  );

  useEffect(() => {
    if (!tables.length) return;

    const channels: any[] = [];

    // Set up real-time subscriptions for each table
    tables.forEach((table) => {
      const channel = supabase.channel(`realtime-${table}-${Date.now()}`);

      // Subscribe to all events for the table
      ["INSERT", "UPDATE", "DELETE"].forEach((event) => {
        let subscription = channel.on(
          "postgres_changes",
          {
            event: event as any,
            schema: "public",
            table: table,
            ...(filters[table] && { filter: filters[table] }),
          },
          (payload) => {
            console.log(`${event} on ${table}:`, payload);
            onUpdate?.(table, { event, ...payload });

            // Show toast for important updates
            if (event === "INSERT" && table === "jobs") {
              toast({
                title: "New Job Available",
                description: "A new job has been posted",
                duration: 5000,
              });
            }
          },
        );
      });

      // Set up presence tracking if enabled
      if (enablePresence) {
        channel
          .on("presence", { event: "sync" }, () => {
            const newState = channel.presenceState();
            setPresenceState(newState as any);

            // Update online status for users
            const onlineUsers: Record<string, boolean> = {};
            Object.values(newState)
              .flat()
              .forEach((user: any) => {
                onlineUsers[user.user_id] = true;
              });
            setIsUserOnline(onlineUsers);
          })
          .on("presence", { event: "join" }, ({ key, newPresences }) => {
            console.log("User joined:", key, newPresences);
          })
          .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
            console.log("User left:", key, leftPresences);
          });
      }

      // Subscribe to channel
      channel.subscribe((status) => {
        console.log(`Subscription status for ${table}:`, status);
        setConnectionStatus(status as any);

        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
          if (enablePresence && userId) {
            updatePresence();
          }
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("disconnected");
          toast({
            title: "Connection Issue",
            description: "Real-time updates may be delayed",
            variant: "destructive",
            duration: 3000,
          });
        }
      });

      channels.push(channel);
    });

    // Heartbeat to maintain presence
    const heartbeat = enablePresence
      ? setInterval(() => {
          updatePresence();
        }, 30000)
      : null;

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (enablePresence && userId) {
        updatePresence(document.hidden ? "away" : "online");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });

      if (heartbeat) {
        clearInterval(heartbeat);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    tables,
    filters,
    onUpdate,
    enablePresence,
    userId,
    updatePresence,
    toast,
  ]);

  return {
    connectionStatus,
    presenceState,
    isUserOnline,
    updatePresence,
  };
};
