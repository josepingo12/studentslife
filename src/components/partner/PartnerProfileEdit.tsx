import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PartnerProfileEditProps {
  profile: any;
  onUpdate: () => void;
}

const PartnerProfileEdit = ({ profile, onUpdate }: PartnerProfileEditProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: profile.business_name || "",
    business_description: profile.business_description || "",
    business_address: profile.business_address || "",
    business_city: profile.business_city || "",
    business_phone: profile.business_phone || "",
    profile_image_url: profile.profile_image_url || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il profilo",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profilo aggiornato!",
        description: "Le tue modifiche sono state salvate",
      });
      onUpdate();
    }

    setLoading(false);
  };

  return (
    <div className="ios-card p-6">
      <h2 className="text-xl font-bold mb-6">Modifica Profilo</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nome Attività</Label>
          <Input
            className="ios-input"
            value={formData.business_name}
            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Descrizione</Label>
          <Textarea
            className="ios-input"
            value={formData.business_description}
            onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Indirizzo</Label>
          <Input
            className="ios-input"
            value={formData.business_address}
            onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Città</Label>
          <Input
            className="ios-input"
            value={formData.business_city}
            onChange={(e) => setFormData({ ...formData, business_city: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Telefono</Label>
          <Input
            type="tel"
            className="ios-input"
            value={formData.business_phone}
            onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>URL Foto Profilo</Label>
          <Input
            type="url"
            placeholder="https://..."
            className="ios-input"
            value={formData.profile_image_url}
            onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
          />
        </div>

        {formData.profile_image_url && (
          <div className="aspect-square max-w-xs overflow-hidden rounded-xl mx-auto">
            <img
              src={formData.profile_image_url}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full ios-button h-12"
        >
          {loading ? "Salvataggio..." : "Salva Modifiche"}
        </Button>
      </form>
    </div>
  );
};

export default PartnerProfileEdit;
