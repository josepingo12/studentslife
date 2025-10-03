import { useEffect, useState } from "react";
import PartnerCard from "./PartnerCard";
import { supabase } from "@/integrations/supabase/client";

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

    console.log('Fetching partners for category:', category);

    // Get partner user IDs from user_roles
    const { data: partnerRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "partner");

    const partnerIds = partnerRoles?.map(r => r.user_id) || [];

    if (partnerIds.length === 0) {
      setPartners([]);
      setLoading(false);
      return;
    }

    // Fetch profiles matching category and partner role
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        reviews(rating),
        gallery(image_url)
      `)
      .eq("business_category", category)
      .in("id", partnerIds);

    console.log('Partners query result:', { data, error, category });

    if (!error && data) {
      setPartners(data);
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
    return (
      <div className="ios-card p-8 text-center">
        <p className="text-muted-foreground">
          Nessun partner disponibile in questa categoria
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {partners.map((partner) => (
        <PartnerCard key={partner.id} partner={partner} />
      ))}
    </div>
  );
};

export default PartnersList;
