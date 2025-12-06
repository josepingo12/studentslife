import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditCard, Sparkles, Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import LoyaltyRewardPopup from "./LoyaltyRewardPopup";

interface LoyaltyCardsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

interface StampData {
  id: string;
  stamps_count: number;
  reward_claimed: boolean;
  partner_id: string;
  loyalty_card_id: string;
  partner_profile?: {
    business_name: string | null;
    profile_image_url: string | null;
  };
  loyalty_card?: {
    reward_description: string;
    stamps_required: number;
  };
}

const LoyaltyCardsSheet = ({ open, onOpenChange, clientId }: LoyaltyCardsSheetProps) => {
  const { t } = useTranslation();
  const [stamps, setStamps] = useState<StampData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const [currentReward, setCurrentReward] = useState<{ partnerName: string; reward: string } | null>(null);

  useEffect(() => {
    if (open) {
      fetchStamps();
      subscribeToStamps();
    }
  }, [open, clientId]);

  const fetchStamps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_stamps")
      .select(`
        *,
        partner_profile:profiles!client_stamps_partner_id_fkey(business_name, profile_image_url),
        loyalty_card:loyalty_cards!client_stamps_loyalty_card_id_fkey(reward_description, stamps_required)
      `)
      .eq("client_id", clientId);

    if (data) {
      setStamps(data as unknown as StampData[]);
      
      // Check for completed cards that haven't been claimed
      const completedUnclaimed = data.find(
        (s: any) => s.stamps_count >= (s.loyalty_card?.stamps_required || 10) && !s.reward_claimed
      );
      
      if (completedUnclaimed) {
        setCurrentReward({
          partnerName: (completedUnclaimed as any).partner_profile?.business_name || "Partner",
          reward: (completedUnclaimed as any).loyalty_card?.reward_description || "",
        });
        setShowReward(true);
      }
    }
    setLoading(false);
  };

  const subscribeToStamps = () => {
    const channel = supabase
      .channel("client-stamps-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_stamps",
          filter: `client_id=eq.${clientId}`,
        },
        async (payload) => {
          fetchStamps();
          
          // Check if stamp was just added and card is now complete
          if (payload.eventType === "UPDATE") {
            const newData = payload.new as any;
            if (newData.stamps_count >= 10 && !newData.reward_claimed) {
              // Fetch partner info for the reward popup
              const { data: partnerData } = await supabase
                .from("profiles")
                .select("business_name")
                .eq("id", newData.partner_id)
                .single();

              const { data: cardData } = await supabase
                .from("loyalty_cards")
                .select("reward_description")
                .eq("id", newData.loyalty_card_id)
                .single();

              if (partnerData && cardData) {
                setCurrentReward({
                  partnerName: partnerData.business_name || "Partner",
                  reward: cardData.reward_description,
                });
                setShowReward(true);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleClaimReward = async (stampData: StampData) => {
    // Mark as claimed
    await supabase
      .from("client_stamps")
      .update({ 
        reward_claimed: true,
        stamps_count: 0 // Reset stamps after claiming
      })
      .eq("id", stampData.id);

    setShowReward(false);
    fetchStamps();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center justify-center gap-2 text-xl">
              <CreditCard className="w-6 h-6 text-primary" />
              {t("loyaltyCard.myCards")}
            </SheetTitle>
          </SheetHeader>

          <div className="overflow-y-auto h-[calc(100%-80px)] pb-8">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : stamps.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t("loyaltyCard.noCards")}</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  {t("loyaltyCard.noCardsDescription")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stamps.map((stamp) => {
                  const stampsRequired = stamp.loyalty_card?.stamps_required || 10;
                  const isComplete = stamp.stamps_count >= stampsRequired;
                  
                  return (
                    <div
                      key={stamp.id}
                      className={`relative overflow-hidden rounded-2xl p-5 ${
                        isComplete
                          ? "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500"
                          : "bg-gradient-to-br from-primary via-primary/90 to-cyan-500"
                      } text-white`}
                    >
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                      
                      {isComplete && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                            <Gift className="w-4 h-4" />
                            <span className="text-xs font-bold">{t("loyaltyCard.claimNow")}</span>
                          </div>
                        </div>
                      )}

                      <div className="relative">
                        {/* Partner info */}
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-12 w-12 ring-2 ring-white/30">
                            <AvatarImage src={stamp.partner_profile?.profile_image_url || undefined} />
                            <AvatarFallback className="bg-white/20 text-white font-bold">
                              {(stamp.partner_profile?.business_name || "P")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-lg">
                              {stamp.partner_profile?.business_name || "Partner"}
                            </h3>
                            <p className="text-white/80 text-sm flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {stamp.loyalty_card?.reward_description}
                            </p>
                          </div>
                        </div>

                        {/* Stamps grid */}
                        <div className="grid grid-cols-5 gap-2 mb-3">
                          {[...Array(stampsRequired)].map((_, i) => (
                            <div
                              key={i}
                              className={`aspect-square rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                i < stamp.stamps_count
                                  ? "bg-white/40 border-white scale-100"
                                  : "bg-transparent border-white/40 scale-95"
                              }`}
                            >
                              {i < stamp.stamps_count && (
                                <span className="text-sm font-bold animate-scale-in">✓</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Progress */}
                        <div className="flex items-center justify-between">
                          <span className="text-white/90 text-sm font-medium">
                            {stamp.stamps_count}/{stampsRequired} {t("loyaltyCard.stamps")}
                          </span>
                          {isComplete && (
                            <button
                              onClick={() => handleClaimReward(stamp)}
                              className="bg-white text-primary font-bold px-4 py-2 rounded-full text-sm hover:scale-105 transition-transform"
                            >
                              {t("loyaltyCard.claim")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {currentReward && (
        <LoyaltyRewardPopup
          open={showReward}
          onOpenChange={setShowReward}
          partnerName={currentReward.partnerName}
          reward={currentReward.reward}
        />
      )}
    </>
  );
};

export default LoyaltyCardsSheet;
