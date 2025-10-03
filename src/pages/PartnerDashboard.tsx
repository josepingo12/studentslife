import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus, QrCode, BarChart3, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PartnerGalleryManager from "@/components/partner/PartnerGalleryManager";
import PartnerEventsManager from "@/components/partner/PartnerEventsManager";
import QRScanner from "@/components/partner/QRScanner";
import PartnerStats from "@/components/partner/PartnerStats";
import PartnerProfileEdit from "@/components/partner/PartnerProfileEdit";

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("events");

  useEffect(() => {
    checkAuth();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary pb-8">
      {/* Header */}
      <div className="ios-card mx-4 mt-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Students Life</h1>
            <p className="text-muted-foreground">{profile.business_name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/social")}
              className="rounded-full"
            >
              <Users className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              className="rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-card rounded-xl">
            <TabsTrigger value="events" className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl">
              <Plus className="w-5 h-5" />
              <span className="text-xs">Eventi</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl">
              <Plus className="w-5 h-5" />
              <span className="text-xs">Gallery</span>
            </TabsTrigger>
            <TabsTrigger value="scanner" className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl">
              <QrCode className="w-5 h-5" />
              <span className="text-xs">Scanner</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl">
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Statistiche</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl">
              <User className="w-5 h-5" />
              <span className="text-xs">Profilo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <PartnerEventsManager partnerId={user.id} />
          </TabsContent>

          <TabsContent value="gallery">
            <PartnerGalleryManager partnerId={user.id} />
          </TabsContent>

          <TabsContent value="scanner">
            <QRScanner partnerId={user.id} />
          </TabsContent>

          <TabsContent value="stats">
            <PartnerStats partnerId={user.id} />
          </TabsContent>

          <TabsContent value="profile">
            <PartnerProfileEdit profile={profile} onUpdate={checkAuth} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PartnerDashboard;
