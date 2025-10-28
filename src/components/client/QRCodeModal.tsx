import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, CheckCircle2, XCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import QRCodeLib from "qrcode";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";

interface QRCodeModalProps {
  event: any;
  open: boolean;
  onClose: () => void;
}

const QRCodeModal = ({ event, open, onClose }: QRCodeModalProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && event.qrCode?.code) {
      generateQRCode();
    }
  }, [open, event.qrCode?.code]);

  const generateQRCode = async () => {
    if (!event.qrCode?.code) return;
    try {
      const url = await QRCodeLib.toDataURL(event.qrCode.code, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error("Errore generazione QR:", err);
    }
  };

  const downloadQRCode = async () => {
    if (!event.qrCode) return;
    setDownloading(true);
    try {
      const dataUrl = qrDataUrl ?? canvasRef.current?.toDataURL("image/png");
      if (!dataUrl) throw new Error("QR not ready");
      const fileName = `qr-${event.qrCode.code}.png`;

      if (Capacitor.isNativePlatform()) {
        // Mobile: salva nel dispositivo usando Capacitor
        const base64Data = dataUrl.split(",")[1];

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });

        // Condividi il file
        await Share.share({
          title: `QR Code - ${event.title}`,
          text: `Il tuo QR code per ${event.title}`,
          url: savedFile.uri,
          dialogTitle: "Salva il tuo QR Code",
        });

        toast({
          title: t("events.qrCodeSaved"),
          description: t("events.qrCodeSaved"),
        });
      } else {
        // Web: download normale
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: t("events.qrCodeDownloaded"),
          description: t("events.qrCodeDownloaded"),
        });
      }
    } catch (err) {
      console.error("Errore download QR:", err);
      toast({
        title: t("common.error"),
        description: t("events.errorSaving"),
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  if (!event.qrCode) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="ios-card max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="bg-white p-6 rounded-2xl flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-full max-w-[300px] h-auto"
              />
            ) : (
              <canvas
                ref={canvasRef}
                className="w-full max-w-[300px] h-auto"
                style={{ display: 'block' }}
              />
            )}
            <p className="text-center mt-4 text-lg font-bold font-mono tracking-wider">
              {event.qrCode.code}
            </p>
          </div>

          {/* Download Button */}
          <Button
            onClick={downloadQRCode}
            disabled={downloading}
            className="w-full ios-button h-12"
          >
            <Download className="w-5 h-5 mr-2" />
            {downloading ? t("events.saving") : t("events.saveQRCode")}
          </Button>

          {/* Status */}
          <div className="ios-card p-4 flex items-center gap-3 bg-primary/10">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            <div>
              <p className="font-semibold text-primary">{t("events.qrCodeValid")}</p>
              <p className="text-sm text-muted-foreground">
                Valido fino al {new Date(event.end_date).toLocaleDateString("it-IT")}
              </p>
            </div>
          </div>

          {/* Event Details */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Mostra questo QR al partner per usufruire dello sconto</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;
