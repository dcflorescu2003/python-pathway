import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface ComebackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  daysAway: number;
  onResume?: () => void;
}

const ComebackDialog = ({ open, onOpenChange, daysAway, onResume }: ComebackDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Bine ai revenit! 💚
          </DialogTitle>
          <DialogDescription>
            Au trecut <strong className="text-foreground">{daysAway} zile</strong> de când nu te-am mai văzut.
            Progresul tău e salvat și te așteaptă!
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
          <p>🐍 Continuă de unde ai rămas</p>
          <p>⭐ Reia ritmul cu o lecție scurtă</p>
          <p>🔥 Construiește un nou streak</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              onResume?.();
              onOpenChange(false);
            }}
            className="w-full"
          >
            Hai să codăm!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComebackDialog;
