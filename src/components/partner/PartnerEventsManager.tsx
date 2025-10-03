import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Percent, Plus, Trash2, BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/shared/ImageUpload";

interface PartnerEventsManagerProps {
  partnerId: string;
}

const PartnerEventsManager = ({ partnerId }: PartnerEventsManagerProps) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_percentage: 10,
    start_date: "",
    end_date: "",
    image_url: "",
    link_url: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select(`
        *,
        qr_codes(count)
      `)
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });

    setEvents(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("events").insert({
      partner_id: partnerId,
      ...formData,
    });

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile creare l'evento",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Evento creato!",
      description: "Il tuo evento è ora visibile ai clienti",
    });

    setShowDialog(false);
    setFormData({
      title: "",
      description: "",
      discount_percentage: 10,
      start_date: "",
      end_date: "",
      image_url: "",
      link_url: "",
    });
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'evento",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Evento eliminato",
    });

    fetchEvents();
  };

  return (
    <div className="space-y-4">
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button className="w-full ios-button h-12">
            <Plus className="w-5 h-5 mr-2" />
            Crea Nuovo Evento
          </Button>
        </DialogTrigger>
        <DialogContent className="ios-card max-w-md">
          <DialogHeader>
            <DialogTitle>Nuovo Evento</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Titolo *</Label>
              <Input
                required
                className="ios-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                className="ios-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Immagine Evento</Label>
              <ImageUpload
                bucket="gallery"
                userId={partnerId}
                onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
                showPreview
              />
              {formData.image_url && (
                <p className="text-xs text-muted-foreground">✓ Immagine caricata</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Link Esterno (es. acquisto biglietti)</Label>
              <Input
                type="url"
                placeholder="https://..."
                className="ios-input"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Sconto % *</Label>
              <Input
                type="number"
                required
                min="0"
                max="100"
                className="ios-input"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Inizio *</Label>
                <Input
                  type="date"
                  required
                  className="ios-input"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fine *</Label>
                <Input
                  type="date"
                  required
                  className="ios-input"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full ios-button">
              Crea Evento
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="ios-card p-4 animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nessun evento creato ancora</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const qrCount = event.qr_codes?.[0]?.count || 0;
            
            return (
              <div key={event.id} className="ios-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(event.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-sm mb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(event.start_date).toLocaleDateString("it-IT")} -{" "}
                      {new Date(event.end_date).toLocaleDateString("it-IT")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Percent className="w-4 h-4" />
                    <span>{event.discount_percentage}%</span>
                  </div>
                </div>

                <div className="ios-card bg-primary/10 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-primary" />
                    <span className="font-semibold">QR scaricati:</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{qrCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PartnerEventsManager;
