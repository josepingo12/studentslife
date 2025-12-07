import { useEffect, useState } from "react";
import PartnerCard from "./PartnerCard";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Store } from "lucide-react";

interface PartnersListProps {
  category: string;
}

const PartnersList = ({ category }: PartnersListProps) => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, [category]);

  const fetchPartners = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id, business_name, business_address, business_city, profile_image_url, cover_image_url,
        reviews!reviews_partner_id_fkey(rating),
        gallery(image_url)
      `)
      .eq("business_category", category);

    if (!error && data) {
      setPartners(data);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="min-w-[280px] bg-white rounded-[28px] overflow-hidden shadow-xl"
          >
            <div className="h-44 bg-gradient-to-br from-cyan-100 to-blue-100 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-100 rounded-full w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded-full w-full animate-pulse" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="w-4 h-4 bg-gray-100 rounded-full animate-pulse" />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[28px] p-8 text-center shadow-xl"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
          <Store className="w-8 h-8 text-cyan-500" />
        </div>
        <p className="text-gray-500 font-medium">
          No hay socios en esta categoría
        </p>
        <p className="text-gray-400 text-sm mt-1">
          ¡Pronto habrá más opciones!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      <AnimatePresence mode="popLayout">
        {partners.map((partner, index) => (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
          >
            <PartnerCard partner={partner} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PartnersList;