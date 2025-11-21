export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          accessed_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          accessed_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          accessed_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          color: string
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          threshold: number
          user_type: Database["public"]["Enums"]["badge_user_type"]
        }
        Insert: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          color: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          threshold: number
          user_type?: Database["public"]["Enums"]["badge_user_type"]
        }
        Update: {
          badge_type?: Database["public"]["Enums"]["badge_type"]
          color?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          threshold?: number
          user_type?: Database["public"]["Enums"]["badge_user_type"]
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          image_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          auto_moderated: boolean | null
          content: string
          created_at: string
          id: string
          moderation_category: string | null
          moderation_reason: string | null
          moderation_score: number | null
          post_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_moderated?: boolean | null
          content: string
          created_at?: string
          id?: string
          moderation_category?: string | null
          moderation_reason?: string | null
          moderation_score?: number | null
          post_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_moderated?: boolean | null
          content?: string
          created_at?: string
          id?: string
          moderation_category?: string | null
          moderation_reason?: string | null
          moderation_score?: number | null
          post_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_flags: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          moderation_notes: string | null
          moderator_id: string | null
          reason: string
          reporter_user_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          moderation_notes?: string | null
          moderator_id?: string | null
          reason: string
          reporter_user_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          moderation_notes?: string | null
          moderator_id?: string | null
          reason?: string
          reporter_user_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          end_date: string
          id: string
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          partner_id: string
          qr_enabled: boolean
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          end_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          partner_id: string
          qr_enabled?: boolean
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          partner_id?: string
          qr_enabled?: boolean
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          favorite_user_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_user_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_user_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_favorite_user_id_fkey"
            columns: ["favorite_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_favorite_user_id_fkey"
            columns: ["favorite_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          partner_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          partner_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          auto_moderated: boolean | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          media_type: string | null
          media_url: string | null
          moderation_category: string | null
          moderation_reason: string | null
          moderation_score: number | null
          read_at: string | null
          sender_id: string
          status: string | null
        }
        Insert: {
          auto_moderated?: boolean | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_type?: string | null
          media_url?: string | null
          moderation_category?: string | null
          moderation_reason?: string | null
          moderation_score?: number | null
          read_at?: string | null
          sender_id: string
          status?: string | null
        }
        Update: {
          auto_moderated?: boolean | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_type?: string | null
          media_url?: string | null
          moderation_category?: string | null
          moderation_reason?: string | null
          moderation_score?: number | null
          read_at?: string | null
          sender_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_views: {
        Row: {
          client_id: string
          created_at: string
          id: string
          partner_id: string
          viewed_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          partner_id: string
          viewed_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          partner_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_views_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_views_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          id: string
          post_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          post_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          post_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          auto_moderated: boolean | null
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          media_type: string | null
          moderation_category: string | null
          moderation_reason: string | null
          moderation_score: number | null
          status: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          auto_moderated?: boolean | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          media_type?: string | null
          moderation_category?: string | null
          moderation_reason?: string | null
          moderation_score?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          auto_moderated?: boolean | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          media_type?: string | null
          moderation_category?: string | null
          moderation_reason?: string | null
          moderation_score?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          business_address: string | null
          business_category: string | null
          business_city: string | null
          business_description: string | null
          business_name: string | null
          business_phone: string | null
          contact_email: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          last_payment_amount: number | null
          last_payment_date: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          phone_number: string | null
          profile_image_url: string | null
          terms_accepted_at: string | null
          university: string | null
          updated_at: string | null
        }
        Insert: {
          account_status?: string | null
          business_address?: string | null
          business_category?: string | null
          business_city?: string | null
          business_description?: string | null
          business_name?: string | null
          business_phone?: string | null
          contact_email?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          last_payment_amount?: number | null
          last_payment_date?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          terms_accepted_at?: string | null
          university?: string | null
          updated_at?: string | null
        }
        Update: {
          account_status?: string | null
          business_address?: string | null
          business_category?: string | null
          business_city?: string | null
          business_description?: string | null
          business_name?: string | null
          business_phone?: string | null
          contact_email?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_payment_amount?: number | null
          last_payment_date?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          terms_accepted_at?: string | null
          university?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          client_id: string
          code: string
          created_at: string | null
          event_id: string
          id: string
          is_used: boolean | null
          used_at: string | null
        }
        Insert: {
          client_id: string
          code: string
          created_at?: string | null
          event_id: string
          id?: string
          is_used?: boolean | null
          used_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          created_at?: string | null
          event_id?: string
          id?: string
          is_used?: boolean | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          partner_id: string
          rating: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          partner_id: string
          rating: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          partner_id?: string
          rating?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          auto_moderated: boolean | null
          created_at: string
          expires_at: string
          id: string
          image_url: string | null
          media_type: string | null
          moderation_category: string | null
          moderation_reason: string | null
          status: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          auto_moderated?: boolean | null
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          media_type?: string | null
          moderation_category?: string | null
          moderation_reason?: string | null
          status?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          auto_moderated?: boolean | null
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          media_type?: string | null
          moderation_category?: string | null
          moderation_reason?: string | null
          status?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          conversation_id: string
          id: string
          is_typing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_typing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_typing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          seen: boolean | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          seen?: boolean | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          seen?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_user_id: string
          blocker_user_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_user_id: string
          blocker_user_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_user_id?: string
          blocker_user_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      user_fcm_tokens: {
        Row: {
          created_at: string | null
          fcm_token: string
          id: string
          platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fcm_token: string
          id?: string
          platform: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fcm_token?: string
          id?: string
          platform?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          id: string
          total_accesses: number | null
          total_events_created: number | null
          total_likes: number | null
          total_posts: number | null
          total_qr_downloaded: number | null
          total_qr_scanned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          total_accesses?: number | null
          total_events_created?: number | null
          total_likes?: number | null
          total_posts?: number | null
          total_qr_downloaded?: number | null
          total_qr_scanned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          total_accesses?: number | null
          total_events_created?: number | null
          total_likes?: number | null
          total_posts?: number | null
          total_qr_downloaded?: number | null
          total_qr_scanned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          business_name: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          profile_image_url: string | null
        }
        Insert: {
          business_name?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          profile_image_url?: string | null
        }
        Update: {
          business_name?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          profile_image_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_qr_code: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      set_admin_by_email: { Args: { _email: string }; Returns: undefined }
    }
    Enums: {
      app_role: "client" | "partner" | "admin"
      badge_type:
        | "access"
        | "likes"
        | "qr_downloaded"
        | "posts"
        | "qr_scanned"
        | "events_created"
      badge_user_type: "client" | "partner" | "both"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["client", "partner", "admin"],
      badge_type: [
        "access",
        "likes",
        "qr_downloaded",
        "posts",
        "qr_scanned",
        "events_created",
      ],
      badge_user_type: ["client", "partner", "both"],
    },
  },
} as const
