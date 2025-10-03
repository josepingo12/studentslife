import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon } from "lucide-react";

interface PartnerGalleryProps {
  partnerId: string;
}

const PartnerGallery = ({ partnerId }: PartnerGalleryProps) => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, [partnerId]);

  const fetchGallery = async () => {
    const { data } = await supabase
      .from("gallery")
      .select("*")
      .eq("partner_id", partnerId)
      .order("display_order", { ascending: true });

    setImages(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="ios-card p-8 text-center">
        <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Nessuna foto disponibile</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map((image) => (
        <div key={image.id} className="aspect-square overflow-hidden rounded-xl ios-card">
          <img
            src={image.image_url}
            alt={image.caption || "Gallery image"}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};

export default PartnerGallery;
