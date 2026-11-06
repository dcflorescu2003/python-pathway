import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useColleagues, useShareTest, useTestShares } from "@/hooks/useTestSharing";
import { toast } from "sonner";

interface Props {
  testId: string | null;
  testTitle?: string;
  onOpenChange: (open: boolean) => void;
}

const ShareTestDialog = ({ testId, testTitle, onOpenChange }: Props) => {
  const { data: colleagues = [], isLoading } = useColleagues();
  const { data: current = [] } = useTestShares(testId);
  const share = useShareTest();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => setSelected(current), [current, testId]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const save = async () => {
    if (!testId) return;
    try {
      await share.mutateAsync({ testId, teacherIds: selected });
      toast.success(selected.length ? "Partajare actualizată." : "Partajarea a fost retrasă.");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Eroare la partajare.");
    }
  };

  return (
    <Dialog open={!!testId} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partajează testul</DialogTitle>
          <DialogDescription>
            {testTitle ? `„${testTitle}” — ` : ""}colegii pot vedea testul, îl pot duplica și pot discuta cu tine. Doar tu îl poți modifica.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Se încarcă...</p>
        ) : colleagues.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nu ai încă co-profesori. Invită un coleg într-una din clasele tale ca să poți partaja teste.
          </p>
        ) : (
          <div className="space-y-1">
            {colleagues.map((c) => (
              <label key={c.user_id} className="flex items-center gap-3 rounded-md p-2 min-h-[48px] hover:bg-muted cursor-pointer">
                <Checkbox checked={selected.includes(c.user_id)} onCheckedChange={() => toggle(c.user_id)} />
                <span className="text-sm text-foreground">{c.display_name}</span>
              </label>
            ))}
          </div>
        )}
        <Button onClick={save} disabled={share.isPending || colleagues.length === 0} className="w-full">
          {share.isPending ? "Se salvează..." : "Salvează"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTestDialog;
