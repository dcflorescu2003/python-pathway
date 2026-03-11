import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Zap, Crown, Infinity } from "lucide-react";

interface PremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPremium: boolean;
}

const PremiumDialog = ({ open, onOpenChange, isPremium }: PremiumDialogProps) => {
  const handlePurchase = () => {
    // Google Play Billing va fi integrat din Android Studio
    // Deocamdată afișăm un mesaj
    alert("Plata va fi procesată prin Google Play. Funcționalitate disponibilă în curând!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            PyLearn Premium
          </DialogTitle>
          <DialogDescription className="text-center text-foreground/70">
            Deblochează experiența completă
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isPremium ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">👑</div>
              <p className="text-lg font-bold text-primary">Ești Premium!</p>
              <p className="text-sm text-foreground/70">
                Te bucuri de inimi nelimitate și acces complet.
              </p>
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
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Încercări nelimitate</p>
                    <p className="text-xs text-foreground/60">Repetă orice lecție oricând</p>
                  </div>
                </div>
              </div>

              <Button onClick={handlePurchase} className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white">
                💎 Devino Premium
              </Button>
              <p className="text-[10px] text-center text-foreground/40">
                Plata se procesează prin Google Play
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumDialog;
