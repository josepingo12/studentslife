import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, ScanLine, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  partnerId: string;
}

const QRScanner = ({ partnerId }: QRScannerProps) => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      // Blocked contexts: insecure or embedded iframes often cannot request camera
      if (!window.isSecureContext) {
        toast({
          title: "Permesso non disponibile",
          description: "La fotocamera richiede HTTPS. Apri il sito con https://",
          variant: "destructive",
        });
        return;
      }
      if (window.self !== window.top) {
        toast({
          title: "Apri in nuova scheda",
          description: "La fotocamera è bloccata nel preview. Apri la pagina in una nuova scheda.",
          variant: "destructive",
        });
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        toast({
          title: "Non supportato",
          description: "Il browser non supporta l'accesso alla fotocamera.",
          variant: "destructive",
        });
        return;
      }

      setScanning(true);

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      } as const;

      // Cerca esplicitamente la camera FRONTALE
      let cameraId: string | undefined;
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          // Cerca camera frontale nel label
          const frontCamera = cameras.find((c) => 
            /front|user|frontale|facetime/i.test(c.label)
          );
          cameraId = frontCamera?.id || cameras[0]?.id; // Prima camera se non trova frontale
        }
      } catch (e) {
        console.log("Impossibile elencare le camere, uso facingMode");
      }

      // Usa deviceId se trovato, altrimenti facingMode user (frontale)
      const constraints = cameraId 
        ? { deviceId: { exact: cameraId } }
        : { facingMode: { exact: "user" } };

      await html5QrCode.start(
        constraints,
        config,
        (decodedText) => {
          setCode(decodedText.toUpperCase());
          stopScanner();
          toast({ title: "QR Code scansionato", description: "Verifica in corso..." });
        },
        () => {}
      );
    } catch (err: any) {
      console.error("Errore avvio scanner:", err);

      let errorMessage = "Impossibile avviare la fotocamera";
      if (err?.name === "NotAllowedError") {
        errorMessage = "Permesso fotocamera negato. Abilita i permessi nelle impostazioni del browser.";
      } else if (err?.name === "NotFoundError") {
        errorMessage = "Nessuna fotocamera trovata sul dispositivo.";
      } else if (err?.name === "NotReadableError") {
        errorMessage = "Fotocamera già in uso o non disponibile.";
      } else if (err?.message) {
        errorMessage = err.message;
      }

      toast({ title: "Errore", description: errorMessage, variant: "destructive" });
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Errore stop scanner:", err);
      }
    }
    setScanning(false);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Get QR code details
    const { data: qrData, error: qrError } = await supabase
      .from("qr_codes")
      .select(`
        *,
        events!inner(
          *,
          profiles!inner(id)
        )
      `)
      .eq("code", code.toUpperCase())
      .single();

    if (qrError || !qrData) {
      setResult({ valid: false, message: "QR code non valido" });
      setLoading(false);
      return;
    }

    // Check if QR belongs to this partner's events
    if (qrData.events.profiles.id !== partnerId) {
      setResult({ valid: false, message: "QR code non appartiene a questo partner" });
      setLoading(false);
      return;
    }

    // Check if already used
    if (qrData.is_used) {
      setResult({
        valid: false,
        message: "QR code già utilizzato",
        details: `Utilizzato il ${new Date(qrData.used_at).toLocaleString("it-IT")}`,
      });
      setLoading(false);
      return;
    }

    // Check if event is still valid
    const now = new Date();
    const endDate = new Date(qrData.events.end_date);
    
    if (now > endDate) {
      setResult({ valid: false, message: "Evento scaduto" });
      setLoading(false);
      return;
    }

    // Mark as used
    const { error: updateError } = await supabase
      .from("qr_codes")
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq("id", qrData.id);

    if (updateError) {
      setResult({ valid: false, message: "Errore durante la validazione" });
      setLoading(false);
      return;
    }

    setResult({
      valid: true,
      message: "QR code valido!",
      details: {
        event: qrData.events.title,
        discount: qrData.events.discount_percentage,
      },
    });

    toast({
      title: "QR code validato",
      description: `Sconto del ${qrData.events.discount_percentage}% applicato`,
    });

    setLoading(false);
    setCode("");
  };

  return (
    <div className="space-y-6">
      <div className="ios-card p-6">
        <div className="text-center mb-6">
          <ScanLine className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <h2 className="text-xl font-bold mb-2">Scanner QR Code</h2>
          <p className="text-muted-foreground text-sm">
            Scansiona o inserisci il codice QR del cliente
          </p>
        </div>

        {/* Camera Scanner */}
        {scanning ? (
          <div className="space-y-4">
            <div id="qr-reader" className="rounded-lg overflow-hidden" />
            <Button
              onClick={stopScanner}
              variant="outline"
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Chiudi Scanner
            </Button>
          </div>
        ) : (
          <>
            <Button
              onClick={startScanner}
              className="w-full mb-4 h-14 bg-gradient-to-br from-primary to-primary/80"
            >
              <Camera className="w-5 h-5 mr-2" />
              Apri Fotocamera
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">oppure</span>
              </div>
            </div>

            <form onSubmit={handleScan} className="space-y-4">
              <div className="space-y-2">
                <Label>Inserisci codice manualmente</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXXXXXX"
                  maxLength={12}
                  className="ios-input text-center text-2xl font-mono tracking-wider"
                />
              </div>

              <Button
                type="submit"
                className="w-full ios-button h-14 text-lg"
                disabled={loading || code.length !== 12}
              >
                {loading ? "Verifica..." : "Verifica QR Code"}
              </Button>
            </form>
          </>
        )}
      </div>

      {result && (
        <div
          className={`ios-card p-6 animate-fade-in ${
            result.valid ? "bg-green-500/10" : "bg-destructive/10"
          }`}
        >
          <div className="flex items-start gap-4">
            {result.valid ? (
              <CheckCircle2 className="w-12 h-12 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-12 h-12 text-destructive flex-shrink-0" />
            )}
            
            <div className="flex-1">
              <h3
                className={`text-xl font-bold mb-2 ${
                  result.valid ? "text-green-600" : "text-destructive"
                }`}
              >
                {result.message}
              </h3>

              {result.details && typeof result.details === "object" && (
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-semibold">Evento:</span> {result.details.event}
                  </p>
                  <p>
                    <span className="font-semibold">Sconto:</span> {result.details.discount}%
                  </p>
                </div>
              )}

              {result.details && typeof result.details === "string" && (
                <p className="text-sm text-muted-foreground">{result.details}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
