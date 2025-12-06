import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, ScanLine, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QrScanner from 'qr-scanner';
import { useTranslation } from "react-i18next";

interface QRScannerProps {
  partnerId: string;
}

const QRScanner = ({ partnerId }: QRScannerProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);


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
     console.log("🎥 DEBUG: Inizio richiesta fotocamera");

     if (!navigator.mediaDevices?.getUserMedia) {
       console.error("❌ Browser non supporta getUserMedia");
       return;
     }

     console.log("🛑 DEBUG: Stopping existing camera");
     stopCamera();

     console.log("📸 DEBUG: Richiedendo stream fotocamera...");
     const stream = await navigator.mediaDevices.getUserMedia({
       video: {
         facingMode: { ideal: "environment" },
         width: { ideal: 1280, max: 1920 },
         height: { ideal: 720, max: 1080 }
       },
       audio: false
     });

     console.log(`✅ DEBUG: Stream ottenuto con ${stream.getVideoTracks().length} tracks`);
     streamRef.current = stream;

     // IMPORTANTE: Imposta scanning = true PRIMA di configurare il video
     console.log("🔄 DEBUG: Setting scanning to true");
     setScanning(true);

     // Aspetta che React renderizzi il video element
  setTimeout(() => {
    if (videoRef.current) {
      console.log("📺 DEBUG: Assegnando stream al video element");
      const video = videoRef.current;

      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.controls = false;
      video.srcObject = stream;

      // AGGIUNGI QR SCANNER
      const qrScanner = new QrScanner(
        video,
        (result) => {
          console.log("🎯 QR Code detected:", result.data);
          setCode(result.data.toUpperCase());

          // Auto-submit se è 12 caratteri
          if (result.data.length === 12) {
            toast({
              title: t("qrScanner.valid"),
              description: `${t("common.code")}: ${result.data}`,
              duration: 2000
            });

            // Ferma scanner e processa
            qrScanner.stop();
            stopCamera();

            // Simula form submit
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            handleScan(fakeEvent);
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScannerRef.current = qrScanner;
      qrScanner.start();

         console.log("🎬 DEBUG: Stream assegnato, configurando eventi");

         video.onloadedmetadata = async () => {
           try {
             console.log("🎭 DEBUG: Metadata loaded, tentando play");
             await video.play();
             console.log("🎉 DEBUG: Video playing successfully!");
           } catch (err) {
             console.error("❌ DEBUG: Play failed:", err);
           }
         };

         setTimeout(async () => {
           try {
             if (video.paused) {
               console.log("🚀 DEBUG: Fallback play attempt");
               await video.play();
               console.log("🎊 DEBUG: Fallback play successful!");
             }
           } catch (err) {
             console.error("❌ DEBUG: Fallback play failed:", err);
           }
         }, 500);
       } else {
         console.error("❌ DEBUG: videoRef.current is still null!");
       }
     }, 100); // Aspetta 100ms per il re-render

     console.log("✨ DEBUG: startCamera function completed successfully");

   } catch (error) {
     console.error("💥 DEBUG: startCamera error:", error);
   }
  };

  // Function to add loyalty stamp when QR is scanned
  const addLoyaltyStamp = async (clientId: string) => {
    try {
      // Check if partner has an active loyalty card
      const { data: loyaltyCard } = await supabase
        .from("loyalty_cards")
        .select("id, stamps_required")
        .eq("partner_id", partnerId)
        .eq("is_active", true)
        .single();

      if (!loyaltyCard) return; // No active loyalty card

      // Check if client already has stamps with this partner
      const { data: existingStamps } = await supabase
        .from("client_stamps")
        .select("*")
        .eq("client_id", clientId)
        .eq("partner_id", partnerId)
        .single();

      if (existingStamps) {
        // Update existing stamps
        const newCount = existingStamps.stamps_count + 1;
        const isComplete = newCount >= loyaltyCard.stamps_required;
        
        await supabase
          .from("client_stamps")
          .update({
            stamps_count: newCount,
            last_stamp_at: new Date().toISOString(),
            reward_claimed: isComplete ? false : existingStamps.reward_claimed,
          })
          .eq("id", existingStamps.id);

        toast({
          title: t("loyaltyCard.stampAdded"),
          description: t("loyaltyCard.stampAddedDesc", { 
            count: newCount, 
            total: loyaltyCard.stamps_required 
          }),
        });
      } else {
        // Create new stamp record
        await supabase
          .from("client_stamps")
          .insert({
            client_id: clientId,
            partner_id: partnerId,
            loyalty_card_id: loyaltyCard.id,
            stamps_count: 1,
          });

        toast({
          title: t("loyaltyCard.stampAdded"),
          description: t("loyaltyCard.stampAddedDesc", { 
            count: 1, 
            total: loyaltyCard.stamps_required 
          }),
        });
      }
    } catch (error) {
      console.error("Error adding loyalty stamp:", error);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code) {
      toast({
        title: t("qrScanner.invalidCode"),
        description: t("qrScanner.enterCode"),
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
        setResult({ valid: false, message: t("qrScanner.notValid") });
        return;
      }

      if (qrData.events.profiles.id !== partnerId) {
        setResult({ valid: false, message: t("qrScanner.notYours") });
        return;
      }

      if (qrData.is_used) {
        setResult({
          valid: false,
          message: t("qrScanner.alreadyUsed"),
          details: `${t("qrScanner.usedOn")} ${new Date(qrData.used_at).toLocaleString()}`,
        });
        return;
      }

      const now = new Date();
      const endDate = new Date(qrData.events.end_date);

      if (now > endDate) {
        setResult({ valid: false, message: t("qrScanner.expired") });
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
        setResult({ valid: false, message: t("qrScanner.validationError") });
        return;
      }

      // Add loyalty stamp if partner has active loyalty card
      await addLoyaltyStamp(qrData.client_id);

      setResult({
        valid: true,
        message: t("qrScanner.valid"),
        details: {
          event: qrData.events.title,
          discount: qrData.events.discount_percentage,
        },
      });

      toast({
        title: t("qrScanner.validated"),
        description: t("qrScanner.discountApplied", { percent: qrData.events.discount_percentage }),
      });

      setCode("");

    } catch (error) {
      console.error("Errore verifica:", error);
      setResult({ valid: false, message: t("qrScanner.verificationError") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="ios-card p-6">
        <div className="text-center mb-6">
          <ScanLine className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <h2 className="text-xl font-bold mb-2">{t("qrScanner.title")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("qrScanner.description")}
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
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-white border-dashed w-64 h-64 rounded-lg flex items-center justify-center animate-pulse">
                  <div className="text-white text-sm bg-black/70 px-3 py-2 rounded-lg text-center">
                    <div className="font-semibold">{t("qrScanner.frameQR")}</div>
                    <div className="text-xs mt-1">{t("qrScanner.rearCamera")}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
              <p className="text-center text-blue-600 dark:text-blue-400">
                💡 <strong>{t("common.tip")}:</strong> {t("qrScanner.keepStable")}
              </p>
            </div>

            <Button
              onClick={stopCamera}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <X className="w-4 h-4 mr-2" />
              {t("qrScanner.closeCamera")}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">


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
              {t("qrScanner.openCamera")}
            </Button>
          </div>
        )}

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {scanning ? t("qrScanner.orManual") : t("qrScanner.orOther")}
            </span>
          </div>
        </div>

        <form onSubmit={handleScan} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-code-input">{t("qrScanner.enterManually")}</Label>
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
            disabled={loading || !code}
            size="lg"
          >
            {loading ? t("qrScanner.verifying") : t("qrScanner.verify")}
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
                    <span className="font-semibold">{t("qrScanner.event")}</span> {result.details.event}
                  </p>
                  <p>
                    <span className="font-semibold">{t("qrScanner.discount")}</span> {result.details.discount}%
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
