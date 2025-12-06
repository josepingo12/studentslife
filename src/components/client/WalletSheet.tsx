import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, QrCode, Trash2 } from "lucide-react";
import QRCodeModal from "./QRCodeModal";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WalletSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const WalletSheet = ({ open, onOpenChange, userId }: WalletSheetProps) => {
  const { t } = useTranslation();
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qrToDelete, setQrToDelete] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchQRCodes();
    }
  }, [open, userId]);

  const fetchQRCodes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("qr_codes")
      .select(`
        *,
        events!inner(
          id,
          title,
          description,
          image_url,
          start_date,
          end_date,
          discount_percentage,
          partner_id
        )
      `)
      .eq("client_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch partner profiles for each QR code
      const qrCodesWithPartners = await Promise.all(
        data.map(async (qr) => {
          const { data: partnerProfile } = await supabase
            .from("profiles")
            .select("business_name, profile_image_url")
            .eq("id", qr.events.partner_id)
            .single();

          return {
            ...qr,
            partnerProfile,
          };
        })
      );

      setQrCodes(qrCodesWithPartners);
    }
    setLoading(false);
  };

  const handleQRClick = (qrCode: any) => {
    setSelectedEvent({
      ...qrCode.events,
      qrCode,
    });
    setShowQRModal(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, qr: any) => {
    e.stopPropagation();
    setQrToDelete(qr);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!qrToDelete) return;
    
    const { error } = await supabase
      .from("qr_codes")
      .delete()
      .eq("id", qrToDelete.id)
      .eq("client_id", userId);

    if (error) {
      toast.error(t("wallet.deleteError"));
    } else {
      toast.success(t("wallet.deleteSuccess"));
      setQrCodes(qrCodes.filter(qr => qr.id !== qrToDelete.id));
    }
    
    setDeleteDialogOpen(false);
    setQrToDelete(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-gradient-to-b from-background to-blue-50/30">
          <SheetHeader className="mb-2">
            <div className="flex items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <SheetTitle className="text-2xl font-bold">
                {t("wallet.title")}
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-3 overflow-y-auto h-[calc(85vh-120px)] px-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : qrCodes.length === 0 ? (
              <div className="text-center py-12 ios-card">
                <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("wallet.empty")}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("wallet.emptyHint")}
                </p>
              </div>
            ) : (
              qrCodes.map((qr) => (
                <div
                  key={qr.id}
                  className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all border border-border/50 hover:border-blue-200"
                >
                  <button
                    onClick={() => handleQRClick(qr)}
                    className="flex items-center gap-4 flex-1"
                  >
                    <div className="relative">
                      <Avatar className="h-16 w-16 ring-2 ring-blue-400/30">
                        <AvatarImage src={qr.partnerProfile?.profile_image_url} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-bold">
                          {qr.partnerProfile?.business_name?.[0] || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <QrCode className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 text-left">
                      <h4 className="font-bold text-base">{qr.events.title}</h4>
                      <p className="text-sm text-muted-foreground font-medium">
                        {qr.partnerProfile?.business_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {t("wallet.validUntil")}{" "}
                          {new Date(qr.events.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      {qr.events.discount_percentage && (
                        <div className="inline-block mt-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                          -{qr.events.discount_percentage}%
                        </div>
                      )}
                    </div>

                    <div className="text-blue-500">
                      →
                    </div>
                  </button>

                  <button
                    onClick={(e) => handleDeleteClick(e, qr)}
                    className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("wallet.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("wallet.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedEvent && (
        <QRCodeModal
          event={selectedEvent}
          open={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </>
  );
};

export default WalletSheet;
