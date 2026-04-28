import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { Globe, KeyRound, CheckCircle2, Info, Copy } from "lucide-react";
import { toast } from "sonner";

const WebLoginSetupCard = () => {
  const { hasApple, hasGoogle, hasPassword, email, isPrivateRelay, loading, refresh } =
    useAuthMethods();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"set" | "change">("set");

  if (loading) return null;

  // Show only if user has a social provider (Apple or Google).
  // Pure email/password users don't need this card unless they want to change password.
  const isSocialUser = hasApple || hasGoogle;
  if (!isSocialUser && !hasPassword) return null;

  const openDialog = (m: "set" | "change") => {
    setMode(m);
    setPassword("");
    setConfirm("");
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (password.length < 8) {
      toast.error("Parola trebuie să aibă cel puțin 8 caractere");
      return;
    }
    if (password !== confirm) {
      toast.error("Parolele nu coincid");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message || "Nu s-a putut seta parola");
      return;
    }
    toast.success(mode === "set" ? "Parolă setată! Te poți loga pe web." : "Parolă schimbată cu succes");
    setOpen(false);
    await refresh();
  };

  const copyEmail = () => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    toast.success("Email copiat");
  };

  const providerName = hasApple ? "Apple" : hasGoogle ? "Google" : "social";

  return (
    <>
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-mono text-sm font-semibold">
                {hasPassword ? "Login pe web activ" : "Activează login pe web"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {hasPassword
                  ? `Te poți loga de pe orice device cu email + parolă.`
                  : `Te-ai logat cu ${providerName}. Setează o parolă pentru a te loga și de pe PC.`}
              </p>
            </div>
            {hasPassword && (
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            )}
          </div>

          {email && (
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Email pentru login</div>
                  <div className="font-mono text-xs truncate">{email}</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyEmail}
                  className="shrink-0 h-8 w-8 p-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              {isPrivateRelay && (
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Email-ul tău Apple e privat. Apple îți redirecționează mesajele către adresa
                    reală. Folosește exact acest email la login pe web.
                  </span>
                </div>
              )}
            </div>
          )}

          {!hasPassword ? (
            <Button
              onClick={() => openDialog("set")}
              className="w-full"
              size="sm"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Setează parolă
            </Button>
          ) : (
            <Button
              onClick={() => openDialog("change")}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Schimbă parola
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {mode === "set" ? "Setează parolă pentru web" : "Schimbă parola"}
            </DialogTitle>
            <DialogDescription>
              {mode === "set"
                ? "După salvare te poți loga pe PC cu email + această parolă."
                : "Introdu noua parolă (minim 8 caractere)."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="new-password" className="text-xs">
                Parolă nouă
              </Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min. 8 caractere"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-password" className="text-xs">
                Confirmă parola
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="repetă parola"
                autoComplete="new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Anulează
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Se salvează..." : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WebLoginSetupCard;
