import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, Loader2, Crown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DeleteAccountPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { subscribed, loading: subLoading, openPortal } = useSubscription();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"subscription-warning" | "warning" | "confirm">("warning");
  const [showFinalDialog, setShowFinalDialog] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  // Check if user is a teacher
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_teacher")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.is_teacher) setIsTeacher(true);
      });
  }, [user]);
  // If user has active subscription, show subscription warning first
  useEffect(() => {
    if (!subLoading && subscribed) {
      setStep("subscription-warning");
    }
  }, [subLoading, subscribed]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleDelete = async () => {
    if (confirmText !== "STERGE") return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Trebuie să fii autentificat.");
        return;
      }

      const response = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        toast.error("Eroare la ștergerea contului. Încearcă din nou.");
        return;
      }

      await signOut();
      toast.success("Contul tău a fost șters cu succes.");
      navigate("/auth", { replace: true });
    } catch {
      toast.error("Eroare la ștergerea contului.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background"
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/auth")} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-destructive">Ștergere cont</h1>
        </div>
      </header>

      <main className="px-6 py-8 max-w-sm mx-auto">
        {step === "subscription-warning" ? (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Crown className="h-10 w-10 text-yellow-500" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Ai un abonament activ</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Înainte de a-ți șterge contul, te rugăm să anulezi abonamentul Premium. 
                Ștergerea contului <strong className="text-destructive">nu anulează automat</strong> plățile recurente.
              </p>
            </div>

            <Card className="border-yellow-500/30">
              <CardContent className="p-4 text-left space-y-2">
                <p className="text-sm text-foreground flex items-center gap-2">⚠️ Abonamentul va continua să fie facturat</p>
                <p className="text-sm text-foreground flex items-center gap-2">💳 Anulează din portalul de plăți</p>
                <p className="text-sm text-foreground flex items-center gap-2">✅ După anulare, poți șterge contul</p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                className="w-full gap-2"
                onClick={async () => {
                  try { await openPortal(); } catch { toast.error("Eroare la deschiderea portalului."); }
                }}
              >
                <Settings className="h-4 w-4" />
                Gestionează abonamentul
              </Button>
              <Button
                variant="outline"
                className="w-full text-muted-foreground"
                onClick={() => setStep("warning")}
              >
                Continuă oricum cu ștergerea
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Anulează
              </Button>
            </div>
          </div>
        ) : step === "warning" ? (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Ești sigur?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ștergerea contului este <strong className="text-destructive">permanentă și ireversibilă</strong>. 
                Toate datele tale vor fi șterse definitiv:
              </p>
            </div>

            <Card className="border-destructive/30">
              <CardContent className="p-4 text-left space-y-2">
                <p className="text-sm text-foreground flex items-center gap-2">❌ Progresul tău (XP, lecții completate)</p>
                <p className="text-sm text-foreground flex items-center gap-2">❌ Profilul și seria zilnică</p>
                <p className="text-sm text-foreground flex items-center gap-2">❌ Statusul premium și cupoanele</p>
                <p className="text-sm text-foreground flex items-center gap-2">❌ Datele de autentificare</p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setStep("confirm")}
              >
                Vreau să șterg contul
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Anulează
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">Confirmare finală</h2>
              <p className="text-sm text-muted-foreground">
                Scrie <strong className="text-destructive font-mono">STERGE</strong> mai jos pentru a confirma ștergerea contului.
              </p>
            </div>

            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Scrie STERGE aici"
              className="text-center font-mono text-lg"
              autoFocus
            />

            <div className="space-y-3">
              <Button
                variant="destructive"
                className="w-full gap-2"
                disabled={confirmText !== "STERGE" || loading}
                onClick={handleDelete}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se procesează...
                  </>
                ) : (
                  "Șterge contul definitiv"
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep("warning")}
                disabled={loading}
              >
                Înapoi
              </Button>
            </div>
          </div>
        )}
      </main>
    </motion.div>
  );
};

export default DeleteAccountPage;
