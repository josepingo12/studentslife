import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PartnerCard from "./PartnerCard";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";

interface RecentPartnersProps {
  userId: string;
}

const RecentPartners = ({ userId }: RecentPartnersProps) => {
  const { t } = useTranslation();
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
      .limit(20);

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
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-24 h-6 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="min-w-[140px] bg-white rounded-[24px] p-3 shadow-lg"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded-full w-3/4 mx-auto mt-3 animate-pulse" />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (partners.length === 0) {
    return null;
  }

  return (
    <div className="px-4 mb-6">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Recientes</h3>
        </div>
        <button className="flex items-center gap-1 text-cyan-600 font-semibold text-sm hover:text-cyan-700 transition-colors">
          Ver todos
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Compact Partner Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {partners.map((partner, index) => (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
          >
            <PartnerCard partner={partner} compact />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecentPartners;