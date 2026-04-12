import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, Sparkles, FileText, Brain, BarChart3, CheckCircle2, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, TEACHER_MONTHLY_PRICE, TEACHER_YEARLY_PRICE } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface TeacherPremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeacherPremiumDialog = ({ open, onOpenChange }: TeacherPremiumDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isTeacherPremium, subscriptionEnd, loading, startCheckout, openPortal } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handlePurchase = async (priceId: string) => {
    if (!user) {
      onOpenChange(false);
      navigate("/auth");
      return;
    }
    setCheckoutLoading(priceId);
    try {
      await startCheckout(priceId);
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManage = async () => {
    try {
      await openPortal();
    } catch (err) {
      console.error("Portal error:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Profesor AI
          </DialogTitle>
          <DialogDescription className="text-center text-foreground/70">
            Instrumente AI pentru profesori
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : isTeacherPremium ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">🎓</div>
              <p className="text-lg font-bold text-primary">Profesor AI activ!</p>
              <p className="text-sm text-foreground/70">
                Ai acces la toate funcționalitățile AI pentru profesori.
              </p>
              {subscriptionEnd && (
                <p className="text-xs text-foreground/50">
                  Activ până la: {new Date(subscriptionEnd).toLocaleDateString("ro-RO")}
                </p>
              )}
              <Button variant="outline" onClick={handleManage} className="mt-2 gap-2">
                <Settings className="h-4 w-4" />
                Gestionează abonamentul
              </Button>
            </div>
          ) : (
            <>
              {/* Free tier */}
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Free</p>
                </div>
                <ul className="space-y-1 text-xs text-foreground/60">
                  <li>• Gestionare clase și elevi</li>
                  <li>• Atribuire provocări</li>
                  <li>• Vizualizare progres de bază</li>
                </ul>
              </div>

              {/* AI tier benefits */}
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">Profesor AI</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-foreground/70">Până la <span className="font-semibold text-foreground">10 teste/lună</span> cu max. 3 itemi AI/test</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-foreground/70"><span className="font-semibold text-foreground">Feedback AI</span> automat pentru elevi</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <BarChart3 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-foreground/70"><span className="font-semibold text-foreground">Statistici și rapoarte</span> avansate</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-foreground/70"><span className="font-semibold text-foreground">Corectura probleme</span> folosind AI</p>
                  </div>
                </div>
              </div>

              {/* Pricing cards */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePurchase(TEACHER_MONTHLY_PRICE)}
                  disabled={!!checkoutLoading}
                  className="relative rounded-xl border-2 border-border bg-card p-4 text-center hover:border-primary transition-colors disabled:opacity-50"
                >
                  <p className="text-xs text-foreground/60 mb-1">Lunar</p>
                  <p className="text-2xl font-bold text-foreground">29 <span className="text-sm font-normal">RON</span></p>
                  <p className="text-xs text-foreground/50">/lună</p>
                  {checkoutLoading === TEACHER_MONTHLY_PRICE && (
                    <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-primary" />
                  )}
                </button>

                <button
                  onClick={() => handlePurchase(TEACHER_YEARLY_PRICE)}
                  disabled={!!checkoutLoading}
                  className="relative rounded-xl border-2 border-primary bg-card p-4 text-center hover:border-primary/80 transition-colors disabled:opacity-50"
                >
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px]">
                    -14%
                  </Badge>
                  <p className="text-xs text-foreground/60 mb-1">Anual</p>
                  <p className="text-2xl font-bold text-foreground">299 <span className="text-sm font-normal">RON</span></p>
                  <p className="text-xs text-foreground/50">/an</p>
                  {checkoutLoading === TEACHER_YEARLY_PRICE && (
                    <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-primary" />
                  )}
                </button>
              </div>

              <p className="text-[10px] text-center text-foreground/40">
                Preț de fondator, valabil în 2026
              </p>
              <p className="text-[10px] text-center text-foreground/40">
                Plata se procesează securizat prin Stripe
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherPremiumDialog;
