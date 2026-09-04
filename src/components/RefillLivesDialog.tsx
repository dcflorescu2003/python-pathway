import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Heart, Clock } from "lucide-react";
import WatchAdForLivesButton from "./WatchAdForLivesButton";
import AppDownloadCTA from "./web/AppDownloadCTA";
import { Capacitor } from "@capacitor/core";

interface RefillLivesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lives: number;
  isPremium: boolean;
  onLivesGranted: (newLives: number, livesUpdatedAt: string) => void;
}

const MAX_LIVES = 5;

const RefillLivesDialog = ({ open, onOpenChange, lives, isPremium, onLivesGranted }: RefillLivesDialogProps) => {
  const isNative = Capacitor.isNativePlatform();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive fill-destructive" />
            Reîncarcă inimile
          </DialogTitle>
          <DialogDescription>
            Ai {lives} din {MAX_LIVES} inimi. Pierzi inimi când greșești într-o lecție.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-2">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart
              key={i}
              className={`h-8 w-8 ${i < lives ? "text-destructive fill-destructive" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>

        <div className="space-y-3">
          {isNative && !isPremium && (
            <WatchAdForLivesButton isPremium={isPremium} onLivesGranted={(newLives, livesUpdatedAt) => {
              onLivesGranted(newLives, livesUpdatedAt);
              onOpenChange(false);
            }} />
          )}

          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Sau, după ce rămâi fără inimi, așteaptă <strong className="text-foreground">30 de minute</strong> și toate cele 5 inimi se reîncarcă automat.
            </p>
          </div>

          {!isNative && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-center text-xs text-muted-foreground">
                Poți reîncărca inimile gratuit în aplicația mobilă urmărind o reclamă. Instalează PyRo din Google Play sau App Store.
              </p>
              <AppDownloadCTA showWebButton={false} className="justify-center" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RefillLivesDialog;
