import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Heart, Infinity, Loader2, GraduationCap, Brain, BarChart3 } from "lucide-react";
import { useState } from "react";
import {
  STUDENT_MONTHLY_PRICE,
  STUDENT_YEARLY_PRICE,
  TEACHER_MONTHLY_PRICE,
  TEACHER_YEARLY_PRICE,
} from "@/hooks/useSubscription";

interface CouponExpiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: (priceId: string) => Promise<void>;
  onStayFree: () => void;
  couponType?: string | null;
}

const CouponExpiredDialog = ({ open, onOpenChange, onSubscribe, onStayFree, couponType }: CouponExpiredDialogProps) => {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const isTeacher = couponType === "teacher";

  const monthlyPrice = isTeacher ? TEACHER_MONTHLY_PRICE : STUDENT_MONTHLY_PRICE;
  const yearlyPrice = isTeacher ? TEACHER_YEARLY_PRICE : STUDENT_YEARLY_PRICE;
  const monthlyAmount = isTeacher ? 15 : 5;
  const yearlyAmount = isTeacher ? 150 : 50;

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
            {isTeacher
              ? "Perioada ta gratuită de Profesor AI s-a încheiat. Prelungește pentru a păstra beneficiile!"
              : "Perioada ta gratuită de Premium s-a încheiat. Alege cum vrei să continui:"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits reminder */}
          <div className="space-y-2">
            {isTeacher ? (
              <>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Corectare AI automată</p>
                    <p className="text-xs text-foreground/60">Teste corectate instant cu AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Statistici avansate</p>
                    <p className="text-xs text-foreground/60">Rapoarte detaliate per clasă</p>
                  </div>
                </div>
              </>
            ) : (
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
            )}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSubscribe(monthlyPrice)}
              disabled={!!checkoutLoading}
              className="relative rounded-xl border-2 border-border bg-card p-4 text-center hover:border-primary transition-colors disabled:opacity-50"
            >
              <p className="text-xs text-foreground/60 mb-1">Lunar</p>
              <p className="text-2xl font-bold text-foreground">{monthlyAmount} <span className="text-sm font-normal">RON</span></p>
              <p className="text-xs text-foreground/50">/lună</p>
              {checkoutLoading === monthlyPrice && (
                <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-primary" />
              )}
            </button>

            <button
              onClick={() => handleSubscribe(yearlyPrice)}
              disabled={!!checkoutLoading}
              className="relative rounded-xl border-2 border-primary bg-card p-4 text-center hover:border-primary/80 transition-colors disabled:opacity-50"
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                -17%
              </span>
              <p className="text-xs text-foreground/60 mb-1">Anual</p>
              <p className="text-2xl font-bold text-foreground">{yearlyAmount} <span className="text-sm font-normal">RON</span></p>
              <p className="text-xs text-foreground/50">/an</p>
              {checkoutLoading === yearlyPrice && (
                <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-primary" />
              )}
            </button>
          </div>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleStayFree}
          >
            {isTeacher ? "Revin la contul gratuit de profesor" : "Rămân cu contul gratuit"}
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
