import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Crown, Infinity, Loader2, Settings, ShieldCheck, Code, BarChart3, Trophy, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, STUDENT_MONTHLY_PRICE } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

interface PremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PremiumDialog = ({ open, onOpenChange }: PremiumDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscribed, subscriptionEnd, loading, startCheckout, openPortal } = useSubscription();
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Elev Premium
          </DialogTitle>
          <DialogDescription className="text-center text-foreground/70">
            Deblochează experiența completă
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : subscribed ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">👑</div>
              <p className="text-lg font-bold text-primary">Ești Premium!</p>
              <p className="text-sm text-foreground/70">
                Te bucuri de inimi nelimitate și acces complet.
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
              <div className="space-y-3">
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

                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Fără reclame</p>
                    <p className="text-xs text-foreground/60">Experiență curată și mai fluidă</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/50">
                    <BarChart3 className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Sumar personalizat</p>
                    <p className="text-xs text-foreground/60">Unde te descurci bine vs. unde ai nevoie de exercițiu</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Challenge-uri premium</p>
                    <p className="text-xs text-foreground/60">Acces la toate provocările și funcțiile premium</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/50">
                    <Code className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Probleme premium</p>
                    <p className="text-xs text-foreground/60">Acces la toate provocările de cod</p>
                  </div>
                </div>
              </div>

              {/* Pricing cards */}
              <div className="flex justify-center">
                <button
                  onClick={() => handlePurchase(STUDENT_MONTHLY_PRICE)}
                  disabled={!!checkoutLoading}
                  className="relative w-full rounded-xl border-2 border-primary bg-card p-4 text-center hover:border-primary/80 transition-colors disabled:opacity-50"
                >
                  <p className="text-xs text-foreground/60 mb-1">Lunar</p>
                  <p className="text-2xl font-bold text-foreground">14,99 <span className="text-sm font-normal">RON</span></p>
                  <p className="text-xs text-foreground/50">/lună</p>
                  {checkoutLoading === STUDENT_MONTHLY_PRICE && (
                    <Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-primary" />
                  )}
                </button>
              </div>

              <p className="text-[10px] text-center text-foreground/40">
                Preț de fondator
              </p>

              {!user && (
                <p className="text-[10px] text-center text-foreground/40">
                  Trebuie să fii autentificat pentru a te abona
                </p>
              )}
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

export default PremiumDialog;
