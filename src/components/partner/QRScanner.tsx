import { useState, useRef } from "react";
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
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    try {
      // Toast per vedere se la funzione viene chiamata
      toast({
        title: "Debug",
        description: "🎥 Inizio richiesta fotocamera",
        duration: 3000
      });

      if (!navigator.mediaDevices?.getUserMedia) {
        toast({
          title: "Non supportato",
          description: "Il browser non supporta l'accesso alla fotocamera.",
          variant: "destructive",
        });
        return;
      }

      // Stop existing stream
      stopCamera();

      // Richiedi i permessi prima
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        },
        audio: false
      });

      toast({
        title: "Debug",
        description: `✅ Stream ottenuto: ${stream.getVideoTracks().length} tracks`,
        duration: 3000
      });

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;

        // IMPORTANTE: Imposta tutto prima di assegnare lo stream
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.controls = false;

        // Assegna lo stream
        video.srcObject = stream;

        toast({
          title: "Debug",
          description: "📺 Stream assegnato al video",
          duration: 3000
        });

        // Aspetta che sia pronto e poi play
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            toast({
              title: "Debug",
              description: "🎬 Video metadata loaded & playing",
              duration: 3000
            });
          } catch (err) {
            toast({
              title: "Errore Play Metadata",
              description: `❌ ${err.message}`,
              variant: "destructive",
              duration: 5000
            });
          }
        };

        // Fallback: forza play dopo 500ms
        setTimeout(async () => {
          try {
            if (video.paused) {
              await video.play();
              toast({
                title: "Debug",
                description: "🚀 Fallback play eseguito",
                duration: 3000
              });
            }
          } catch (err) {
            toast({
              title: "Errore Fallback Play",
              description: `❌ ${err.message}`,
              variant: "destructive",
              duration: 5000
            });
          }
        }, 500);
      }

      setScanning(true);
      toast({
        title: "Fotocamera attiva",
        description: "Inquadra il QR Code per scansionarlo",
      });

    } catch (error: any) {
      toast({
        title: "Errore Camera",
        description: `💥 ${error.message}`,
        variant: "destructive",
        duration: 5000
      });

      let message = "Impossibile accedere alla fotocamera";
      if (error.name === "NotAllowedError") {
        message = "Permesso fotocamera negato";
      } else if (error.name === "NotFoundError") {
        message = "Nessuna fotocamera trovata";
      }

      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
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
        return;
      }

      if (qrData.events.profiles.id !== partnerId) {
        setResult({ valid: false, message: "QR code non appartiene a questo partner" });
        return;
      }

      if (qrData.is_used) {
        setResult({
          valid: false,
          message: "QR code già utilizzato",
          details: `Utilizzato il ${new Date(qrData.used_at).toLocaleString("it-IT")}`,
        });
        return;
      }

      const now = new Date();
      const endDate = new Date(qrData.events.end_date);

      if (now > endDate) {
        setResult({ valid: false, message: "Evento scaduto" });
        return;
      }

      const { error: updateError } = await supabase
        .from("qr_codes")
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
        })
        .eq("id", qrData.id);

      if (updateError) {
        setResult({ valid: false, message: "Errore durante la validazione" });
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
      console.error("Errore verifica:", error);
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

        {scanning ? (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="w-full h-[400px] object-cover"
                playsInline={true}
                muted={true}
                autoPlay={true}
                controls={false}
                style={{
                  backgroundColor: '#000',
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover',
                  display: 'block',
                  visibility: 'visible',
                  transform: 'scaleX(-1)', // Mirror
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-white border-dashed w-64 h-64 rounded-lg flex items-center justify-center animate-pulse">
                  <div className="text-white text-sm bg-black/70 px-3 py-2 rounded-lg text-center">
                    <div className="font-semibold">📷 Inquadra il QR Code</div>
                    <div className="text-xs mt-1">Fotocamera posteriore attiva</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
              <p className="text-center text-blue-600 dark:text-blue-400">
                💡 <strong>Suggerimento:</strong> Mantieni il QR code ben illuminato e stabile
              </p>
            </div>

            <Button
              onClick={stopCamera}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <X className="w-4 h-4 mr-2" />
              Chiudi Fotocamera
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* BOTTONE TEST */}
            <Button
              onClick={() => {
                alert("BOTTONE TEST FUNZIONA!");
                console.log("Test button clicked");
                toast({
                  title: "Test",
                  description: "🧪 Bottone test cliccato!",
                  duration: 2000
                });
              }}
              variant="outline"
              className="w-full mb-2"
              type="button"
            >
              🧪 TEST BOTTONE
            </Button>

            {/* BOTTONE PRINCIPALE CON DEBUG */}
           <Button
             onClick={async () => {
               try {
                 console.log("🔥 BOTTONE FOTOCAMERA CLICCATO!");
                 toast({
                   title: "Debug",
                   description: "🔥 Bottone cliccato - chiamando startCamera",
                   duration: 2000
                 });

                 console.log("🚀 Chiamando startCamera...");
                 await startCamera();
                 console.log("✅ startCamera completata");

               } catch (error) {
                 console.error("💥 ERRORE in onClick:", error);
                 toast({
                   title: "Errore onClick",
                   description: `💥 ${error.message}`,
                   variant: "destructive",
                   duration: 5000
                 });
               }
             }}
             className="w-full mb-4 h-14 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
             size="lg"
             type="button"
           >
             <Camera className="w-5 h-5 mr-2" />
             Apri Fotocamera Posteriore
           </Button>
          </div>
        )}

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {scanning ? "o inserisci manualmente" : "oppure"}
            </span>
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
