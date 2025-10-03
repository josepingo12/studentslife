import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Grid, Bookmark } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ImageViewer from "@/components/social/ImageViewer";

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [userId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/login");
      return;
    }

    setCurrentUser(user);
    await loadProfile(userId || user.id);
    await loadUserContent(userId || user.id);
  };

  const loadProfile = async (id: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    setProfile(data);
  };

  const loadUserContent = async (id: string) => {
    setLoading(true);

    // Load posts
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        likes(id, user_id)
      `)
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    setPosts(postsData || []);

    // Load saved posts for own profile
    if (id === currentUser?.id) {
      const { data: savedPostsData } = await supabase
        .from("saved_posts")
        .select(`
          post_id,
          posts(
            *,
            likes(id, user_id),
            profiles(first_name, last_name, profile_image_url, business_name)
          )
        `)
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      setSavedPosts(savedPostsData?.map(sp => sp.posts).filter(Boolean) || []);
    }

    // Load stories
    const { data: storiesData } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    setStories(storiesData || []);

    setLoading(false);
  };

  const handleStartChat = async () => {
    if (!currentUser || !userId) return;

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUser.id);

      if (existingConv && existingConv.length > 0) {
        // Check if any of these conversations also has the other user
        for (const conv of existingConv) {
          const { data: otherParticipant } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.conversation_id)
            .eq("user_id", userId)
            .single();

          if (otherParticipant) {
            navigate(`/chat/${conv.conversation_id}`);
            return;
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: newConv.id, user_id: currentUser.id },
          { conversation_id: newConv.id, user_id: userId },
        ]);

      if (participantsError) throw participantsError;

      navigate(`/chat/${newConv.id}`);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDisplayName = () => {
    if (profile?.first_name) {
      return `${profile.first_name} ${profile.last_name || ""}`.trim();
    }
    return profile?.business_name || "Utente";
  };

  const isOwnProfile = currentUser?.id === (userId || currentUser?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary pb-24">
      {/* Profile Header - Modern Design */}
      <div className="relative">
        {/* Cover gradient */}
        <div className="h-32 bg-gradient-to-br from-primary to-primary/60" />
        
        {/* Profile Info Card */}
        <div className="ios-card mx-4 -mt-16 p-6 relative">
          <div className="flex items-start gap-4">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={profile?.profile_image_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getDisplayName()[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
              {profile?.university && (
                <p className="text-muted-foreground">{profile.university}</p>
              )}
              {profile?.business_description && (
                <p className="text-sm text-muted-foreground mt-1">{profile.business_description}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-around mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{posts.length}</p>
              <p className="text-sm text-muted-foreground">Post</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stories.length}</p>
              <p className="text-sm text-muted-foreground">Storie</p>
            </div>
          </div>

          {!isOwnProfile && (
            <Button
              onClick={handleStartChat}
              className="w-full mt-4 gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Invia messaggio
            </Button>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="mt-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="px-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="posts" className="gap-2">
              <Grid className="w-4 h-4" />
              Post
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved" className="gap-2">
                <Bookmark className="w-4 h-4" />
                Post salvati
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 ios-card">
                <p className="text-muted-foreground">Nessun post ancora</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="aspect-square bg-card rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => post.image_url && setSelectedImage(post.image_url)}
                  >
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted p-2">
                        <p className="text-xs text-muted-foreground line-clamp-3 text-center">
                          {post.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved" className="mt-4">
              {savedPosts.length === 0 ? (
                <div className="text-center py-12 ios-card">
                  <p className="text-muted-foreground">Nessun post salvato ancora</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {savedPosts.map((post: any) => (
                    <div
                      key={post.id}
                      className="aspect-square bg-card rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => post.image_url && setSelectedImage(post.image_url)}
                    >
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted p-2">
                          <p className="text-xs text-muted-foreground line-clamp-3 text-center">
                            {post.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Image Viewer */}
      {selectedImage && (
        <ImageViewer
          open={!!selectedImage}
          onOpenChange={(open) => !open && setSelectedImage(null)}
          imageUrl={selectedImage}
        />
      )}
    </div>
  );
};

export default UserProfile;
