import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, QrCode, BarChart3, UserCircle, Users, Plus, Calendar, Image as ImageIcon, MessageCircle, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PartnerGalleryManager from "@/components/partner/PartnerGalleryManager";
import PartnerEventsManager from "@/components/partner/PartnerEventsManager";
import QRScanner from "@/components/partner/QRScanner";
import PartnerStats from "@/components/partner/PartnerStats";
import PartnerProfileEdit from "@/components/partner/PartnerProfileEdit";
import PartnerSocialProfile from "@/components/partner/PartnerSocialProfile";
import StoriesCarousel from "@/components/social/StoriesCarousel";
import CreatePost from "@/components/social/CreatePost";
import PostCard from "@/components/social/PostCard";
import UploadSheet from "@/components/shared/UploadSheet";
import NotificationBadge from "@/components/chat/NotificationBadge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"social" | "events" | "gallery" | "scanner" | "stats" | "profile">("social");
  const [profileView, setProfileView] = useState<"social" | "business">("social");
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const totalUnread = useUnreadMessages(user?.id);

  useEffect(() => {
    checkAuth();
    if (activeTab === "social") {
      loadPosts();
      subscribeToNewPosts();
    }
  }, [activeTab]);

  const subscribeToNewPosts = () => {
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadPosts = async () => {
    setLoadingPosts(true);
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        public_profiles!posts_user_id_fkey(first_name, last_name, profile_image_url, business_name),
        likes(id, user_id)
      `)
      .order("created_at", { ascending: false });

    setPosts(postsData || []);
    setLoadingPosts(false);
  };

  const handlePostCreated = () => {
    loadPosts();
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: isLiked 
            ? [...post.likes, { id: 'temp', user_id: user?.id }]
            : post.likes.filter((l: any) => l.user_id !== user?.id)
        };
      }
      return post;
    }));
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user is a partner
    const { data: role, error: roleError } = await supabase.rpc('get_user_role', { _user_id: user.id });

    console.log("Partner dashboard - Role check:", { role }, "Error:", roleError);

    if (role !== "partner") {
      if (role === "client") {
        navigate("/client-dashboard");
      } else {
        navigate("/login");
      }
      return;
    }

    setUser(user);

    // Get profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Disconnesso",
      description: "Logout effettuato con successo",
    });
    navigate("/login");
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary pb-24">
      {/* Content based on active tab */}
      {activeTab === "social" ? (
        <>
          {/* Stories */}
          <div className="mt-4">
            <StoriesCarousel currentUserId={user.id} />
          </div>

          {/* Create Post */}
          <div className="mx-4 mt-4">
            <CreatePost 
              userId={user.id} 
              userProfile={profile}
              onPostCreated={handlePostCreated}
            />
          </div>

          {/* Posts Feed */}
          <div className="mx-4 mt-4 space-y-4">
            {loadingPosts ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 ios-card">
                <p className="text-muted-foreground">Nessun post ancora. Sii il primo a postare!</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user.id}
                  onDelete={handlePostDeleted}
                  onLikeToggle={handleLikeToggle}
                />
              ))
            )}
          </div>
        </>
      ) : activeTab === "events" ? (
        <div className="px-4 mt-4">
          <PartnerEventsManager partnerId={user.id} />
        </div>
      ) : activeTab === "gallery" ? (
        <div className="px-4 mt-4">
          <PartnerGalleryManager partnerId={user.id} />
        </div>
      ) : activeTab === "scanner" ? (
        <div className="px-4 mt-4">
          <QRScanner partnerId={user.id} />
        </div>
      ) : activeTab === "stats" ? (
        <div className="px-4 mt-4">
          <PartnerStats partnerId={user.id} />
        </div>
      ) : (
        <div className="mt-4">
          {/* Profile View Toggle */}
          <div className="px-4 mb-4 flex justify-center">
            <Button
              onClick={() => setProfileView(profileView === "social" ? "business" : "social")}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowLeftRight className="w-4 h-4" />
              {profileView === "social" ? "Profilo Aziendale" : "Profilo Social"}
            </Button>
          </div>

          {/* Profile Content */}
          {profileView === "social" ? (
            <PartnerSocialProfile 
              profile={profile} 
              userId={user.id}
              onUpdate={checkAuth}
            />
          ) : (
            <div className="px-4">
              <PartnerProfileEdit profile={profile} onUpdate={checkAuth} />
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around h-20 px-2 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("social")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "social" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs font-medium">Social</span>
          </button>
          
          <button
            onClick={() => setActiveTab("events")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "events" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-medium">Eventi</span>
          </button>

          {/* Central Upload Button */}
          <button
            onClick={() => setActiveTab("scanner")}
            className="relative -mt-6 bg-gradient-to-br from-primary to-primary/80 rounded-full p-4 shadow-lg hover:scale-105 transition-transform"
          >
            <QrCode className="w-8 h-8 text-white" />
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "stats" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-medium">Stats</span>
          </button>

          <button
            onClick={() => navigate("/chats")}
            className="flex flex-col items-center gap-1 transition-colors text-muted-foreground relative"
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              <NotificationBadge count={totalUnread} />
            </div>
            <span className="text-xs font-medium">Chat</span>
          </button>
          
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "profile" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <UserCircle className="w-5 h-5" />
            <span className="text-xs font-medium">Profilo</span>
          </button>
        </div>
      </div>

      {/* Upload Sheet */}
      <UploadSheet
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
        userId={user.id}
        onUploadComplete={() => {
          if (activeTab === "social") {
            loadPosts();
          }
        }}
      />
    </div>
  );
};

export default PartnerDashboard;
