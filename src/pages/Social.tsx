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
import SettingsSheet from "@/components/partner/SettingsSheet";
import { useTranslation } from "react-i18next";

const Social = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false); // AGGIUNGI QUESTO STATO

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
      .eq("status", "approved")
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-[470px] mx-auto w-full">
        {/* Header */}
        <div className="bg-white mx-4 mt-4 p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            {/* Avatar a sinistra invece del tasto impostazioni */}
            <button
              onClick={() => setSettingsSheetOpen(true)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.profile_image_url} />
                <AvatarFallback className="bg-blue-500 text-white">
                  {getDisplayName(profile)[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>

            <h1 className="text-2xl font-bold text-blue-600">Students Life Social</h1>

            <div className="w-10" />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t("search.users")}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10 border-gray-200 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {searching ? (
                <p className="text-sm text-gray-500 text-center py-4">{t("search.searching")}</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">{t("search.noUsersFound")}</p>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      navigate(`/profile/${result.id}`);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={result.profile_image_url} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {getDisplayName(result)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-semibold">{getDisplayName(result)}</p>
                      {result.first_name && result.business_name && (
                        <p className="text-xs text-gray-500">{result.business_name}</p>
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
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-600">Nessun post ancora. Sii il primo a postare!</p>
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

      {/* Settings Sheet */}
      <SettingsSheet
        open={settingsSheetOpen}
        onOpenChange={setSettingsSheetOpen}
      />
    </div>
  );
};

export default Social;