import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Percent, Plus, Trash2, BarChart, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/shared/ImageUpload";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import LoyaltyCardConfig from "./LoyaltyCardConfig";

interface PartnerEventsManagerProps {
  partnerId: string;
}

interface EventFormData {
  title: string;
  description: string;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  image_url: string;
  link_url: string;
  qr_enabled: boolean;
}

const initialFormData: EventFormData = {
  title: "",
  description: "",
  discount_percentage: 10,
  start_date: "",
  end_date: "",
  image_url: "",
  link_url: "",
  qr_enabled: true,
};

const PartnerEventsManager = ({ partnerId }: PartnerEventsManagerProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select(`
        *,
        qr_codes(count)
      `)
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });

    setEvents(data || []);
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingEventId(null);
    setFormData(initialFormData);
    setShowDialog(true);
  };

  const handleOpenEdit = (event: any) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      discount_percentage: event.discount_percentage || 10,
      start_date: event.start_date ? event.start_date.split("T")[0] : "",
      end_date: event.end_date ? event.end_date.split("T")[0] : "",
      image_url: event.image_url || "",
      link_url: event.link_url || "",
      qr_enabled: event.qr_enabled ?? true,
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEventId) {
      // Update existing event
      const { error } = await supabase
        .from("events")
        .update(formData)
        .eq("id", editingEventId);

      if (error) {
        toast({
          title: t("eventManager.error"),
          description: t("eventManager.cannotUpdate"),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t("eventManager.eventUpdated"),
        description: t("eventManager.eventUpdatedDesc"),
      });
    } else {
      // Create new event
      const { error } = await supabase.from("events").insert({
        partner_id: partnerId,
        ...formData,
      });

      if (error) {
        toast({
          title: t("eventManager.error"),
          description: t("eventManager.cannotCreate"),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t("eventManager.eventCreated"),
        description: t("eventManager.eventVisible"),
      });
    }

    setShowDialog(false);
    setEditingEventId(null);
    setFormData(initialFormData);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      toast({
        title: t("eventManager.error"),
        description: t("eventManager.cannotDelete"),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t("eventManager.eventDeleted"),
    });

    fetchEvents();
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setEditingEventId(null);
      setFormData(initialFormData);
    }
    setShowDialog(open);
  };

  return (
    <div className="space-y-4">
      {/* Loyalty Card Config at top right */}
      <LoyaltyCardConfig partnerId={partnerId} />

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="ios-card p-4 animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t("eventManager.noEventsYet")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const qrCount = event.qr_codes?.[0]?.count || 0;
            
            return (
              <div key={event.id} className="ios-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(event)}
                      className="text-primary hover:text-primary"
                    >
                      <Pencil className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(event.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm mb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(event.start_date).toLocaleDateString("es-ES")} -{" "}
                      {new Date(event.end_date).toLocaleDateString("es-ES")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Percent className="w-4 h-4" />
                    <span>{event.discount_percentage}%</span>
                  </div>
                </div>

                <div className="ios-card p-3 mb-3 flex items-center justify-between">
                  <span className="font-semibold text-sm">{t("eventManager.qrCodeEnabled")}</span>
                  <Switch
                    checked={event.qr_enabled}
                    onCheckedChange={async (checked) => {
                      const { error } = await supabase
                        .from("events")
                        .update({ qr_enabled: checked })
                        .eq("id", event.id);

                      if (error) {
                        toast({
                          title: t("eventManager.error"),
                          description: t("eventManager.cannotUpdate"),
                          variant: "destructive",
                        });
                      } else {
                        toast({
                          title: checked ? t("eventManager.qrEnabled") : t("eventManager.qrDisabled"),
                        });
                        fetchEvents();
                      }
                    }}
                  />
                </div>

                {event.qr_enabled && (
                  <div className="ios-card bg-primary/10 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart className="w-5 h-5 text-primary" />
                      <span className="font-semibold">{t("eventManager.qrDownloaded")}</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">{qrCount}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Event Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogTrigger asChild>
          <Button className="w-full ios-button h-12" onClick={handleOpenCreate}>
            <Plus className="w-5 h-5 mr-2" />
            {t("eventManager.createNewEvent")}
          </Button>
        </DialogTrigger>
        <DialogContent className="ios-card max-w-md h-[90vh] overflow-y-auto sm:max-h-[90vh] sm:h-auto flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingEventId ? t("eventManager.editEvent") : t("eventManager.newEvent")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pb-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label>{t("eventManager.titleRequired")}</Label>
              <Input
                required
                className="ios-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("eventManager.description")}</Label>
              <Textarea
                className="ios-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("eventManager.eventImage")}</Label>
              <ImageUpload
                bucket="gallery"
                userId={partnerId}
                onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
                showPreview
              />
              {formData.image_url && (
                <div className="mt-2">
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t("eventManager.imageUploaded")}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("eventManager.externalLink")}</Label>
              <Input
                type="url"
                placeholder="https://..."
                className="ios-input"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("eventManager.discountRequired")}</Label>
              <Input
                type="number"
                required
                min="0"
                max="100"
                className="ios-input"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("eventManager.startDateRequired")}</Label>
                <Input
                  type="date"
                  required
                  className="ios-input"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("eventManager.endDateRequired")}</Label>
                <Input
                  type="date"
                  required
                  className="ios-input"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="ios-card p-4 flex items-center justify-between">
              <Label htmlFor="qr-enabled" className="flex flex-col gap-1">
                <span className="font-semibold">{t("eventManager.enableQR")}</span>
                <span className="text-xs text-muted-foreground">
                  {t("eventManager.qrDescription")}
                </span>
              </Label>
              <Switch
                id="qr-enabled"
                checked={formData.qr_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, qr_enabled: checked })}
              />
            </div>

            <Button type="submit" className="w-full ios-button">
              {editingEventId ? t("eventManager.saveChanges") : t("eventManager.createEvent")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerEventsManager;