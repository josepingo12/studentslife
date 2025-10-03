import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import CategoryCarousel from "@/components/client/CategoryCarousel";
import PartnersList from "@/components/client/PartnersList";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user is a client
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary">
      {/* Top Bar */}
      <div className="ios-card mx-4 mt-4 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <button className="transition-transform hover:scale-110">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarImage src={profile.profile_image_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>Impostazioni</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-14 rounded-xl"
                  onClick={() => navigate("/client-profile")}
                >
                  <User className="h-5 w-5" />
                  Profilo
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-14 rounded-xl"
                  onClick={() => navigate("/client-settings")}
                >
                  <Settings className="h-5 w-5" />
                  Cambio Password e Lingua
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-3 h-14 rounded-xl"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  Esci
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div>
            <h2 className="font-bold text-lg">Ciao, {profile.first_name}!</h2>
            <p className="text-sm text-muted-foreground">{profile.university}</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-primary">Students Life</h1>
      </div>

      {/* Category Carousel */}
      <div className="mt-6 px-4">
        <h3 className="text-xl font-bold mb-4">Categorie</h3>
        <CategoryCarousel onSelectCategory={setSelectedCategory} />
      </div>

      {/* Partners List */}
      {selectedCategory && (
        <div className="mt-6 px-4 pb-8">
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
    </div>
  );
};

export default ClientDashboard;
