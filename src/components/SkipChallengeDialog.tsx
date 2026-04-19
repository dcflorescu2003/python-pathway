import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Zap, AlertTriangle, Clock } from "lucide-react";

interface SkipChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  lessonTitle: string;
  realLives: number;
  cooldownRemainingMs?: number;
}

const SkipChallengeDialog = ({ open, onOpenChange, lessonId, lessonTitle, realLives, cooldownRemainingMs }: SkipChallengeDialogProps) => {
  const navigate = useNavigate();

  const onCooldown = (cooldownRemainingMs ?? 0) > 0;
  const cooldownMin = Math.ceil((cooldownRemainingMs ?? 0) / 60000);

  const handleStart = () => {
    onOpenChange(false);
    navigate(`/skip-challenge/${lessonId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/15 border-2 border-yellow-500/40">
            <Zap className="h-7 w-7 text-yellow-500" />
          </div>
          <DialogTitle className="text-center">Sari peste această lecție?</DialogTitle>
          <DialogDescription className="text-center">
            Poți debloca <span className="font-bold text-foreground">{lessonTitle}</span> trecând o provocare cu 20 de întrebări din lecțiile anterioare.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm">
            <div className="flex items-start gap-2">
              <Heart className="mt-0.5 h-4 w-4 shrink-0 fill-yellow-500 text-yellow-500" />
              <p className="text-foreground/80">
                Ai <span className="font-bold text-yellow-500">3 vieți speciale</span> pentru provocare. Dacă le pierzi, provocarea eșuează.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <div className="flex items-start gap-2">
              <Heart className="mt-0.5 h-4 w-4 shrink-0 fill-destructive text-destructive" />
              <p className="text-foreground/80">
                Fiecare greșeală scade și o viață reală din cele 5. Acum ai <span className="font-bold">{realLives}</span>.
              </p>
            </div>
          </div>

          {!onCooldown && realLives < 3 && (
            <div className="rounded-lg border border-orange-500/40 bg-orange-500/10 p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <p className="text-foreground/80">
                  Atenție! Ai doar {realLives} {realLives === 1 ? "viață" : "vieți"} reale. Riști să rămâi blocat din lecțiile normale.
                </p>
              </div>
            </div>
          )}

          {onCooldown && (
            <div className="rounded-lg border border-muted-foreground/30 bg-muted p-3 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-foreground/80">
                  Mai poți încerca peste <span className="font-bold">{cooldownMin} min</span> (cooldown după eșecul precedent).
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-col-reverse sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Anulează
          </Button>
          <Button
            onClick={handleStart}
            disabled={onCooldown || realLives <= 0}
            className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
          >
            <Zap className="mr-2 h-4 w-4" /> Începe provocarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SkipChallengeDialog;
