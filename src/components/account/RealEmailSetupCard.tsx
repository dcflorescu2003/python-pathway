import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { useRealEmailReminder } from "@/hooks/useRealEmailReminder";
import { toast } from "sonner";

const RealEmailSetupCard = () => {
  const { isPrivateRelay, email, refresh: refreshAuth, loading } = useAuthMethods();
  const { hasVerifiedRealEmail, refresh: refreshReminder } = useRealEmailReminder();
  const [step, setStep] = useState<"input" | "code">("input");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading || !isPrivateRelay) return null;

  if (hasVerifiedRealEmail) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Email real verificat</p>
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
    toast.success("Email schimbat cu succes!");
    setStep("input");
    setCode("");
    setNewEmail("");
    await refreshAuth();
    await refreshReminder();
  };

  return (
    <Card className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-500/15 p-2 shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">Adaugă un email real</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Folosești <span className="font-mono">@privaterelay.appleid.com</span>. Adaugă o adresă reală pentru a putea recupera contul și loga pe web.
            </p>
          </div>
        </div>

        {step === "input" ? (
          <div className="flex gap-2">
            <Input
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
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Cod trimis la <strong>{newEmail}</strong>. Introdu cele 6 cifre:</p>
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
              <Button onClick={verifyCode} disabled={busy || code.length !== 6} size="sm" className="shrink-0">
                Verifică
              </Button>
            </div>
            <button
              onClick={() => { setStep("input"); setCode(""); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Folosește alt email
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealEmailSetupCard;
