import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2, ShieldAlert, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { useRealEmailReminder } from "@/hooks/useRealEmailReminder";
import { toast } from "sonner";

type Step = "email" | "code" | "password_only";

// Only iOS users can encounter Apple Hide-My-Email, so we limit this card
// to the iOS native runtime to avoid clutter on web/Android.
const isIOS = Capacitor.getPlatform() === "ios";

const RealEmailSetupCard = () => {
  const { user } = useAuth();
  const { isPrivateRelay, hasPassword, email, refresh: refreshAuth, loading } = useAuthMethods();
  const { hasVerifiedRealEmail, refresh: refreshReminder } = useRealEmailReminder();

  const [step, setStep] = useState<Step>("email");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  // Edge case: legacy user already has verified real email but no password → just password
  useEffect(() => {
    if (loading) return;
    if (hasVerifiedRealEmail && !hasPassword) setStep("password_only");
    else if (!hasVerifiedRealEmail) setStep("email");
  }, [loading, hasVerifiedRealEmail, hasPassword]);

  if (!isIOS) return null;
  if (loading) return null;
  if (!isPrivateRelay && !(hasVerifiedRealEmail && !hasPassword)) return null;

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

  const verifyAndSetPassword = async () => {
    if (code.length !== 6) {
      toast.error("Introdu codul de 6 cifre");
      return;
    }
    if (!hasPassword) {
      if (password.length < 8) {
        toast.error("Parola trebuie să aibă cel puțin 8 caractere");
        return;
      }
      if (password !== confirm) {
        toast.error("Parolele nu coincid");
        return;
      }
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("verify-email-change", {
      body: { code },
    });
    if (error || (data as any)?.error) {
      setBusy(false);
      toast.error((data as any)?.error || error?.message || "Cod greșit");
      return;
    }
    if (!hasPassword) {
      const { error: pwErr } = await supabase.auth.updateUser({ password });
      if (pwErr) {
        setBusy(false);
        toast.error(pwErr.message || "Email confirmat, dar nu am putut seta parola. Reîncearcă din Contul meu.");
        await refreshAuth();
        await refreshReminder();
        return;
      }
      if (user?.id) {
        await supabase
          .from("profiles")
          .update({ has_real_password: true })
          .eq("user_id", user.id);
      }
    }
    setBusy(false);
    toast.success("Cont configurat! Te poți loga de pe orice device.");
    setCode("");
    setNewEmail("");
    setPassword("");
    setConfirm("");
    await refreshAuth();
    await refreshReminder();
  };

  const savePasswordOnly = async () => {
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
    toast.success("Parolă setată! Te poți loga de pe orice device.");
    setPassword("");
    setConfirm("");
    await refreshAuth();
    await refreshReminder();
  };

  const totalSteps = step === "password_only" ? 1 : 2;
  const stepNumber = step === "email" ? 1 : step === "code" ? 2 : 1;

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
              {step === "password_only"
                ? "Setează o parolă pentru a te loga de pe orice device."
                : `Adaugă un email real${!hasPassword ? " și o parolă" : ""} pentru a-ți recupera contul și a te loga de pe orice device.`}
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
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Cod trimis la <strong>{newEmail}</strong>. Completează codul {!hasPassword && "și alege o parolă"} pentru a finaliza:
            </p>
            <div className="space-y-1">
              <Label htmlFor="otp-code" className="text-xs">Cod (6 cifre)</Label>
              <Input
                id="otp-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={busy}
                className="text-center font-mono text-lg tracking-widest"
              />
            </div>
            {!hasPassword && (
              <>
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
              </>
            )}
            <Button
              onClick={verifyAndSetPassword}
              disabled={busy || code.length !== 6 || (!hasPassword && (!password || !confirm))}
              size="sm"
              className="w-full gap-2"
            >
              <KeyRound className="h-4 w-4" />
              {busy ? "Se procesează..." : "Confirmă și finalizează"}
            </Button>
            <button
              onClick={() => { setStep("email"); setCode(""); setPassword(""); setConfirm(""); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
              disabled={busy}
            >
              Folosește alt email
            </button>
          </div>
        )}

        {step === "password_only" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Email verificat ✓ ({email}). Setează o parolă pentru login pe web.
            </p>
            <div className="space-y-1">
              <Label htmlFor="new-pw2" className="text-xs">Parolă nouă</Label>
              <Input
                id="new-pw2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min. 8 caractere"
                autoComplete="new-password"
                disabled={busy}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-pw2" className="text-xs">Confirmă parola</Label>
              <Input
                id="confirm-pw2"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="repetă parola"
                autoComplete="new-password"
                disabled={busy}
              />
            </div>
            <Button onClick={savePasswordOnly} disabled={busy || !password || !confirm} size="sm" className="w-full gap-2">
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
