import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Flag, CheckCircle, XCircle, Clock } from "lucide-react";

interface ContentFlag {
  id: string;
  content_id: string;
  content_type: string;
  reason: string;
  description: string | null;
  status: string;
  reporter_user_id: string;
  created_at: string;
  moderation_notes: string | null;
}

const ModerationPanel = () => {
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadFlags();
    
    // Realtime subscription
    const channel = supabase
      .channel("moderation-flags")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_flags",
        },
        () => {
          loadFlags();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("content_flags")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error("Error loading flags:", error);
      toast.error("Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  };

  const updateFlagStatus = async (
    flagId: string,
    status: "reviewed" | "resolved" | "dismissed"
  ) => {
    try {
      const { error } = await supabase
        .from("content_flags")
        .update({
          status,
          moderation_notes: notes || null,
        })
        .eq("id", flagId);

      if (error) throw error;

      toast.success("Estado actualizado correctamente");
      setNotes("");
      setSelectedFlag(null);
    } catch (error) {
      console.error("Error updating flag:", error);
      toast.error("Error al actualizar estado");
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: "Spam",
      hate_speech: "Discurso de odio",
      harassment: "Acoso",
      violence: "Violencia",
      inappropriate: "Inapropiado",
      other: "Otro",
    };
    return labels[reason] || reason;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: "default", icon: Clock },
      reviewed: { variant: "secondary", icon: Flag },
      resolved: { variant: "default", icon: CheckCircle },
      dismissed: { variant: "outline", icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filterByStatus = (status: string) => {
    return flags.filter((flag) => flag.status === status);
  };

  const FlagCard = ({ flag }: { flag: ContentFlag }) => (
    <Card key={flag.id} className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            {flag.content_type.toUpperCase()} - {getReasonLabel(flag.reason)}
          </CardTitle>
          {getStatusBadge(flag.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Content ID: <code className="text-xs">{flag.content_id}</code>
            </p>
            <p className="text-sm text-muted-foreground">
              Reportado: {new Date(flag.created_at).toLocaleString("es-ES")}
            </p>
          </div>

          {flag.description && (
            <div>
              <p className="text-sm font-medium mb-1">Descripción:</p>
              <p className="text-sm text-muted-foreground">{flag.description}</p>
            </div>
          )}

          {flag.moderation_notes && (
            <div>
              <p className="text-sm font-medium mb-1">Notas de moderación:</p>
              <p className="text-sm text-muted-foreground">{flag.moderation_notes}</p>
            </div>
          )}

          {selectedFlag === flag.id ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Notas de moderación..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateFlagStatus(flag.id, "resolved")}
                >
                  Resolver
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => updateFlagStatus(flag.id, "reviewed")}
                >
                  Revisar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateFlagStatus(flag.id, "dismissed")}
                >
                  Descartar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedFlag(null);
                    setNotes("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            flag.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFlag(flag.id)}
              >
                Moderar
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Panel de Moderación</h2>
        <Badge variant="outline">
          {filterByStatus("pending").length} pendientes
        </Badge>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pendientes ({filterByStatus("pending").length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Revisados ({filterByStatus("reviewed").length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resueltos ({filterByStatus("resolved").length})
          </TabsTrigger>
          <TabsTrigger value="dismissed">
            Descartados ({filterByStatus("dismissed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {filterByStatus("pending").length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No hay reportes pendientes</p>
              </CardContent>
            </Card>
          ) : (
            filterByStatus("pending").map((flag) => <FlagCard key={flag.id} flag={flag} />)
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="mt-4">
          {filterByStatus("reviewed").length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No hay reportes revisados</p>
              </CardContent>
            </Card>
          ) : (
            filterByStatus("reviewed").map((flag) => <FlagCard key={flag.id} flag={flag} />)
          )}
        </TabsContent>

        <TabsContent value="resolved" className="mt-4">
          {filterByStatus("resolved").length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No hay reportes resueltos</p>
              </CardContent>
            </Card>
          ) : (
            filterByStatus("resolved").map((flag) => <FlagCard key={flag.id} flag={flag} />)
          )}
        </TabsContent>

        <TabsContent value="dismissed" className="mt-4">
          {filterByStatus("dismissed").length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No hay reportes descartados</p>
              </CardContent>
            </Card>
          ) : (
            filterByStatus("dismissed").map((flag) => <FlagCard key={flag.id} flag={flag} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModerationPanel;
