import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Download, Share, MoreVertical, PlusSquare } from "lucide-react";

interface InstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InstallDialog = ({ open, onOpenChange }: InstallDialogProps) => {
  const { platform, canPrompt, promptInstall } = useInstallPrompt();

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader className="text-center items-center">
          <div className="text-4xl mb-2">🐍</div>
          <DialogTitle className="text-xl font-bold">
            Instalează PyRo 🚀
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Învață Python mai rapid
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Android / Chrome section */}
          <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              🤖 Android / Chrome
            </h3>
            {canPrompt ? (
              <Button onClick={handleInstall} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Instalează acum
              </Button>
            ) : (
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <MoreVertical className="h-4 w-4 mt-0.5 shrink-0 text-foreground" />
                  <span>Apasă pe <strong className="text-foreground">⋮</strong> (meniul browserului)</span>
                </li>
                <li className="flex items-start gap-2">
                  <PlusSquare className="h-4 w-4 mt-0.5 shrink-0 text-foreground" />
                  <span>Selectează <strong className="text-foreground">"Adaugă pe ecranul principal"</strong></span>
                </li>
              </ol>
            )}
          </div>

          {/* iOS section */}
          <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              🍎 iPhone / iPad
            </h3>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="shrink-0 text-foreground font-bold">1.</span>
                <span>Deschide în <strong className="text-foreground">Safari</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <Share className="h-4 w-4 mt-0.5 shrink-0 text-foreground" />
                <span>Apasă pe <strong className="text-foreground">Share</strong> (iconița cu săgeata)</span>
              </li>
              <li className="flex items-start gap-2">
                <PlusSquare className="h-4 w-4 mt-0.5 shrink-0 text-foreground" />
                <span>Selectează <strong className="text-foreground">"Add to Home Screen"</strong></span>
              </li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallDialog;
