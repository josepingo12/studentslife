import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Grid, Bookmark, Camera, Pencil, Users, Home, UserCircle, Plus, Edit2, Settings, Award, Play, Heart } from "lucide-react"; // Added Heart icon
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
import UserVideoFeed from "@/components/social/UserVideoFeed";
import NotificationBadge from "@/components/chat/NotificationBadge"; // Added NotificationBadge
import { useUnreadMessages } from "@/hooks/useUnreadMessages"; // Added useUnreadMessages
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications"; // Added useUnreadNotifications


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
  const [videoFeedOpen, setVideoFeedOpen] = useState(false);
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

  const totalUnread = useUnreadMessages(currentUser?.id); // Initialize useUnreadMessages
  const unreadNotifications = useUnreadNotifications(currentUser?.id); // Initialize useUnreadNotifications

  const { badges, newBadge, setNewBadge, loadUserStats } = useBadges(
    userId || currentUser?.id,
    userRole
  );

  useEffect(() => {
    checkAuth();
  }, [userId]);

  // Handle openPost query parameter to auto-open video
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const openPostId = searchParams.get('openPost');
    
    if (openPostId && posts.length > 0 && !loading) {
      const postToOpen = posts.find(p => p.id === openPostId);
      if (postToOpen) {
        setSelectedPost(postToOpen);
        setVideoFeedOpen(true);
        // Clean up URL
        window.history.replaceState({}, '', location.pathname);
      }
    }
  }, [location.search, posts, loading]);

  useEffect(() => {
    if (currentUser && location.pathname.startsWith('/profile')) {
      loadUserContent(userId || currentUser.id);
    }
  }, [location.pathname, currentUser, userId]);

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

    const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: user.id });
    setUserRole(roleData);

    await loadProfile(userId || user.id);
    await loadUserContent(userId || user.id);

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

    // If viewing own profile, show all posts. If viewing someone else's, show only approved
    const isOwnProfile = id === currentUser?.id;
    
    let postsQuery = supabase
      .from("posts")
      .select(
        `
        *,
        likes(id, user_id),
        public_profiles!posts_user_id_fkey(first_name, last_name, profile_image_url, business_name)
        `
      )
      .eq("user_id", id);
    
    if (!isOwnProfile) {
      postsQuery = postsQuery.eq("status", "approved");
    }
    
    const { data: postsData } = await postsQuery.order("created_at", { ascending: false });

    setPosts(postsData || []);

    if (postsData) {
      const likes = postsData.reduce((acc, post) => acc + (post.likes?.length || 0), 0);
      setTotalLikes(likes);
    }

    if (postsData && postsData.length > 0) {
      const postIds = postsData.map(post => post.id);
      const { count: viewsTotal } = await supabase
        .from("post_views")
        .select("*", { count: "exact", head: true })
        .in("post_id", postIds);
      setTotalViews(viewsTotal || 0);
    }

    if (id === currentUser?.id) {
      const { data: savedPostsData } = await supabase
        .from("saved_posts")
        .select(
          `
          post_id,
          posts(
            *,
            likes(id, user_id),
            profiles(first_name, last_name, profile_image_url, business_name)
          )
          `
        )
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      setSavedPosts(savedPostsData?.map(sp => sp.posts).filter(Boolean) || []);
    }

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
      const { data: existingConv } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUser.id);

      if (existingConv && existingConv.length > 0) {
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

      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user1_id: currentUser.id,
          user2_id: userId
        })
        .select()
        .single();

      if (convError) throw convError;

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

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const currentLikes = post.likes || [];
          if (isLiked) {
            return {
              ...post,
              likes: [...currentLikes, { user_id: currentUser?.id }]
            };
          } else {
            return {
              ...post,
              likes: currentLikes.filter((like: any) => like.user_id !== currentUser?.id)
            };
          }
        }
        return post;
      })
    );
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Profile Header - iOS Minimal Style */}
      <div className="relative">
        {/* Cover Image */}
        <div
          className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 relative group cursor-pointer"
          style={coverImage ? {
            backgroundImage: `url(${coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
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
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarImage src={profile?.profile_image_url} />
              <AvatarFallback className="bg-blue-500 text-white text-2xl">
                {getDisplayName()[0]}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors shadow-lg"
              >
                <Pencil className="w-3 h-3" />
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

          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{getDisplayName()}</h2>
            {isOwnProfile && (
              <button
                onClick={() => navigate('/badges')}
                className="relative group"
                title="I tuoi badge"
              >
                <Award className="w-6 h-6 text-blue-500" />
                {badges.filter(b => b.earned).length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {badges.filter(b => b.earned).length}
                  </div>
                )}
              </button>
            )}
          </div>

          {profile?.university && (
            <p className="text-sm text-gray-600 mb-3">{profile.university}</p>
          )}

          {/* Bio Section */}
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
                    <p className="text-sm text-gray-700 leading-relaxed">{profile.business_description}</p>
                  ) : isOwnProfile ? (
                    <p className="text-xs text-gray-500 italic">Aggiungi una bio al tuo profilo</p>
                  ) : null}
                </div>
                {isOwnProfile && (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium">Modifica Bio</span>
                    </button>
                    <button
                      onClick={() => setSettingsSheetOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium">Impostazioni</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 py-4 border-y border-gray-200 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold">{posts.length}</p>
              <p className="text-xs text-gray-600">{t('profile.posts')}</p>
            </div>
            <button
              onClick={() => setLikesSheetOpen(true)}
              className="text-center hover:opacity-80 transition-opacity"
            >
              <p className="text-xl font-bold">{totalLikes}</p>
              <p className="text-xs text-gray-600">{t('profile.likes')}</p>
            </button>
            <div className="text-center">
              <p className="text-xl font-bold">{totalViews}</p>
              <p className="text-xs text-gray-600">{t('profile.views')}</p>
            </div>
          </div>

          {!isOwnProfile && (
            <Button
              onClick={handleStartChat}
              className="w-full max-w-xs mx-auto gap-2 bg-blue-500 hover:bg-blue-600"
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
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-600">Nessun post ancora</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="aspect-square bg-white rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                    onClick={() => {
                      const isVideoUrl = (url?: string) => !!url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
                      const isVideo = post.media_type === 'video' || isVideoUrl(post.image_url);

                      if (isVideo) {
                        setSelectedPost(post);
                        setVideoFeedOpen(true);
                      } else {
                        setSelectedPost(post);
                        setPostDetailOpen(true);
                      }
                    }}
                  >
                    {(() => {
                      const isVideoUrl = (url?: string) => !!url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
                      if (post.media_type === 'video' && (post.video_url || post.image_url)) {
                        const videoSrc = post.video_url || post.image_url;
                        return (
                          <>
                            <video
                              src={videoSrc}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                              poster=""
                              onLoadedMetadata={(e) => {
                                const video = e.currentTarget;
                                video.currentTime = 0.1;
                              }}
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="bg-white/90 rounded-full p-2">
                                <Play className="w-5 h-5 text-blue-500" />
                              </div>
                            </div>
                          </>
                        );
                      }
                      if (post.image_url) {
                        if (isVideoUrl(post.image_url)) {
                          return (
                            <>
                              <video
                                src={post.image_url}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                                poster=""
                                onLoadedMetadata={(e) => {
                                  const video = e.currentTarget;
                                  video.currentTime = 0.1;
                                }}
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="bg-white/90 rounded-full p-2">
                                  <Play className="w-5 h-5 text-blue-500" />
                                </div>
                              </div>
                            </>
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
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 p-2">
                          <p className="text-xs text-gray-600 line-clamp-3 text-center">
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
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-600">Nessun post salvato ancora</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {savedPosts.map((post: any) => (
                    <div
                      key={post.id}
                      className="aspect-square bg-white rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                      onClick={() => {
                        const isVideoUrl = (url?: string) => !!url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
                        const isVideo = post.media_type === 'video' || isVideoUrl(post.image_url);

                        if (isVideo) {
                          setSelectedPost(post);
                          setVideoFeedOpen(true);
                        } else {
                          setSelectedPost(post);
                          setPostDetailOpen(true);
                        }
                      }}
                    >
                      {(() => {
                        const isVideoUrl = (url?: string) => !!url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
                        if (post.media_type === 'video' && (post.video_url || post.image_url)) {
                          const videoSrc = post.video_url || post.image_url;
                          return (
                            <>
                              <video
                                src={videoSrc}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                                poster=""
                                onLoadedMetadata={(e) => {
                                  const video = e.currentTarget;
                                  video.currentTime = 0.1;
                                }}
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="bg-white/90 rounded-full p-2">
                                  <Play className="w-5 h-5 text-blue-500" />
                                </div>
                              </div>
                            </>
                          );
                        }
                        if (post.image_url) {
                          if (isVideoUrl(post.image_url)) {
                            return (
                              <>
                                <video
                                  src={post.image_url}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                  preload="metadata"
                                  poster=""
                                  onLoadedMetadata={(e) => {
                                    const video = e.currentTarget;
                                    video.currentTime = 0.1;
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="bg-white/90 rounded-full p-2">
                                    <Play className="w-5 h-5 text-blue-500" />
                                  </div>
                                </div>
                              </>
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
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 p-2">
                            <p className="text-xs text-gray-600 line-clamp-3 text-center">
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

      {/* User Video Feed - SOLO VIDEO DI QUESTO UTENTE */}
      <UserVideoFeed
        open={videoFeedOpen}
        onOpenChange={setVideoFeedOpen}
        initialPost={selectedPost}
        userId={userId || currentUser?.id || ""}
        currentUserId={currentUser?.id || ""}
        onLikeToggle={handleLikeToggle}
      />

      {/* Likes Sheet */}
      <LikesSheet
        open={likesSheetOpen}
        onOpenChange={setLikesSheetOpen}
        postIds={posts.map(p => p.id)}
      />

      {/* Bottom Navigation - Updated with modern, rounded, light blue icons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex items-center justify-around h-20 px-4 max-w-md mx-auto">
          <button
            onClick={() => navigate("/client-dashboard")}
            className="flex flex-col items-center gap-1 p-2 rounded-full transition-colors text-gray-500 hover:bg-blue-50"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.social')}</span>
          </button>

          <button
            onClick={() => navigate("/client-dashboard")}
            className="flex flex-col items-center gap-1 p-2 rounded-full transition-colors text-gray-500 hover:bg-blue-50"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.partners')}</span>
          </button>

          {/* Central Upload Button - Now a large circular button with a Plus icon */}
          <button
            onClick={() => setUploadSheetOpen(true)}
            className="relative -mt-6 h-16 w-16 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center hover:bg-blue-600 hover:scale-105 transition-all"
          >
            <Plus className="w-8 h-8" />
          </button>

          <button
            onClick={() => setLikesSheetOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-full transition-colors text-gray-500 relative hover:bg-blue-50"
          >
            <div className="relative">
              <Heart className="w-6 h-6" />
              <NotificationBadge count={unreadNotifications} />
            </div>
            <span className="text-xs font-medium">Notifiche</span>
          </button>

          <button
            onClick={() => navigate("/chats")}
            className="flex flex-col items-center gap-1 p-2 rounded-full transition-colors relative text-gray-500 hover:bg-blue-50"
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              <NotificationBadge count={totalUnread} />
            </div>
            <span className="text-xs font-medium">{t('navigation.chat')}</span>
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
