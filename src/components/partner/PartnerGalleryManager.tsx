import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PartnerGalleryManagerProps {
  partnerId: string;
}

const PartnerGalleryManager = ({ partnerId }: PartnerGalleryManagerProps) => {
  const { toast } = useToast();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    const { data } = await supabase
      .from("gallery")
      .select("*")
      .eq("partner_id", partnerId)
      .order("display_order", { ascending: true });

    setImages(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("gallery").insert({
      partner_id: partnerId,
      image_url: imageUrl,
      caption,
      display_order: images.length,
    });

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere l'immagine",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Immagine aggiunta!",
    });

    setShowDialog(false);
    setImageUrl("");
    setCaption("");
    fetchGallery();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("gallery").delete().eq("id", id);

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'immagine",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Immagine eliminata",
    });

    fetchGallery();
  };

  return (
    <div className="space-y-4">
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button className="w-full ios-button h-12">
            <Plus className="w-5 h-5 mr-2" />
            Aggiungi Foto
          </Button>
        </DialogTrigger>
        <DialogContent className="ios-card max-w-md">
          <DialogHeader>
            <DialogTitle>Nuova Foto</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>URL Immagine *</Label>
              <Input
                type="url"
                required
                placeholder="https://..."
                className="ios-input"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Inserisci l'URL di un'immagine online
              </p>
            </div>

            <div className="space-y-2">
              <Label>Didascalia</Label>
              <Input
                className="ios-input"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            {imageUrl && (
              <div className="aspect-square overflow-hidden rounded-xl">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => {
                    toast({
                      title: "URL non valido",
                      description: "L'immagine non può essere caricata",
                      variant: "destructive",
                    });
                  }}
                />
              </div>
            )}

            <Button type="submit" className="w-full ios-button">
              Aggiungi
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nessuna foto nella gallery</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square overflow-hidden rounded-xl ios-card">
                <img
                  src={image.image_url}
                  alt={image.caption || "Gallery"}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(image.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerGalleryManager;
