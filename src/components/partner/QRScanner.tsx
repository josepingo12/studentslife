import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, ScanLine, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  partnerId: string;
}

const QRScanner = ({ partnerId }: QRScannerProps) => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = () => {
    // Ferma il video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Ferma l'animazione
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    // Imposta le dimensioni del canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Disegna il frame del video sul canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Carica dinamicamente jsQR
      const jsQR = await import('jsqr');
      
      // Ottieni i dati dell'immagine
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Scansiona per QR codes
      const qrCode = jsQR.default(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (qrCode && qrCode.data) {
        console.log("QR Code trovato:", qrCode.data);
        setCode(qrCode.data.toUpperCase());
        stopScanner();
        toast({ 
          title: "QR Code scansionato", 
          description: "Verifica in corso..." 
        });
        return;
      }
    } catch (error) {
      console.error("Errore durante la scansione:", error);
    }

    // Continua la scansione
    animationRef.current = requestAnimationFrame(scanQRCode);
  };

  const startScanner = async () => {
    try {
      // Verifica supporto browser
      if (!navigator.mediaDevices?.getUserMedia) {
        toast({
          title: "Non supportato",
          description: "Il browser non supporta l'accesso alla fotocamera.",
          variant: "destructive",
        });
        return;
      }

      // Verifica contesto sicuro
      if (!window.isSecureContext) {
        toast({
          title: "Permesso non disponibile",
          description: "La fotocamera richiede HTTPS. Apri il sito con https://",
          variant: "destructive",
        });
        return;
      }

      console.log("Richiedendo accesso alla fotocamera...");

      // Richiedi accesso alla camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Camera posteriore per QR codes
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            console.log("Video avviato, inizio scansione...");
            scanQRCode();
          }).catch(err => {
            console.error("Errore avvio video:", err);
          });
        };
      }

      setScanning(true);
      toast({
        title: "Scanner attivo",
        description: "Inquadra il QR code con la fotocamera",
      });

    } catch (err: any) {
      console.error("Errore avvio scanner:", err);

      let errorMessage = "Impossibile avviare la fotocamera";
      
      if (err?.name === "NotAllowedError") {
        errorMessage = "Permesso fotocamera negato. Abilita i permessi nelle impostazioni del browser.";
      } else if (err?.name === "NotFoundError") {
        errorMessage = "Nessuna fotocamera trovata sul dispositivo.";
      } else if (err?.name === "NotReadableError") {
        errorMessage = "Fotocamera già in uso o non disponibile.";
      } else if (err?.name === "OverconstrainedError") {
        errorMessage = "Le impostazioni della fotocamera non sono supportate.";
      }

      toast({ 
        title: "Errore Scanner", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 12) {
      toast({
        title: "Codice non valido",
        description: "Il codice QR deve essere di 12 caratteri",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
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
        console.error("Errore aggiornamento QR:", updateError);
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

      setCode("");

    } catch (error) {
      console.error("Errore durante la verifica:", error);
      setResult({ valid: false, message: "Errore durante la verifica del QR code" });
    } finally {
      setLoading(false);
    }
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
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="w-full h-[400px] object-cover"
                playsInline
                muted
                autoPlay
              />
              
              {/* Canvas nascosto per la scansione */}
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Overlay con guida visiva */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-primary border-dashed w-64 h-64 rounded-lg flex items-center justify-center">
                  <div className="text-white text-sm bg-black/70 px-3 py-2 rounded-lg text-center">
                    <div className="font-semibold">Inquadra il QR Code</div>
                    <div className="text-xs mt-1">Mantieni fermo il dispositivo</div>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              onClick={stopScanner}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <X className="w-4 h-4 mr-2" />
              Chiudi Scanner
            </Button>
          </div>
        ) : (
          <>
            <Button
              onClick={startScanner}
              className="w-full mb-4 h-14 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              size="lg"
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
                <Label htmlFor="qr-code-input">Inserisci codice manualmente</Label>
                <Input
                  id="qr-code-input"
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
                size="lg"
              >
                {loading ? "Verifica..." : "Verifica QR Code"}
              </Button>
            </form>
          </>
        )}
      </div>

      {result && (
        <div
          className={`ios-card p-6 animate-fade-in border-2 ${
            result.valid 
              ? "bg-green-500/10 border-green-500/20" 
              : "bg-destructive/10 border-destructive/20"
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
