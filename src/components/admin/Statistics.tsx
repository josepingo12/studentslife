import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, QrCode, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import UserDetailChart from "./UserDetailChart";

interface UserData {
  id: string;
  business_name?: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  qr_count: number;
  used_count?: number;
  total_count?: number;
  last_access?: string;
  role: "partner" | "client";
}

interface Stats {
  totalUsers: number;
  totalPartners: number;
  totalClients: number;
  totalQRCodes: number;
  usedQRCodes: number;
  recentAccesses: number;
  allPartners: UserData[];
  allClients: UserData[];
}

const Statistics = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPartners: 0,
    totalClients: 0,
    totalQRCodes: 0,
    usedQRCodes: 0,
    recentAccesses: 0,
    allPartners: [],
    allClients: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; role: "partner" | "client" } | null>(null);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string>("");

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Total partners
      const { count: totalPartners } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "partner");

      // Total clients
      const { count: totalClients } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "client");

      // QR codes stats
      const { count: totalQRCodes } = await supabase
        .from("qr_codes")
        .select("*", { count: "exact", head: true });

      const { count: usedQRCodes } = await supabase
        .from("qr_codes")
        .select("*", { count: "exact", head: true })
        .eq("is_used", true);

      // Recent accesses (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentAccesses } = await supabase
        .from("access_logs")
        .select("*", { count: "exact", head: true })
        .gte("accessed_at", sevenDaysAgo.toISOString());

      // Get all partners
      const { data: partnerRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "partner");

      const allPartners: UserData[] = [];
      for (const partnerRole of partnerRoles || []) {
        const partnerId = partnerRole.user_id;
        
        // Get profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_name, profile_image_url")
          .eq("id", partnerId)
          .single();
        
        // Get events for this partner
        const { data: events } = await supabase
          .from("events")
          .select("id")
          .eq("partner_id", partnerId);
        
        const eventIds = events?.map(e => e.id) || [];
        
        // Get QR codes count
        const { data: qrCodes } = await supabase
          .from("qr_codes")
          .select("is_used")
          .in("event_id", eventIds);
        
        const qr_count = qrCodes?.length || 0;
        const used_count = qrCodes?.filter(qr => qr.is_used).length || 0;
        
        // Get last access
        const { data: lastAccess } = await supabase
          .from("access_logs")
          .select("accessed_at")
          .eq("user_id", partnerId)
          .order("accessed_at", { ascending: false })
          .limit(1)
          .single();
        
        allPartners.push({
          id: partnerId,
          business_name: profile?.business_name || "N/A",
          profile_image_url: profile?.profile_image_url || undefined,
          qr_count,
          used_count,
          total_count: qr_count,
          last_access: lastAccess?.accessed_at,
          role: "partner"
        });
      }

      // Get all clients
      const { data: clientRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "client");

      const allClients: UserData[] = [];
      for (const clientRole of clientRoles || []) {
        const clientId = clientRole.user_id;
        
        // Get profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, profile_image_url")
          .eq("id", clientId)
          .single();
        
        // Get QR codes count
        const { data: qrCodes } = await supabase
          .from("qr_codes")
          .select("is_used")
          .eq("client_id", clientId);
        
        const qr_count = qrCodes?.length || 0;
        
        // Get last access
        const { data: lastAccess } = await supabase
          .from("access_logs")
          .select("accessed_at")
          .eq("user_id", clientId)
          .order("accessed_at", { ascending: false })
          .limit(1)
          .single();
        
        allClients.push({
          id: clientId,
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          profile_image_url: profile?.profile_image_url || undefined,
          qr_count,
          last_access: lastAccess?.accessed_at,
          role: "client"
        });
      }

      setStats({
        totalUsers: totalUsers || 0,
        totalPartners: totalPartners || 0,
        totalClients: totalClients || 0,
        totalQRCodes: totalQRCodes || 0,
        usedQRCodes: usedQRCodes || 0,
        recentAccesses: recentAccesses || 0,
        allPartners: allPartners.sort((a, b) => b.qr_count - a.qr_count),
        allClients: allClients.sort((a, b) => b.qr_count - a.qr_count),
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = stats.allPartners.filter(p => 
    (p.business_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = stats.allClients.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastAccess = (date?: string) => {
    if (!date) return "Mai";
    const d = new Date(date);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    setTestEmailResult("");
    
    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { to_email: 'stud3nts1ife.info@gmail.com' }
      });

      if (error) {
        setTestEmailResult(`❌ Errore: ${error.message}`);
        console.error('Test email error:', error);
      } else if (data?.success) {
        setTestEmailResult(data.message || '✅ Email di test inviata con successo!');
        console.log('Test email result:', data);
      } else {
        setTestEmailResult(`❌ ${data?.error || 'Errore sconosciuto'}`);
      }
    } catch (err: any) {
      setTestEmailResult(`❌ Errore: ${err.message}`);
      console.error('Test email exception:', err);
    } finally {
      setTestEmailLoading(false);
    }
  };

  if (loading) {
    return <div>Caricamento statistiche...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Statistiche</h2>
        
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <Button 
            onClick={handleTestEmail}
            disabled={testEmailLoading}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {testEmailLoading ? "Invio in corso..." : "🧪 Testa Email"}
          </Button>
          
          {testEmailResult && (
            <div className={`text-sm p-3 rounded-lg ${
              testEmailResult.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {testEmailResult}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPartners}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clienti</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Code Totali</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQRCodes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Code Usati</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usedQRCodes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalQRCodes > 0
                ? `${((stats.usedQRCodes / stats.totalQRCodes) * 100).toFixed(1)}% utilizzati`
                : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accessi (7gg)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentAccesses}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tutti i Partner</CardTitle>
            <Input
              placeholder="Cerca partner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-2"
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredPartners.map((partner) => (
                <div key={partner.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar>
                      <AvatarImage src={partner.profile_image_url} />
                      <AvatarFallback>{partner.business_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{partner.business_name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{partner.qr_count} QR generati</span>
                        <span>•</span>
                        <span>{partner.used_count} utilizzati</span>
                        <span>•</span>
                        <span>Ultimo: {formatLastAccess(partner.last_access)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedUser({ 
                      id: partner.id, 
                      name: partner.business_name || "Partner", 
                      role: "partner" 
                    })}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {filteredPartners.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nessun partner trovato</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tutti i Clienti</CardTitle>
            <Input
              placeholder="Cerca clienti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-2"
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar>
                      <AvatarImage src={client.profile_image_url} />
                      <AvatarFallback>
                        {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{client.first_name} {client.last_name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{client.qr_count} QR generati</span>
                        <span>•</span>
                        <span>Ultimo: {formatLastAccess(client.last_access)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedUser({ 
                      id: client.id, 
                      name: `${client.first_name} ${client.last_name}`, 
                      role: "client" 
                    })}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {filteredClients.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nessun cliente trovato</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedUser && (
        <UserDetailChart
          userId={selectedUser.id}
          userName={selectedUser.name}
          userRole={selectedUser.role}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export default Statistics;
