import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2, ShieldAlert, KeyRound, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { useRealEmailReminder } from "@/hooks/useRealEmailReminder";
import { toast } from "sonner";

type Step = "email" | "code" | "password";

const RealEmailSetupCard = () => {
  const { isPrivateRelay, hasPassword, email, refresh: refreshAuth, loading } = useAuthMethods();
  const { hasVerifiedRealEmail, refresh: refreshReminder } = useRealEmailReminder();

  const [step, setStep] = useState<Step>("email");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  // Skip already-completed phases when card mounts / auth refreshes
  useEffect(() => {
    if (loading) return;
    if (hasVerifiedRealEmail && !hasPassword) setStep("password");
    else if (!hasVerifiedRealEmail) setStep("email");
  }, [loading, hasVerifiedRealEmail, hasPassword]);

  if (loading) return null;
  if (!isPrivateRelay && !(hasVerifiedRealEmail && !hasPassword)) return null;

  // Fully configured → green confirmation
  if (hasVerifiedRealEmail && hasPassword) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Cont complet configurat</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sendCode = async () => {
    if (!newEmail.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("request-email-change", {
      body: { new_email: newEmail.trim() },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Nu am putut trimite codul");
      return;
    }
    toast.success(`Cod trimis la ${newEmail}`);
    setStep("code");
  };

  const verifyCode = async () => {
    if (code.length !== 6) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("verify-email-change", {
      body: { code },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Cod greșit");
      return;
    }
    toast.success("Email confirmat!");
    await refreshAuth();
    await refreshReminder();
    setCode("");
    setNewEmail("");
    if (hasPassword) {
      // Already had password → done
      return;
    }
    setStep("password");
  };

  const savePassword = async () => {
    if (password.length < 8) {
      toast.error("Parola trebuie să aibă cel puțin 8 caractere");
      return;
    }
    if (password !== confirm) {
      toast.error("Parolele nu coincid");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message || "Nu s-a putut seta parola");
      return;
    }
    toast.success("Cont configurat! Te poți loga de pe orice device.");
    setPassword("");
    setConfirm("");
    await refreshAuth();
    await refreshReminder();
  };

  const stepNumber = step === "email" ? 1 : step === "code" ? 2 : 3;
  const totalSteps = hasPassword ? 2 : 3;

  return (
    <Card className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-500/15 p-2 shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">Finalizează contul</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Adaugă un email real{!hasPassword ? " și o parolă" : ""} pentru a-ți recupera contul și a te loga de pe orice device.
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Pasul {stepNumber} din {totalSteps}
            </p>
          </div>
        </div>

        {step === "email" && (
          <div className="space-y-2">
            <Label htmlFor="real-email" className="text-xs">Email real</Label>
            <div className="flex gap-2">
              <Input
                id="real-email"
                type="email"
                placeholder="emailul.tau@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={busy}
                className="text-sm"
              />
              <Button onClick={sendCode} disabled={busy || !newEmail.trim()} size="sm" className="gap-1 shrink-0">
                <Mail className="h-4 w-4" /> Trimite cod
              </Button>
            </div>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Cod trimis la <strong>{newEmail}</strong>. Introdu cele 6 cifre:
            </p>
            <div className="flex gap-2">
              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={busy}
                className="text-center font-mono text-lg tracking-widest"
              />
              <Button onClick={verifyCode} disabled={busy || code.length !== 6} size="sm" className="shrink-0 gap-1">
                Confirmă <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <button
              onClick={() => { setStep("email"); setCode(""); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
              disabled={busy}
            >
              Folosește alt email
            </button>
          </div>
        )}

        {step === "password" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Email verificat ✓. Setează o parolă pentru a te loga și de pe alte device-uri.
            </p>
            <div className="space-y-1">
              <Label htmlFor="new-pw" className="text-xs">Parolă nouă</Label>
              <Input
                id="new-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min. 8 caractere"
                autoComplete="new-password"
                disabled={busy}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-pw" className="text-xs">Confirmă parola</Label>
              <Input
                id="confirm-pw"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="repetă parola"
                autoComplete="new-password"
                disabled={busy}
              />
            </div>
            <Button onClick={savePassword} disabled={busy || !password || !confirm} size="sm" className="w-full gap-2">
              <KeyRound className="h-4 w-4" />
              {busy ? "Se salvează..." : "Finalizează"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealEmailSetupCard;
