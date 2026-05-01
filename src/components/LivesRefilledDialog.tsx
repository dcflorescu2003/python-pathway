import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface LivesRefilledDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartLesson?: () => void;
}

const LivesRefilledDialog = ({ open, onOpenChange, onStartLesson }: LivesRefilledDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive fill-destructive" />
            Vieți pline! 5/5
          </DialogTitle>
          <DialogDescription>
            Toate inimile sunt regenerate. E momentul perfect pentru o lecție nouă!
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart key={i} className="h-10 w-10 text-destructive fill-destructive animate-pulse" />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              onStartLesson?.();
              onOpenChange(false);
            }}
            className="w-full"
          >
            Începe o lecție
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Mai târziu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LivesRefilledDialog;
