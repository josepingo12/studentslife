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
      className="ios-card overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform min-w-[280px]"
    >
      {/* Image */}
      <div className="relative h-40 bg-muted overflow-hidden">
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
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 truncate">
          {partner.business_name || "Partner"}
        </h3>

        {/* Address */}
        {partner.business_address && (
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground line-clamp-2">
              {partner.business_address}
              {partner.business_city && `, ${partner.business_city}`}
            </p>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= avgRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
          {partner.reviews && partner.reviews.length > 0 && (
            <span className="text-sm text-muted-foreground ml-1">
              ({partner.reviews.length})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerCard;