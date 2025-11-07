import { useNavigate } from "react-router-dom";
import { Star, MapPin } from "lucide-react";

interface PartnerCardProps {
  partner: {
    id: string;
    business_name?: string;
    business_address?: string;
    business_city?: string;
    profile_image_url?: string;
    gallery?: Array<{ image_url: string }>;
    reviews?: Array<{ rating: number }>;
  };
}

const PartnerCard = ({ partner }: PartnerCardProps) => {
  const navigate = useNavigate();

  // Calculate average rating
  const avgRating = partner.reviews && partner.reviews.length > 0
    ? partner.reviews.reduce((sum, r) => sum + r.rating, 0) / partner.reviews.length
    : 0;

  // Get display image - prefer gallery first image, fallback to profile
  const displayImage = partner.gallery?.[0]?.image_url || partner.profile_image_url;

  return (
    <div
      onClick={() => navigate(`/partner/${partner.id}`)}
      // Rimosso hover:scale-[1.02] e transition-transform per un look più pulito e iOS
      className="ios-card overflow-hidden cursor-pointer min-w-[280px]"
    >
      {/* Image */}
      {/* Altezza aumentata a h-48 e angoli superiori arrotondati */}
      <div className="relative h-48 bg-muted overflow-hidden rounded-t-xl">
        {displayImage ? (
          <img
            src={displayImage}
            alt={partner.business_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <span className="text-4xl font-bold text-muted-foreground">
              {partner.business_name?.[0] || "?"}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 pt-3"> {/* Leggermente meno padding top per un layout più compatto */}
        <h3 className="font-bold text-lg mb-1 truncate"> {/* Spazio inferiore ridotto */}
          {partner.business_name || "Partner"}
        </h3>

        {/* Address */}
        {partner.business_address && (
          <div className="flex items-start gap-1 mb-1 text-sm text-gray-500"> {/* Spazio e colore leggermente modificati */}
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {/* Icona leggermente più piccola */}
            <p className="line-clamp-2">
              {partner.business_address}
              {partner.business_city && `, ${partner.business_city}`}
            </p>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2"> {/* Margine superiore aggiunto per separazione */}
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= avgRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300" // Colore stelle vuote più chiaro
              }`}
            />
          ))}
          {partner.reviews && partner.reviews.length > 0 && (
            <span className="text-xs text-gray-500 ml-1"> {/* Dimensione e colore testo recensioni */}
              ({partner.reviews.length})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerCard;
