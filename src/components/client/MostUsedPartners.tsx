import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PartnerCard from "./PartnerCard";

interface MostUsedPartnersProps {
  userId: string;
}

const MostUsedPartners = ({ userId }: MostUsedPartnersProps) => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMostUsed();
  }, [userId]);

  const loadMostUsed = async () => {
    setLoading(true);

    // Get partners with reviews and gallery
    const { data } = await supabase
      .from("profiles")
      .select(`
        *,
        user_roles!inner(role),
        reviews(rating),
        gallery(image_url)
      `)
      .eq("user_roles.role", "partner")
      .limit(10);

    if (data) {
      // Sort by number of reviews (most popular)
      const sorted = data.sort((a, b) => {
        const aReviews = a.reviews?.length || 0;
        const bReviews = b.reviews?.length || 0;
        return bReviews - aReviews;
      });
      
      setPartners(sorted.slice(0, 5));
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
      <h3 className="text-lg font-bold mb-4 px-4">Più utilizzati</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide">
        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </div>
    </div>
  );
};

export default MostUsedPartners;