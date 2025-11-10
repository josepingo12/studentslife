import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PartnerReviewsProps {
  partnerId: string;
  reviews: any[];
  onReviewAdded: () => void;
}

const PartnerReviews = ({ partnerId, reviews, onReviewAdded }: PartnerReviewsProps) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per lasciare una recensione",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("reviews")
      .insert({
        partner_id: partnerId,
        client_id: user.id,
        rating,
        comment,
      });

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare la recensione",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Recensione pubblicata!",
        description: "Grazie per il tuo feedback",
      });
      setShowForm(false);
      setComment("");
      setRating(5);
      onReviewAdded();
    }

    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Add Review Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full ios-button h-12"
          variant="outline"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          {t('partner.leaveReview')}
        </Button>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="ios-card p-4 space-y-4">
          <h3 className="font-bold">{t('partner.leaveYourReview')}</h3>
          
          {/* Star Rating */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Comment */}
          <Textarea
            placeholder="Scrivi la tua recensione (opzionale)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="ios-input min-h-24"
          />

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 ios-button"
            >
              {submitting ? "Invio..." : "Pubblica"}
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              Annulla
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nessuna recensione ancora</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review, index) => (
            <div key={index} className="ios-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {review.profiles?.first_name} {review.profiles?.last_name}
                  </span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("it-IT")}
                </span>
              </div>
              {review.comment && (
                <p className="text-muted-foreground text-sm">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerReviews;
