import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { it } from "date-fns/locale";

interface UserDetailChartProps {
  userId: string;
  userName: string;
  userRole: "partner" | "client";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChartData {
  date: string;
  qr_codes: number;
  accesses: number;
  events?: number;
}

const UserDetailChart = ({ userId, userName, userRole, open, onOpenChange }: UserDetailChartProps) => {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchChartData();
    }
  }, [open, timeRange, userId]);

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "daily":
        return { start: subDays(now, 30), end: now, format: "dd MMM" };
      case "weekly":
        return { start: subMonths(now, 3), end: now, format: "'W'w yyyy" };
      case "monthly":
        return { start: subMonths(now, 12), end: now, format: "MMM yyyy" };
      case "yearly":
        return { start: new Date(now.getFullYear() - 5, 0, 1), end: now, format: "yyyy" };
      default:
        return { start: subDays(now, 30), end: now, format: "dd MMM" };
    }
  };

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // Fetch QR codes data
      let qrQuery = supabase
        .from("qr_codes")
        .select("created_at, is_used")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (userRole === "client") {
        qrQuery = qrQuery.eq("client_id", userId);
      } else {
        // For partners, we need to join with events
        const { data: events } = await supabase
          .from("events")
          .select("id")
          .eq("partner_id", userId);
        
        const eventIds = events?.map(e => e.id) || [];
        qrQuery = qrQuery.in("event_id", eventIds);
      }

      const { data: qrData } = await qrQuery;

      // Fetch access logs
      const { data: accessData } = await supabase
        .from("access_logs")
        .select("accessed_at")
        .eq("user_id", userId)
        .gte("accessed_at", start.toISOString())
        .lte("accessed_at", end.toISOString());

      // Fetch events for partners
      let eventsData = null;
      if (userRole === "partner") {
        const { data } = await supabase
          .from("events")
          .select("created_at")
          .eq("partner_id", userId)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString());
        eventsData = data;
      }

      // Group data by time range
      const grouped: Record<string, ChartData> = {};
      const dateFormat = getDateRange().format;

      // Initialize all dates in range
      const current = new Date(start);
      while (current <= end) {
        const key = format(current, dateFormat, { locale: it });
        grouped[key] = { date: key, qr_codes: 0, accesses: 0, events: 0 };
        
        switch (timeRange) {
          case "daily":
            current.setDate(current.getDate() + 1);
            break;
          case "weekly":
            current.setDate(current.getDate() + 7);
            break;
          case "monthly":
            current.setMonth(current.getMonth() + 1);
            break;
          case "yearly":
            current.setFullYear(current.getFullYear() + 1);
            break;
        }
      }

      // Group QR codes
      qrData?.forEach((qr) => {
        const date = format(new Date(qr.created_at), dateFormat, { locale: it });
        if (grouped[date]) {
          grouped[date].qr_codes++;
        }
      });

      // Group accesses
      accessData?.forEach((access) => {
        const date = format(new Date(access.accessed_at), dateFormat, { locale: it });
        if (grouped[date]) {
          grouped[date].accesses++;
        }
      });

      // Group events
      eventsData?.forEach((event) => {
        const date = format(new Date(event.created_at), dateFormat, { locale: it });
        if (grouped[date]) {
          grouped[date].events = (grouped[date].events || 0) + 1;
        }
      });

      setChartData(Object.values(grouped));
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Statistiche Dettagliate - {userName}</DialogTitle>
        </DialogHeader>

        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily">Giornaliero</TabsTrigger>
            <TabsTrigger value="weekly">Settimanale</TabsTrigger>
            <TabsTrigger value="monthly">Mensile</TabsTrigger>
            <TabsTrigger value="yearly">Annuale</TabsTrigger>
          </TabsList>

          <TabsContent value={timeRange} className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>QR Code Generati</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="qr_codes" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Accessi alla Piattaforma</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="accesses" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {userRole === "partner" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Eventi Creati</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="events" stroke="hsl(var(--accent))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailChart;
