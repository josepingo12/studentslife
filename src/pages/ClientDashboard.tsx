import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User, Home, Users, MessageCircle, UserCircle, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import CategoryCarousel from "@/components/client/CategoryCarousel";
import PartnersList from "@/components/client/PartnersList";
import StoriesCarousel from "@/components/social/StoriesCarousel";
import CreatePost from "@/components/social/CreatePost";
import PostCard from "@/components/social/PostCard";
import UploadSheet from "@/components/shared/UploadSheet";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"social" | "partners" | "chats">("social");
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);

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

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("Client dashboard - Role check:", roleData, "Error:", roleError);

    if (!roleData || roleData.role !== "client") {
      navigate("/login");
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);
  };

  const loadPosts = async () => {
    setLoadingPosts(true);
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        profiles(first_name, last_name, profile_image_url, business_name),
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
      ) : activeTab === "chats" ? (
        <div className="text-center py-12 ios-card mx-4 mt-4">
          <p className="text-muted-foreground mb-4">Le chat si aprono in una pagina dedicata</p>
          <button
            onClick={() => navigate("/chats")}
            className="text-primary hover:underline"
          >
            Vai alle Chat
          </button>
        </div>
      ) : (
        <>
          {/* Category Carousel */}
          <div className="mt-6 px-4">
            <h3 className="text-xl font-bold mb-4">Categorie</h3>
            <CategoryCarousel onSelectCategory={setSelectedCategory} />
          </div>

          {/* Partners List */}
          {selectedCategory && (
            <div className="mt-6 px-4">
              <h3 className="text-xl font-bold mb-4">Partner disponibili</h3>
              <PartnersList category={selectedCategory} />
            </div>
          )}

          {!selectedCategory && (
            <div className="mt-12 text-center px-4">
              <p className="text-muted-foreground">
                Seleziona una categoria per vedere i partner disponibili
              </p>
            </div>
          )}
        </>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-between h-20 px-4 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("social")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "social" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Social</span>
          </button>
          
          <button
            onClick={() => setActiveTab("partners")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "partners" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Partner</span>
          </button>

          {/* Central Upload Button */}
          <button
            onClick={() => setUploadSheetOpen(true)}
            className="relative -mt-6 bg-gradient-to-br from-primary to-primary/80 rounded-full p-4 shadow-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-8 h-8 text-white" />
          </button>

          <button
            onClick={() => setActiveTab("chats")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "chats" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Chat</span>
          </button>
          
          <button
            onClick={() => navigate("/profile")}
            className="flex flex-col items-center gap-1 transition-colors text-muted-foreground"
          >
            <UserCircle className="w-6 h-6" />
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

export default ClientDashboard;
