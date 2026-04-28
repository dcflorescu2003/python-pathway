import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail } from "lucide-react";
import { useRealEmailReminder } from "@/hooks/useRealEmailReminder";

const EXCLUDED_PREFIXES = ["/auth", "/reset-password", "/privacy-policy", "/terms", "/manual", "/lesson", "/test", "/problem", "/eval"];

const RealEmailReminderDialog = () => {
  const { shouldShow, markShown, dismissForever } = useRealEmailReminder();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [neverAgain, setNeverAgain] = useState(false);

  const isExcluded = EXCLUDED_PREFIXES.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (shouldShow && !isExcluded) {
      setOpen(true);
    }
  }, [shouldShow, isExcluded]);

  const handleClose = async () => {
    setOpen(false);
    if (neverAgain) {
      await dismissForever();
    } else {
      await markShown();
    }
  };

  const handleAddNow = async () => {
    setOpen(false);
    await markShown();
    navigate("/account");
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto rounded-full bg-amber-500/15 p-3 mb-2">
            <Mail className="h-6 w-6 text-amber-500" />
          </div>
          <DialogTitle className="text-center">Adaugă un email real</DialogTitle>
          <DialogDescription className="text-center">
            Folosești Apple Hide My Email. Adaugă o adresă reală pentru a putea recupera contul și să te poți loga pe web.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mt-2">
          <Checkbox id="never-again" checked={neverAgain} onCheckedChange={(v) => setNeverAgain(!!v)} />
          <label htmlFor="never-again" className="text-xs text-muted-foreground cursor-pointer select-none">
            Nu îmi mai aminti niciodată
          </label>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={handleAddNow} className="w-full">Adaugă acum</Button>
          <Button variant="ghost" onClick={handleClose} className="w-full">Mai târziu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RealEmailReminderDialog;
