import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Star, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PartnersListProps {
  category: string;
}

const PartnersList = ({ category }: PartnersListProps) => {
  const navigate = useNavigate();
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
        *,
        user_roles!inner(role),
        reviews(rating)
      `)
      .eq("business_category", category)
      .eq("user_roles.role", "partner");

    if (!error && data) {
      // Calculate average rating for each partner
      const partnersWithRatings = data.map((partner) => {
        const ratings = partner.reviews || [];
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
          : 0;
        return {
          ...partner,
          avgRating: avgRating.toFixed(1),
          reviewCount: ratings.length,
        };
      });
      setPartners(partnersWithRatings);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="ios-card p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-muted rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
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
    <div className="space-y-4">
      {partners.map((partner) => (
        <button
          key={partner.id}
          onClick={() => navigate(`/partner/${partner.id}`)}
          className="ios-card p-4 w-full text-left transition-all hover:scale-102 hover:shadow-lg"
        >
          <div className="flex gap-4">
            <Avatar className="w-20 h-20 border-2 border-border">
              <AvatarImage src={partner.profile_image_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {partner.business_name?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h4 className="font-bold text-lg mb-1">{partner.business_name}</h4>
              
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{partner.avgRating}</span>
                <span className="text-sm text-muted-foreground">
                  ({partner.reviewCount} recensioni)
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MapPin className="w-4 h-4" />
                <span>{partner.business_city}</span>
              </div>

              {partner.business_phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{partner.business_phone}</span>
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default PartnersList;
