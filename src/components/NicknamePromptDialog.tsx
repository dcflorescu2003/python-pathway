import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FUNNY_NICKNAMES, getDefaultNickname } from "@/lib/leaderboardIdentity";
import { toast } from "sonner";

const SNOOZE_MS = 24 * 60 * 60 * 1000;

/** Apare după o lecție finalizată dacă elevul nu și-a setat nickname-ul (cel mult o dată pe zi). */
export default function NicknamePromptDialog({ trigger }: { trigger: boolean }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const snoozeKey = user ? `pyro-nickname-snooze-${user.id}` : "";

  useEffect(() => {
    if (!trigger || !user) return;
    try {
      const last = Number(localStorage.getItem(snoozeKey) || 0);
      if (Date.now() - last < SNOOZE_MS) return;
    } catch {}
    let cancelled = false;
    supabase
      .from("profiles")
      .select("nickname, is_teacher")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data || data.is_teacher || data.nickname?.trim()) return;
        setTimeout(() => !cancelled && setOpen(true), 1200);
      });
    return () => { cancelled = true; };
  }, [trigger, user, snoozeKey]);

  if (!user) return null;

  const snooze = () => {
    try { localStorage.setItem(snoozeKey, String(Date.now())); } catch {}
    setOpen(false);
  };

  const save = async () => {
    const nick = value.trim();
    if (nick.length < 2 || nick.length > 20) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ nickname: nick }).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error("Nu am putut salva nickname-ul.");
    toast.success(`Salut, ${nick}! 🐍`);
    setOpen(false);
  };

  const suggestions = FUNNY_NICKNAMES.slice(0, 15);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : snooze())}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Alege-ți un nickname 🐍</DialogTitle>
          <DialogDescription>
            În clasamente apari acum ca <span className="font-mono text-primary">{getDefaultNickname(user.id)}</span>. Alege un nume al tău — colegii îl vor vedea în topuri.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setValue(s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-mono transition-colors ${
                value === s ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Input value={value} onChange={(e) => setValue(e.target.value)} maxLength={20} placeholder="Sau scrie-l tu (2–20 caractere)" />
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 touch-target" onClick={snooze}>Mai târziu</Button>
          <Button className="flex-1 touch-target" disabled={saving || value.trim().length < 2} onClick={save}>Salvează</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
