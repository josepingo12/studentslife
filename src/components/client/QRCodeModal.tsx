import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, CheckCircle2, XCircle } from "lucide-react";

interface QRCodeModalProps {
  event: any;
  open: boolean;
  onClose: () => void;
}

const QRCodeModal = ({ event, open, onClose }: QRCodeModalProps) => {
  if (!event.qrCode) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="ios-card max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="bg-white p-8 rounded-2xl">
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-32 h-32 mx-auto mb-4 text-primary" />
                <p className="text-2xl font-bold font-mono tracking-wider">
                  {event.qrCode.code}
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className={`
            ios-card p-4 flex items-center gap-3
            ${event.qrCode.is_used ? "bg-destructive/10" : "bg-primary/10"}
          `}>
            {event.qrCode.is_used ? (
              <>
                <XCircle className="w-6 h-6 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">QR Code già utilizzato</p>
                  <p className="text-sm text-muted-foreground">
                    Utilizzato il {new Date(event.qrCode.used_at).toLocaleString("it-IT")}
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold text-primary">QR Code valido</p>
                  <p className="text-sm text-muted-foreground">
                    Mostra questo codice al partner per utilizzare l'offerta
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Event Details */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Questo QR code può essere utilizzato una sola volta</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;
