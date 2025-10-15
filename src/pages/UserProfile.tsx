import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Grid, Bookmark, Camera, Pencil, Users, Home, UserCircle, Plus, Edit2, Settings, Award } from "lucide-react";
import { useBadges } from "@/hooks/useBadges";
import { BadgeAnimation } from "@/components/gamification/BadgeAnimation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import PostDetailModal from "@/components/social/PostDetailModal";
import UploadSheet from "@/components/shared/UploadSheet";
import { Textarea } from "@/components/ui/textarea";
import SettingsSheet from "@/components/partner/SettingsSheet";
import { useTranslation } from "react-i18next";
import LikesSheet from "@/components/social/LikesSheet";

const UserProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postDetailOpen, setPostDetailOpen] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [likesSheetOpen, setLikesSheetOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { badges, newBadge, setNewBadge, loadUserStats } = useBadges(
    userId || currentUser?.id,
    userRole
  );

  useEffect(() => {
    checkAuth();
  }, [userId]);

  // Reload data when navigating to profile page (ensures likes/views are fresh)
  useEffect(() => {
    if (currentUser && location.pathname.startsWith('/profile')) {
      loadUserContent(userId || currentUser.id);
    }
  }, [location.pathname, currentUser, userId]);

  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        loadUserContent(userId || currentUser.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser, userId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/login");
      return;
    }

    setCurrentUser(user);
    
    // Get user role
    const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: user.id });
    setUserRole(roleData);
    
    await loadProfile(userId || user.id);
    await loadUserContent(userId || user.id);
    
    // Track access for gamification (only for own profile)
    if (!userId || userId === user.id) {
      await trackAccess(user.id);
    }
  };

  const trackAccess = async (userId: string) => {
    try {
      const { data: stats } = await supabase
        .from('user_stats')
        .select('total_accesses')
        .eq('user_id', userId)
        .single();

      if (stats) {
        await supabase
          .from('user_stats')
          .update({ total_accesses: (stats.total_accesses || 0) + 1 })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_stats')
          .insert({ user_id: userId, total_accesses: 1 });
      }
      
      await loadUserStats();
    } catch (error) {
      console.error('Error tracking access:', error);
    }
  };

  const loadProfile = async (id: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    setProfile(data);
    setCoverImage(data?.cover_image_url || null);
    setBioText(data?.business_description || "");
  };

  const handleBioSave = async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ business_description: bioText.trim() })
        .eq('id', currentUser.id);

      if (error) throw error;

      setProfile({ ...profile, business_description: bioText.trim() });
      setIsEditingBio(false);
      toast({ title: "Bio aggiornata" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${currentUser.id}/cover-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_image_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setCoverImage(publicUrl);
      toast({ title: "Copertina aggiornata" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${currentUser.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, profile_image_url: publicUrl });
      toast({ title: "Immagine profilo aggiornata" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  const loadUserContent = async (id: string) => {
    setLoading(true);

    // Load posts
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        likes(id, user_id),
        public_profiles!posts_user_id_fkey(first_name, last_name, profile_image_url, business_name)
      `)
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    setPosts(postsData || []);

    // Count total likes on user's posts
    if (postsData) {
      const likes = postsData.reduce((acc, post) => acc + (post.likes?.length || 0), 0);
      setTotalLikes(likes);
    }

    // Count total views on user's posts
    if (postsData && postsData.length > 0) {
      const postIds = postsData.map(post => post.id);
      const { count: viewsTotal } = await supabase
        .from("post_views")
        .select("*", { count: "exact", head: true })
        .in("post_id", postIds);
      setTotalViews(viewsTotal || 0);
    }

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
        {/* Cover Image/Gradient with Upload */}
        <div 
          className="h-32 bg-gradient-to-br from-primary to-primary/60 relative group cursor-pointer"
          style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          onClick={() => isOwnProfile && coverInputRef.current?.click()}
        >
          {isOwnProfile && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
        
        {/* Avatar and Info */}
        <div className="px-4 -mt-12 text-center">
          <div className="relative inline-block mb-3">
            <Avatar className="h-28 w-28 border-4 border-background">
              <AvatarImage src={profile?.profile_image_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {getDisplayName()[0]}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2.5 rounded-full hover:bg-primary/90 transition-colors shadow-lg"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />

          <div className="flex items-center justify-center gap-3">
            <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
            {isOwnProfile && (
              <button
                onClick={() => navigate('/badges')}
                className="relative group animate-pulse hover:animate-none"
                title="I tuoi badge"
              >
                <Award className="w-7 h-7 text-primary drop-shadow-lg" />
                {badges.filter(b => b.earned).length > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-bounce">
                    {badges.filter(b => b.earned).length}
                  </div>
                )}
              </button>
            )}
          </div>
          
          {profile?.university && (
            <p className="text-sm text-muted-foreground mb-2">{profile.university}</p>
          )}

          {/* Bio - Always show, even if empty for own profile */}
          <div className="max-w-sm mx-auto mb-4 px-4">
            {isEditingBio && isOwnProfile ? (
              <div className="space-y-2">
                <Textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  placeholder="Scrivi qualcosa su di te..."
                  className="resize-none text-sm"
                  rows={3}
                  maxLength={150}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleBioSave}>Salva</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setIsEditingBio(false);
                    setBioText(profile?.business_description || "");
                  }}>Annulla</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  {profile?.business_description ? (
                    <p className="text-sm text-foreground/80 leading-relaxed">{profile.business_description}</p>
                  ) : isOwnProfile ? (
                    <p className="text-xs text-muted-foreground italic">Aggiungi una bio al tuo profilo</p>
                  ) : null}
                </div>
                {isOwnProfile && (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium">Modifica Bio</span>
                    </button>
                    <button
                      onClick={() => setSettingsSheetOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium">Impostazioni</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 py-4 border-y border-border/50 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold">{posts.length}</p>
              <p className="text-xs text-muted-foreground">{t('profile.posts')}</p>
            </div>
            <button 
              onClick={() => setLikesSheetOpen(true)}
              className="text-center hover:opacity-80 transition-opacity"
            >
              <p className="text-xl font-bold">{totalLikes}</p>
              <p className="text-xs text-muted-foreground">{t('profile.likes')}</p>
            </button>
            <div className="text-center">
              <p className="text-xl font-bold">{totalViews}</p>
              <p className="text-xs text-muted-foreground">{t('profile.views')}</p>
            </div>

          </div>

          {!isOwnProfile && (
            <Button
              onClick={handleStartChat}
              className="w-full max-w-xs mx-auto gap-2"
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
                    onClick={() => {
                      setSelectedPost(post);
                      setPostDetailOpen(true);
                    }}
                  >
                      {(() => {
                        const isVideoUrl = (url?: string) => !!url && /(\.mp4|\.webm|\.ogg)(\?.*)?$/i.test(url);
                        if (posts && post.media_type === 'video' && (post.video_url || post.image_url)) {
                          return (
                            <video src={post.video_url || post.image_url} className="w-full h-full object-cover" muted playsInline />
                          );
                        }
                        if (post.image_url) {
                          if (isVideoUrl(post.image_url)) {
                            return (
                              <video src={post.image_url} className="w-full h-full object-cover" muted playsInline />
                            );
                          }
                          return (
                            <img
                              src={post.image_url}
                              alt="Post"
                              className="w-full h-full object-cover"
                            />
                          );
                        }
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-muted p-2">
                            <p className="text-xs text-muted-foreground line-clamp-3 text-center">
                              {post.content}
                            </p>
                          </div>
                        );
                      })()}
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
                      onClick={() => {
                        setSelectedPost(post);
                        setPostDetailOpen(true);
                      }}
                    >
                      {(() => {
                        const isVideoUrl = (url?: string) => !!url && /(\.mp4|\.webm|\.ogg)(\?.*)?$/i.test(url);
                        if (post.media_type === 'video' && (post.video_url || post.image_url)) {
                          return (
                            <video src={post.video_url || post.image_url} className="w-full h-full object-cover" muted playsInline />
                          );
                        }
                        if (post.image_url) {
                          if (isVideoUrl(post.image_url)) {
                            return (
                              <video src={post.image_url} className="w-full h-full object-cover" muted playsInline />
                            );
                          }
                          return (
                            <img
                              src={post.image_url}
                              alt="Post"
                              className="w-full h-full object-cover"
                            />
                          );
                        }
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-muted p-2">
                            <p className="text-xs text-muted-foreground line-clamp-3 text-center">
                              {post.content}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Post Detail Modal */}
      <PostDetailModal
        open={postDetailOpen}
        onOpenChange={setPostDetailOpen}
        post={selectedPost}
        currentUserId={currentUser?.id || ""}
      />

      {/* Likes Sheet */}
      <LikesSheet
        open={likesSheetOpen}
        onOpenChange={setLikesSheetOpen}
        postIds={posts.map(p => p.id)}
      />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-between h-20 px-4 max-w-md mx-auto">
          <button
            onClick={() => navigate("/client-dashboard")}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.social')}</span>
          </button>
          
          <button
            onClick={() => navigate("/client-dashboard")}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.partners')}</span>
          </button>

          {/* Central Upload Button */}
          <button
            onClick={() => setUploadSheetOpen(true)}
            className="relative -mt-6 bg-gradient-to-br from-primary to-primary/80 rounded-full p-4 shadow-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-8 h-8 text-white" />
          </button>

          <button
            onClick={() => navigate("/chats")}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.chat')}</span>
          </button>
          
          <button
            className="flex flex-col items-center gap-1 text-primary transition-colors"
          >
            <UserCircle className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.profile')}</span>
          </button>
        </div>
      </div>

      {/* Upload Sheet */}
      <UploadSheet
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
        userId={currentUser?.id || ""}
        onUploadComplete={() => {
          loadUserContent(userId || currentUser?.id || "");
        }}
      />

      {/* Settings Sheet */}
      <SettingsSheet
        open={settingsSheetOpen}
        onOpenChange={setSettingsSheetOpen}
      />

      {/* Badge Animation */}
      <BadgeAnimation badge={newBadge} onClose={() => setNewBadge(null)} />
    </div>
  );
};

export default UserProfile;
