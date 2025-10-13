import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadLikes = (userId: string | undefined) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const loadUnreadLikes = async () => {
      try {
        // Get all posts by the user
        const { data: userPosts } = await supabase
          .from("posts")
          .select("id")
          .eq("user_id", userId);

        if (!userPosts || userPosts.length === 0) {
          setUnreadCount(0);
          return;
        }

        const postIds = userPosts.map(p => p.id);

        // Count likes from others (last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const { count } = await supabase
          .from("likes")
          .select("id", { count: "exact", head: true })
          .in("post_id", postIds)
          .neq("user_id", userId)
          .gte("created_at", oneDayAgo.toISOString());

        setUnreadCount(count || 0);
      } catch (error) {
        console.error("Error loading unread likes:", error);
        setUnreadCount(0);
      }
    };

    loadUnreadLikes();

    // Subscribe to new likes
    const channel = supabase
      .channel("likes-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "likes",
        },
        () => {
          loadUnreadLikes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return unreadCount;
};
