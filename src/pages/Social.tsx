import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWebNotifications } from "@/hooks/useWebNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, X } from "lucide-react";
import StoriesCarousel from "@/components/social/StoriesCarousel";
import CreatePost from "@/components/social/CreatePost";
import PostCard from "@/components/social/PostCard";

const Social = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Abilita notifiche web
  useWebNotifications({ userId: user?.id });

  useEffect(() => {
    checkAuth();
    loadPosts();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
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
    setLoading(true);
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        public_profiles!posts_user_id_fkey(first_name, last_name, profile_image_url, business_name),
        likes(id, user_id)
      `)
      .order("created_at", { ascending: false });

    setPosts(postsData || []);
    setLoading(false);
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, business_name, profile_image_url")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,business_name.ilike.%${query}%`)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  };

  const getDisplayName = (profile: any) => {
    if (profile.first_name) {
      return `${profile.first_name} ${profile.last_name || ""}`.trim();
    }
    return profile.business_name || "Utente";
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary pb-20">
      <div className="max-w-[470px] mx-auto w-full">
        {/* Header */}
        <div className="ios-card mx-4 mt-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-primary">Students Life Social</h1>
          <div className="w-10" />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cerca utenti..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {searching ? (
              <p className="text-sm text-muted-foreground text-center py-4">Ricerca...</p>
            ) : searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nessun utente trovato</p>
            ) : (
              searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    navigate(`/profile/${result.id}`);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={result.profile_image_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getDisplayName(result)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-semibold">{getDisplayName(result)}</p>
                    {result.first_name && result.business_name && (
                      <p className="text-xs text-muted-foreground">{result.business_name}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

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
        {loading ? (
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
      </div>
    </div>
  );
};

export default Social;
