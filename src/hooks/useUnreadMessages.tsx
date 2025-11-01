import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UnreadCount {
  jobId: string;
  assignmentId: string;
  count: number;
}

export const useUnreadMessages = () => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const { user, userProfile } = useAuth();

  const fetchUnreadCounts = async () => {
    if (!user || !userProfile) return;

    try {
      let query = supabase
        .from("job_messages")
        .select("job_id, assignment_id, read_at")
        .is("read_at", null);

      // Filter based on user type
      if (userProfile.user_type === "dealer") {
        // For dealers, get unread messages where they are NOT the sender
        query = query.neq("sender_type", "dealer");
      } else if (userProfile.user_type === "driver") {
        // For drivers, get unread messages where they are NOT the sender
        query = query.neq("sender_type", "driver");
      }

      const { data: unreadMessages, error } = await query;

      if (error) throw error;

      // Group by job and assignment to get counts
      const countMap = new Map<
        string,
        { jobId: string; assignmentId: string; count: number }
      >();

      unreadMessages?.forEach((message) => {
        const key = `${message.job_id}-${message.assignment_id}`;
        if (countMap.has(key)) {
          countMap.get(key)!.count++;
        } else {
          countMap.set(key, {
            jobId: message.job_id,
            assignmentId: message.assignment_id,
            count: 1,
          });
        }
      });

      const counts = Array.from(countMap.values());
      setUnreadCounts(counts);
      setTotalUnread(counts.reduce((sum, item) => sum + item.count, 0));
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  };

  const markMessagesAsRead = async (jobId: string, assignmentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("job_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("job_id", jobId)
        .eq("assignment_id", assignmentId)
        .is("read_at", null);

      if (error) throw error;

      // Update local state
      setUnreadCounts((prev) =>
        prev.filter(
          (item) =>
            !(item.jobId === jobId && item.assignmentId === assignmentId),
        ),
      );

      // Recalculate total
      setTotalUnread((prev) => {
        const foundItem = unreadCounts.find(
          (item) => item.jobId === jobId && item.assignmentId === assignmentId,
        );
        return prev - (foundItem?.count || 0);
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const getUnreadCountForJob = (jobId: string, assignmentId: string) => {
    const found = unreadCounts.find(
      (item) => item.jobId === jobId && item.assignmentId === assignmentId,
    );
    return found?.count || 0;
  };

  useEffect(() => {
    fetchUnreadCounts();
  }, [user, userProfile]);

  useEffect(() => {
    if (!user || !userProfile) return;

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`unread-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_messages",
        },
        (payload) => {
          // Check if this message is for the current user
          const isForCurrentUser =
            userProfile.user_type === "dealer"
              ? payload.new.sender_type === "driver"
              : payload.new.sender_type === "dealer";

          if (isForCurrentUser) {
            fetchUnreadCounts();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "job_messages",
        },
        () => {
          fetchUnreadCounts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userProfile]);

  return {
    unreadCounts,
    totalUnread,
    getUnreadCountForJob,
    markMessagesAsRead,
    refreshUnreadCounts: fetchUnreadCounts,
  };
};
