import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { getStoredChapters } from "@/hooks/useExerciseStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, LogOut, BookOpen, XCircle, Code, Zap, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";

const AccountView = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { progress } = useProgress();
  const chapters = getStoredChapters();

  const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const completedCount = Object.values(progress.completedLessons).filter(l => l.completed).length;
  
  // Calculate total mistakes (lessons where score < 100)
  const totalMistakes = Object.values(progress.completedLessons)
    .filter(l => l.completed)
    .reduce((sum, l) => sum + Math.max(0, 100 - l.score), 0);

  // Problems solved (from problems page — count completed problem lessons starting with "problem-")
  const problemsSolved = Object.keys(progress.completedLessons)
    .filter(id => id.startsWith("problem-") && progress.completedLessons[id]?.completed).length;

  const handleSignOut = async () => {
    await signOut();
    toast.success("Te-ai deconectat.");
    navigate("/auth");
  };

  const stats = [
    { icon: BookOpen, label: "Lecții completate", value: `${completedCount}/${totalLessons}`, color: "text-primary" },
    { icon: XCircle, label: "Puncte pierdute", value: totalMistakes, color: "text-destructive" },
    { icon: Code, label: "Probleme rezolvate", value: problemsSolved, color: "text-accent-foreground" },
    { icon: Zap, label: "XP total", value: progress.xp, color: "text-xp" },
    { icon: Flame, label: "Serie zilnică", value: `${progress.streak} zile`, color: "text-warning" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background flex flex-col"
    >
      <div className="px-4 pt-4">
        <button onClick={() => navigate("/")} className="active:scale-90 transition-transform">
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl mb-4">
          🐍
        </div>
        <h1 className="text-xl font-bold text-foreground mb-1">
          {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pythonist"}
        </h1>
        <p className="text-sm text-muted-foreground mb-1">{user?.email}</p>
        {progress.isPremium && (
          <span className="text-xs font-medium text-yellow-500 flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5" /> Premium activ
          </span>
        )}

        <Card className="w-full max-w-sm mt-6 border-border">
          <CardContent className="p-4 space-y-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                    <span className="text-sm text-foreground">{stat.label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{stat.value}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full max-w-sm mt-6 gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Deconectează-te
        </Button>
      </div>
    </motion.div>
  );
};

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn, signInWithGoogle, signInWithApple } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If logged in, show account view
  if (user) return <AccountView />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (!isLogin && !displayName.trim()) {
      toast.error("Introdu un nume de afișare.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message === "Invalid login credentials" ? "Email sau parolă greșită." : error.message);
        } else {
          toast.success("Bine ai revenit! 👋");
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Cont creat! Verifică-ți emailul pentru confirmare. 📬");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error.message);
  };

  const handleAppleLogin = async () => {
    const { error } = await signInWithApple();
    if (error) toast.error(error.message);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background flex flex-col"
    >
      <div className="px-4 pt-4">
        <button onClick={() => navigate("/")} className="active:scale-90 transition-transform">
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="text-center mb-8">
          <span className="text-5xl mb-3 block">🐍</span>
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? "Bine ai revenit!" : "Creează un cont"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Conectează-te pentru a continua" : "Începe să înveți Python"}
          </p>
        </div>

        <Card className="w-full max-w-sm border-border">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin} type="button">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuă cu Google
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={handleAppleLogin} type="button">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continuă cu Apple
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">sau</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Numele tău" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10" />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} placeholder="Parolă" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Se procesează..." : isLogin ? "Conectează-te" : "Creează cont"}
              </Button>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-muted-foreground hover:text-primary hover:underline w-full text-right"
                >
                  Ai uitat parola?
                </button>
              )}
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Nu ai cont? " : "Ai deja cont? "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
                {isLogin ? "Creează unul" : "Conectează-te"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Forgot password modal */}
      {showForgot && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={() => setShowForgot(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-sm border-border">
              <CardContent className="p-5 space-y-4">
                <div className="text-center">
                  <span className="text-3xl block mb-2">📧</span>
                  <h2 className="text-lg font-bold text-foreground">Recuperare parolă</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Introdu emailul și vei primi un link de resetare.
                  </p>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!forgotEmail.trim()) return;
                    setForgotLoading(true);
                    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    setForgotLoading(false);
                    if (error) {
                      toast.error(error.message);
                    } else {
                      toast.success("Email trimis! Verifică inbox-ul. 📬");
                      setShowForgot(false);
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={forgotLoading}>
                    {forgotLoading ? "Se trimite..." : "Trimite linkul"}
                  </Button>
                </form>
                <button
                  onClick={() => setShowForgot(false)}
                  className="text-xs text-muted-foreground hover:underline w-full text-center"
                >
                  Înapoi
                </button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AuthPage;
