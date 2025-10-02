import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, ScanLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  partnerId: string;
}

const QRScanner = ({ partnerId }: QRScannerProps) => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
            Inserisci il codice QR mostrato dal cliente
          </p>
        </div>

        <form onSubmit={handleScan} className="space-y-4">
          <div className="space-y-2">
            <Label>Codice QR</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXXXXXXXXX"
              maxLength={12}
              className="ios-input text-center text-2xl font-mono tracking-wider"
              required
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
