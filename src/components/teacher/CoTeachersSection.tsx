import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useClassTeachers, useCreateCoTeacherInvite, useRemoveCoTeacher } from "@/hooks/useTeacher";
import { useAuth } from "@/hooks/useAuth";
import { ChevronDown, ChevronRight, Copy, GraduationCap, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  classId: string;
  isOwner: boolean;
  onLeft?: () => void;
}

const CoTeachersSection = ({ classId, isOwner, onLeft }: Props) => {
  const { user } = useAuth();
  const { data: teachers = [] } = useClassTeachers(classId);
  const createInvite = useCreateCoTeacherInvite();
  const removeCo = useRemoveCoTeacher();
  const [open, setOpen] = useState(false);
  const [invite, setInvite] = useState<{ code: string; expires_at: string } | null>(null);

  const handleInvite = async () => {
    try {
      const res = await createInvite.mutateAsync(classId);
      setInvite(res);
    } catch (e: any) {
      toast.error(e?.message || "Nu am putut genera codul.");
    }
  };

  const handleRemove = async (teacherId: string, self: boolean) => {
    if (!confirm(self ? "Sigur vrei să părăsești această clasă?" : "Elimini acest co-profesor din clasă?")) return;
    try {
      await removeCo.mutateAsync({ classId, teacherId });
      toast.success(self ? "Ai părăsit clasa." : "Co-profesor eliminat.");
      if (self) onLeft?.();
    } catch (e: any) {
      toast.error(e?.message || "Eroare.");
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" /> Profesori ({teachers.length})
        </span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2">
        {teachers.map((t) => {
          const self = t.user_id === user?.id;
          const canRemove = t.role === "co" && (isOwner || self);
          return (
            <Card key={t.user_id}>
              <CardContent className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {t.display_name || "Profesor"} {self && <span className="text-muted-foreground">(tu)</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t.role === "owner" ? "Titular" : "Co-profesor"}</p>
                </div>
                {canRemove && (
                  <Button size="sm" variant="ghost" className="gap-1 text-xs text-destructive" onClick={() => handleRemove(t.user_id, self)}>
                    <UserMinus className="h-3.5 w-3.5" /> {self ? "Părăsește" : "Elimină"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {isOwner && (
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Un co-profesor poate vedea elevii și progresul lor, poate da provocări și poate nota testele date la această clasă.
                Nu poate șterge clasa sau elimina elevi.
              </p>
              {invite ? (
                <div className="space-y-1">
                  <button
                    onClick={() => { navigator.clipboard.writeText(invite.code); toast.success("Cod copiat!"); }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3 font-mono text-lg font-bold text-primary"
                  >
                    {invite.code} <Copy className="h-4 w-4" />
                  </button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Trimite codul colegului. Îl introduce la „Am un cod de co-profesor". Valabil până la{" "}
                    {new Date(invite.expires_at).toLocaleDateString("ro-RO")}, o singură folosire.
                  </p>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="w-full gap-1" onClick={handleInvite} disabled={createInvite.isPending}>
                  <UserPlus className="h-3.5 w-3.5" /> Adaugă co-profesor
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CoTeachersSection;
