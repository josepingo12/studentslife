import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag } from "lucide-react";
import { toast } from "sonner";

interface ReportContentDialogProps {
  contentId: string;
  contentType: "post" | "comment" | "message" | "video";
  trigger?: React.ReactNode;
}

const ReportContentDialog = ({
  contentId,
  contentType,
  trigger,
}: ReportContentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("spam");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = [
    { value: "spam", label: "Spam" },
    { value: "hate_speech", label: "Discurso de odio" },
    { value: "harassment", label: "Acoso" },
    { value: "violence", label: "Violencia" },
    { value: "inappropriate", label: "Contenido inapropiado" },
    { value: "other", label: "Otro" },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("content_flags").insert({
        content_id: contentId,
        content_type: contentType,
        reason,
        description: description.trim() || null,
      });

      if (error) throw error;

      toast.success("Contenido reportado correctamente");
      setOpen(false);
      setDescription("");
      setReason("spam");
    } catch (error: any) {
      console.error("Error reporting content:", error);
      toast.error("Error al reportar el contenido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Flag className="w-4 h-4 mr-2" />
            Reportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar contenido</DialogTitle>
          <DialogDescription>
            Ayúdanos a mantener la comunidad segura reportando contenido inapropiado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Motivo del reporte</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="mt-2">
              {reasons.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Proporciona detalles adicionales..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Enviando..." : "Enviar reporte"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportContentDialog;
