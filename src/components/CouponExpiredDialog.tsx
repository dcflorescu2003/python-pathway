import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Heart, Infinity, Loader2 } from "lucide-react";
import { useState } from "react";

const MONTHLY_PRICE_ID = "price_1TAd4JRsFs1XlxrbCSROnd55";
const YEARLY_PRICE_ID = "price_1TAd4cRsFs1XlxrbtFW1sT6U";

interface CouponExpiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: (priceId: string) => Promise<void>;
  onStayFree: () => void;
}

const CouponExpiredDialog = ({ open, onOpenChange, onSubscribe, onStayFree }: CouponExpiredDialogProps) => {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      await onSubscribe(priceId);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleStayFree = () => {
    onStayFree();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            ⏰ Cuponul a expirat
          </DialogTitle>
          <DialogDescription className="text-center text-foreground/70">
            Perioada ta gratuită de Premium s-a încheiat. Alege cum vrei să continui:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits reminder */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Heart className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-1">
                  Inimi nelimitate <Infinity className="h-4 w-4 text-destructive" />
                </p>
                <p className="text-xs text-foreground/60">Nu mai pierzi progresul</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSubscribe(MONTHLY_PRICE_ID)}
              disabled={!!checkoutLoading}
              className="relative rounded-xl border-2 border-border bg-card p-4 text-center hover:border-primary transition-colors disabled:opacity-50"
            >
              <p className="text-xs text-foreground/60 mb-1">Lunar</p>
              <p className="text-2xl font-bold text-foreground">5 <span className="text-sm font-normal">RON</span></p>
              <p className="text-xs text-foreground/50">/lună</p>
              {checkoutLoading === MONTHLY_PRICE_ID && (
                <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-primary" />
              )}
            </button>

            <button
              onClick={() => handleSubscribe(YEARLY_PRICE_ID)}
              disabled={!!checkoutLoading}
              className="relative rounded-xl border-2 border-primary bg-card p-4 text-center hover:border-primary/80 transition-colors disabled:opacity-50"
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                -17%
              </span>
              <p className="text-xs text-foreground/60 mb-1">Anual</p>
              <p className="text-2xl font-bold text-foreground">50 <span className="text-sm font-normal">RON</span></p>
              <p className="text-xs text-foreground/50">/an</p>
              {checkoutLoading === YEARLY_PRICE_ID && (
                <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-primary" />
              )}
            </button>
          </div>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleStayFree}
          >
            Rămân cu contul gratuit
          </Button>

          <p className="text-[10px] text-center text-foreground/40">
            Plata se procesează securizat prin Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CouponExpiredDialog;
