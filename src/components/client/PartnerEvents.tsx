import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Percent, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCodeModal from "./QRCodeModal";

interface PartnerEventsProps {
  partnerId: string;
}

const PartnerEvents = ({ partnerId }: PartnerEventsProps) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [partnerId]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("partner_id", partnerId)
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString())
      .order("start_date", { ascending: true });

    setEvents(data || []);
    setLoading(false);
  };

  const handleDownloadQR = async (event: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per scaricare il QR code",
        variant: "destructive",
      });
      return;
    }

    // Check if user already has a QR code for this event
    const { data: existingQR } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("event_id", event.id)
      .eq("client_id", user.id)
      .single();

    if (existingQR) {
      setSelectedEvent({ ...event, qrCode: existingQR });
      setShowQRModal(true);
      return;
    }

    // Generate new QR code
    const { data: qrData, error } = await supabase.rpc("generate_qr_code");

    if (error || !qrData) {
      toast({
        title: "Errore",
        description: "Impossibile generare il QR code",
        variant: "destructive",
      });
      return;
    }

    // Save QR code
    const { data: newQR, error: insertError } = await supabase
      .from("qr_codes")
      .insert({
        event_id: event.id,
        client_id: user.id,
        code: qrData,
      })
      .select()
      .single();

    if (insertError || !newQR) {
      toast({
        title: "Errore",
        description: "Impossibile salvare il QR code",
        variant: "destructive",
      });
      return;
    }

    setSelectedEvent({ ...event, qrCode: newQR });
    setShowQRModal(true);

    toast({
      title: "QR Code generato!",
      description: "Il tuo QR code è pronto per essere utilizzato",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="ios-card p-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-full mb-2" />
            <div className="h-10 bg-muted rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="ios-card p-8 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Nessun evento in programma</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="ios-card p-4">
            {event.image_url && (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
            )}

            <h3 className="font-bold text-lg mb-2">{event.title}</h3>
            
            {event.description && (
              <p className="text-muted-foreground text-sm mb-3">{event.description}</p>
            )}

            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(event.start_date).toLocaleDateString("it-IT")} -{" "}
                  {new Date(event.end_date).toLocaleDateString("it-IT")}
                </span>
              </div>

              {event.discount_percentage && (
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Percent className="w-4 h-4" />
                  <span>{event.discount_percentage}% di sconto</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {event.link_url && (
                <Button
                  onClick={() => window.open(event.link_url, "_blank")}
                  variant="outline"
                  className="w-full ios-button h-12 mb-2"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Visita Sito Ufficiale
                </Button>
              )}
              
              {event.qr_enabled && (
                <Button
                  onClick={() => handleDownloadQR(event)}
                  className="w-full ios-button h-12"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Scarica QR Code
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <QRCodeModal
          event={selectedEvent}
          open={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </>
  );
};

export default PartnerEvents;
