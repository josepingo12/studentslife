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

    // Get partners from reviews
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("partner_id, created_at")
      .eq("client_id", userId)
      .order("created_at", { ascending: false });

    // Get partners from QR codes
    const { data: qrData } = await supabase
      .from("qr_codes")
      .select(`
        event_id,
        used_at,
        events!inner(partner_id)
      `)
      .eq("client_id", userId)
      .eq("is_used", true)
      .order("used_at", { ascending: false });

    // Combine and get unique partner IDs with their latest interaction
    const partnerInteractions = new Map<string, Date>();

    reviewsData?.forEach(review => {
      const date = new Date(review.created_at);
      if (!partnerInteractions.has(review.partner_id) || 
          date > partnerInteractions.get(review.partner_id)!) {
        partnerInteractions.set(review.partner_id, date);
      }
    });

    qrData?.forEach(qr => {
      const partnerId = qr.events.partner_id;
      const date = new Date(qr.used_at);
      if (!partnerInteractions.has(partnerId) || 
          date > partnerInteractions.get(partnerId)!) {
        partnerInteractions.set(partnerId, date);
      }
    });

    // Sort by most recent interaction
    const sortedPartnerIds = Array.from(partnerInteractions.entries())
      .sort((a, b) => b[1].getTime() - a[1].getTime())
      .slice(0, 5)
      .map(entry => entry[0]);

    if (sortedPartnerIds.length > 0) {
      // Fetch partner details with reviews and gallery
      const { data: partnersData } = await supabase
        .from("profiles")
        .select(`
          *,
          reviews(rating),
          gallery(image_url)
        `)
        .in("id", sortedPartnerIds);

      if (partnersData) {
        // Sort partners by the order in sortedPartnerIds
        const sortedPartners = sortedPartnerIds
          .map(id => partnersData.find(p => p.id === id))
          .filter(Boolean);
        
        setPartners(sortedPartners);
      }
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
