import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadNotifications = (userId: string | undefined) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const loadUnreadNotifications = async () => {
      try {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        // Get user posts
        const { data: userPosts } = await supabase
          .from("posts")
          .select("id")
          .eq("user_id", userId);

        const postIds = userPosts?.map(p => p.id) || [];

        // Count likes
        let likesCount = 0;
        if (postIds.length > 0) {
          const { count: likes } = await supabase
            .from("likes")
            .select("id", { count: "exact", head: true })
            .in("post_id", postIds)
            .neq("user_id", userId)
            .gte("created_at", oneDayAgo.toISOString());
          likesCount = likes || 0;
        }

        // Count comments
        let commentsCount = 0;
        if (postIds.length > 0) {
          const { count: comments } = await supabase
            .from("comments")
            .select("id", { count: "exact", head: true })
            .in("post_id", postIds)
            .neq("user_id", userId)
            .gte("created_at", oneDayAgo.toISOString());
          commentsCount = comments || 0;
        }

        // Count QR codes for partner events
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .single();

        let qrCodesCount = 0;
        if (userRole?.role === "partner") {
          const { data: partnerEvents } = await supabase
            .from("events")
            .select("id")
            .eq("partner_id", userId);

          const eventIds = partnerEvents?.map(e => e.id) || [];

          if (eventIds.length > 0) {
            const { count: qrCodes } = await supabase
              .from("qr_codes")
              .select("id", { count: "exact", head: true })
              .in("event_id", eventIds)
              .gte("created_at", oneDayAgo.toISOString());
            qrCodesCount = qrCodes || 0;
          }
        }

        setUnreadCount(likesCount + commentsCount + qrCodesCount);
      } catch (error) {
        console.error("Error loading unread notifications:", error);
        setUnreadCount(0);
      }
    };

    loadUnreadNotifications();

    // Subscribe to new likes, comments, and QR codes
    const channel = supabase
      .channel("all-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "likes",
        },
        () => {
          loadUnreadNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
        },
        () => {
          loadUnreadNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "qr_codes",
        },
        () => {
          loadUnreadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return unreadCount;
};
