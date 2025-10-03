import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PartnerCard from "./PartnerCard";

interface RecentPartnersProps {
  userId: string;
}

const RecentPartners = ({ userId }: RecentPartnersProps) => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentPartners();
  }, [userId]);

  const loadRecentPartners = async () => {
    setLoading(true);

    // Get most recently viewed partners
    const { data: viewsData } = await supabase
      .from("partner_views")
      .select("partner_id, viewed_at")
      .eq("client_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(20); // Get more to filter duplicates

    if (!viewsData || viewsData.length === 0) {
      setLoading(false);
      return;
    }

    // Get unique partner IDs (most recent view for each)
    const seenPartners = new Set<string>();
    const uniquePartnerIds: string[] = [];

    viewsData.forEach(view => {
      if (!seenPartners.has(view.partner_id)) {
        seenPartners.add(view.partner_id);
        uniquePartnerIds.push(view.partner_id);
      }
    });

    // Take only top 5
    const recentPartnerIds = uniquePartnerIds.slice(0, 5);

      // Fetch partner details with reviews and gallery
      const { data: partnersData } = await supabase
        .from("profiles")
        .select(`
          *,
          reviews!reviews_partner_id_fkey(rating),
          gallery(image_url)
        `)
        .in("id", recentPartnerIds);

    if (partnersData) {
      // Sort partners by the order in recentPartnerIds
      const sortedPartners = recentPartnerIds
        .map(id => partnersData.find(p => p.id === id))
        .filter(Boolean);
      
      setPartners(sortedPartners);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[1, 2, 3].map((i) => (
          <div key={i} className="min-w-[280px] ios-card overflow-hidden animate-pulse">
            <div className="h-40 bg-muted" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (partners.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold mb-4 px-4">Recenti</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide">
        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </div>
    </div>
  );
};

export default RecentPartners;
