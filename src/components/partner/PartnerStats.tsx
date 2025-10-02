import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Download, Calendar, Star } from "lucide-react";

interface PartnerStatsProps {
  partnerId: string;
}

const PartnerStats = ({ partnerId }: PartnerStatsProps) => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalQRDownloads: 0,
    totalQRUsed: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Get events stats
    const { data: events } = await supabase
      .from("events")
      .select("id, is_active, end_date")
      .eq("partner_id", partnerId);

    const totalEvents = events?.length || 0;
    const now = new Date();
    const activeEvents = events?.filter(
      (e) => e.is_active && new Date(e.end_date) > now
    ).length || 0;

    // Get QR codes stats
    const { data: qrCodes } = await supabase
      .from("qr_codes")
      .select(`
        id,
        is_used,
        events!inner(partner_id)
      `)
      .eq("events.partner_id", partnerId);

    const totalQRDownloads = qrCodes?.length || 0;
    const totalQRUsed = qrCodes?.filter((qr) => qr.is_used).length || 0;

    // Get reviews stats
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("partner_id", partnerId);

    const totalReviews = reviews?.length || 0;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    setStats({
      totalEvents,
      activeEvents,
      totalQRDownloads,
      totalQRUsed,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="ios-card p-4 animate-pulse">
            <div className="h-12 bg-muted rounded mb-2" />
            <div className="h-6 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      icon: Calendar,
      label: "Eventi Attivi",
      value: `${stats.activeEvents}/${stats.totalEvents}`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Download,
      label: "QR Scaricati",
      value: stats.totalQRDownloads,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: BarChart3,
      label: "QR Utilizzati",
      value: stats.totalQRUsed,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Star,
      label: "Valutazione Media",
      value: `${stats.averageRating} (${stats.totalReviews})`,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="ios-card p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Statistiche Partner</h2>
        <p className="text-muted-foreground">
          Monitora le performance della tua attività
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="ios-card p-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="ios-card p-6">
        <h3 className="font-bold mb-4">Tasso di Utilizzo</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>QR Utilizzati</span>
              <span className="font-semibold">
                {stats.totalQRDownloads > 0
                  ? Math.round((stats.totalQRUsed / stats.totalQRDownloads) * 100)
                  : 0}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{
                  width: `${
                    stats.totalQRDownloads > 0
                      ? (stats.totalQRUsed / stats.totalQRDownloads) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerStats;
