import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, QrCode, Calendar, TrendingUp } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalPartners: number;
  totalClients: number;
  totalQRCodes: number;
  usedQRCodes: number;
  recentAccesses: number;
  qrByPartner: { business_name: string; qr_count: number }[];
}

const Statistics = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPartners: 0,
    totalClients: 0,
    totalQRCodes: 0,
    usedQRCodes: 0,
    recentAccesses: 0,
    qrByPartner: [],
  });
  const [loading, setLoading] = useState(true);

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

      // QR codes by partner
      const { data: qrByPartnerData } = await supabase
        .from("qr_codes")
        .select(`
          event_id,
          events!inner (
            partner_id,
            profiles!inner (
              business_name
            )
          )
        `);

      const partnerQRCount: Record<string, number> = {};
      qrByPartnerData?.forEach((qr: any) => {
        const businessName = qr.events.profiles.business_name || "N/A";
        partnerQRCount[businessName] = (partnerQRCount[businessName] || 0) + 1;
      });

      const qrByPartner = Object.entries(partnerQRCount)
        .map(([business_name, qr_count]) => ({ business_name, qr_count }))
        .sort((a, b) => b.qr_count - a.qr_count)
        .slice(0, 5);

      setStats({
        totalUsers: totalUsers || 0,
        totalPartners: totalPartners || 0,
        totalClients: totalClients || 0,
        totalQRCodes: totalQRCodes || 0,
        usedQRCodes: usedQRCodes || 0,
        recentAccesses: recentAccesses || 0,
        qrByPartner,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Caricamento statistiche...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Statistiche</h2>

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

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Partner per QR Code Scaricati</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.qrByPartner.map((partner, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="font-medium">{partner.business_name}</span>
                <Badge className="bg-primary">{partner.qr_count} QR</Badge>
              </div>
            ))}
            {stats.qrByPartner.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessun dato disponibile</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistics;
