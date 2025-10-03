import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, Phone, Star, Calendar, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PartnerGallery from "@/components/client/PartnerGallery";
import PartnerEvents from "@/components/client/PartnerEvents";
import PartnerReviews from "@/components/client/PartnerReviews";

const PartnerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPartnerDetails();
    }
  }, [id]);

  const fetchPartnerDetails = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        reviews!reviews_partner_id_fkey(rating, comment, created_at, profiles!reviews_client_id_fkey(first_name, last_name))
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i dettagli del partner",
        variant: "destructive",
      });
      navigate("/client-dashboard");
      return;
    }

    // Calculate average rating
    const ratings = data.reviews || [];
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
      : 0;

    setPartner({
      ...data,
      avgRating: avgRating.toFixed(1),
      reviewCount: ratings.length,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!partner) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary pb-8">
      {/* Header */}
      <div className="ios-card mx-4 mt-4 p-4">
        <button
          onClick={() => navigate("/client-dashboard")}
          className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Indietro</span>
        </button>

        <div className="flex gap-4 items-start">
          <Avatar className="w-24 h-24 border-4 border-primary">
            <AvatarImage src={partner.profile_image_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {partner.business_name?.[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{partner.business_name}</h1>
            
            <div className="flex items-center gap-1 mb-3">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-lg">{partner.avgRating}</span>
              <span className="text-sm text-muted-foreground">
                ({partner.reviewCount} recensioni)
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {partner.business_address}, {partner.business_city}
                </span>
              </div>

              {partner.business_phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <a
                    href={`tel:${partner.business_phone}`}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {partner.business_phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {partner.business_description && (
          <p className="mt-4 text-muted-foreground">{partner.business_description}</p>
        )}
      </div>

      {/* Gallery */}
      <div className="mt-6 px-4">
        <h2 className="text-xl font-bold mb-4">Gallery</h2>
        <PartnerGallery partnerId={id!} />
      </div>

      {/* Events */}
      <div className="mt-6 px-4">
        <h2 className="text-xl font-bold mb-4">Eventi in Programma</h2>
        <PartnerEvents partnerId={id!} />
      </div>

      {/* Map */}
      <div className="mt-6 px-4">
        <h2 className="text-xl font-bold mb-4">Posizione</h2>
        <div className="ios-card p-4">
          <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {partner.business_address}, {partner.business_city}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  const address = `${partner.business_address}, ${partner.business_city}`;
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
                }}
              >
                Apri in Google Maps
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-6 px-4">
        <h2 className="text-xl font-bold mb-4">Recensioni</h2>
        <PartnerReviews partnerId={id!} reviews={partner.reviews || []} onReviewAdded={fetchPartnerDetails} />
      </div>
    </div>
  );
};

export default PartnerDetails;
