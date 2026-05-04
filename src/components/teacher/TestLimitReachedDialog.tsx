import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Trash2, AlertTriangle } from "lucide-react";
import { TEACHER_TIER_LABEL, type TeacherTier } from "@/lib/teacherLimits";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: TeacherTier;
  limit: number;
  onUpgrade?: () => void;
}

const TestLimitReachedDialog = ({ open, onOpenChange, tier, limit, onUpgrade }: Props) => {
  const description =
    tier === "unverified"
      ? `Ai atins limita de ${limit} teste salvate pentru ${TEACHER_TIER_LABEL[tier]}. Verifică-ți contul pentru 100 teste sau upgrade la Profesor AI pentru 150 teste. Alternativ, șterge teste vechi.`
      : tier === "verified"
      ? `Ai atins limita de ${limit} teste salvate pentru ${TEACHER_TIER_LABEL[tier]}. Treci la Profesor AI pentru 150 teste salvate, sau șterge teste vechi.`
      : `Ai atins limita maximă de ${limit} teste salvate. Șterge teste vechi pentru a face loc altora noi.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Limită atinsă
          </DialogTitle>
          <DialogDescription className="text-foreground/80 pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          {tier !== "ai" && onUpgrade && (
            <Button onClick={() => { onOpenChange(false); onUpgrade(); }} className="w-full gap-2">
              <Sparkles className="h-4 w-4" /> Upgrade la Profesor AI
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full gap-2">
            <Trash2 className="h-4 w-4" /> Șterge teste vechi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestLimitReachedDialog;
