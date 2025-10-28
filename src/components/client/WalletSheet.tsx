import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, QrCode } from "lucide-react";
import QRCodeModal from "./QRCodeModal";

interface WalletSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const WalletSheet = ({ open, onOpenChange, userId }: WalletSheetProps) => {
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    if (open) {
      fetchQRCodes();
    }
  }, [open, userId]);

  const fetchQRCodes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("qr_codes")
      .select(`
        *,
        events!inner(
          id,
          title,
          description,
          image_url,
          start_date,
          end_date,
          discount_percentage,
          partner_id
        )
      `)
      .eq("client_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch partner profiles for each QR code
      const qrCodesWithPartners = await Promise.all(
        data.map(async (qr) => {
          const { data: partnerProfile } = await supabase
            .from("profiles")
            .select("business_name, profile_image_url")
            .eq("id", qr.events.partner_id)
            .single();

          return {
            ...qr,
            partnerProfile,
          };
        })
      );

      setQrCodes(qrCodesWithPartners);
    }
    setLoading(false);
  };

  const handleQRClick = (qrCode: any) => {
    setSelectedEvent({
      ...qrCode.events,
      qrCode,
    });
    setShowQRModal(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="text-center text-2xl font-bold">
              Il Mio Wallet
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4 overflow-y-auto h-[calc(85vh-100px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : qrCodes.length === 0 ? (
              <div className="text-center py-12 ios-card">
                <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nessun QR Code nel wallet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Scarica un QR Code da un evento per vederlo qui
                </p>
              </div>
            ) : (
              qrCodes.map((qr) => (
                <button
                  key={qr.id}
                  onClick={() => handleQRClick(qr)}
                  className="w-full ios-card p-4 flex items-center gap-4 hover:bg-accent transition-colors"
                >
                  <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                    <AvatarImage src={qr.partnerProfile?.profile_image_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {qr.partnerProfile?.business_name?.[0] || "P"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-lg">{qr.events.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {qr.partnerProfile?.business_name}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Valido fino al{" "}
                        {new Date(qr.events.end_date).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                  </div>

                  <QrCode className="w-8 h-8 text-primary" />
                </button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

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

export default WalletSheet;
