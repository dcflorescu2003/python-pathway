import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Check if session already exists (hash was already processed by Supabase)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Parola trebuie să aibă minim 6 caractere.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Parolele nu se potrivesc.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      toast.success("Parola a fost schimbată!");
      setTimeout(() => navigate("/"), 2000);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <p className="text-muted-foreground text-sm mb-4">Link invalid sau expirat.</p>
        <Button variant="outline" onClick={() => navigate("/auth")}>
          Înapoi la autentificare
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background flex flex-col"
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[calc(var(--sat)+8px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/auth")} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Resetare parolă</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {success ? (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Parolă schimbată!</h1>
            <p className="text-sm text-muted-foreground">Vei fi redirecționat...</p>
          </motion.div>
        ) : (
          <>
            <div className="text-center mb-8">
              <span className="text-5xl mb-3 block">🔐</span>
              <h1 className="text-2xl font-bold text-foreground">Resetează parola</h1>
              <p className="text-sm text-muted-foreground mt-1">Alege o parolă nouă</p>
            </div>

            <Card className="w-full max-w-sm border-border">
              <CardContent className="p-5">
                <form onSubmit={handleReset} className="space-y-3">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Parola nouă"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirmă parola"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Se salvează..." : "Salvează parola"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ResetPasswordPage;
