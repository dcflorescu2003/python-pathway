import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import PyroLogo from "@/components/brand/PyroLogo";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, LogOut, Shield, Trash2, Settings, GraduationCap, Pencil, Check, X, BookOpen, FileText } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

import AccountProfileTab from "@/components/account/AccountProfileTab";
import StudentTab from "@/components/account/StudentTab";
import TeacherClassesTab from "@/components/account/TeacherClassesTab";
import TeacherTestsTab from "@/components/account/TeacherTestsTab";

const AccountView = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminAccess();
  const { checkSubscription } = useSubscription();
  const [teacherStatus, setTeacherStatus] = useState<string | null>(null);
  const [isClassMember, setIsClassMember] = useState(false);
  const [flagsLoaded, setFlagsLoaded] = useState(false);
  const [memberClassName, setMemberClassName] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [fullName, setFullName] = useState("");
  const [joinLastName, setJoinLastName] = useState("");
  const [joinFirstName, setJoinFirstName] = useState("");
  const [pendingClassId, setPendingClassId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadAccountFlags = async () => {
      const [{ data: profile }, { data: memberships }] = await Promise.all([
        supabase
          .from("profiles")
          .select("is_teacher, teacher_status, display_name, nickname")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("class_members")
          .select("id, class_id")
          .eq("student_id", user.id)
          .limit(1),
      ]);

      let resolvedStatus = profile?.teacher_status ?? null;
      if (resolvedStatus === "unverified") {
        const { data: pendingReq } = await supabase
          .from("teacher_verification_requests")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .limit(1)
          .maybeSingle();
        if (pendingReq) resolvedStatus = "pending";
      }

      setTeacherStatus(resolvedStatus);
      setDisplayName(profile?.display_name ?? null);
      setNickname((profile as any)?.nickname ?? null);
      const isMember = (memberships?.length ?? 0) > 0;
      setIsClassMember(isMember);

      if (isMember && memberships?.[0]?.class_id) {
        const { data: cls } = await supabase
          .from("teacher_classes")
          .select("name")
          .eq("id", memberships[0].class_id)
          .single();
        setMemberClassName(cls?.name ?? null);
      } else {
        setMemberClassName(null);
      }
      setFlagsLoaded(true);
    };

    void loadAccountFlags();
    void checkSubscription(true);

    const handleFocus = () => { void loadAccountFlags(); void checkSubscription(true); };
    const handleVisibility = () => { if (document.visibilityState === "visible") handleFocus(); };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { window.removeEventListener("focus", handleFocus); document.removeEventListener("visibilitychange", handleVisibility); };
  }, [user, checkSubscription]);

  const handleJoinClass = async (code: string) => {
    if (!user || !code.trim()) return;
    setJoinLoading(true);
    try {
      const { data: cls } = await supabase
        .from("teacher_classes")
        .select("id")
        .eq("join_code", code.trim().toUpperCase())
        .single();
      if (!cls) { toast.error("Cod invalid."); return; }

      const { data: existing } = await supabase
        .from("class_members")
        .select("id")
        .eq("class_id", cls.id)
        .eq("student_id", user.id)
        .maybeSingle();
      if (existing) { toast.error("Ești deja înscris în această clasă."); return; }

      // Always require catalog name when joining
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      setPendingClassId(cls.id);
      const name = profile?.display_name?.trim();
      setFullName(name && name !== user.email && name.length >= 3 ? name : "");
      setShowNameDialog(true);
    } finally {
      setJoinLoading(false);
    }
  };

  const joinClassDirect = async (classId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("class_members")
      .insert({ class_id: classId, student_id: user.id });
    if (error) {
      if (error.code === "23505") toast.error("Ești deja înscris în această clasă.");
      else toast.error("Eroare la înscriere.");
    } else {
      toast.success("Te-ai alăturat clasei! 🎉");
      setIsClassMember(true);
      // Reload class name
      const { data: cls } = await supabase.from("teacher_classes").select("name").eq("id", classId).single();
      setMemberClassName(cls?.name ?? null);
    }
  };

  const handleNameConfirm = async () => {
    if (!user || !pendingClassId || fullName.trim().length < 3) return;
    setJoinLoading(true);
    try {
      await supabase.from("profiles").update({ display_name: fullName.trim() }).eq("user_id", user.id);
      await joinClassDirect(pendingClassId);
      setShowNameDialog(false);
      setPendingClassId(null);
      setFullName("");
      setDisplayName(fullName.trim());
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Te-ai deconectat.");
    navigate("/auth");
  };

  const isTeacher = !!teacherStatus;
  const showStudentTab = isClassMember && !isTeacher;

  const [activeTab, setActiveTab] = useState<string>("profile");
  const [tabInitialized, setTabInitialized] = useState(false);
  useEffect(() => {
    if (!flagsLoaded || tabInitialized) return;
    if (isTeacher) setActiveTab("classes");
    else if (isClassMember) setActiveTab("student");
    else setActiveTab("profile");
    setTabInitialized(true);
  }, [flagsLoaded, isTeacher, isClassMember, tabInitialized]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background flex flex-col"
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/")} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <User className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Contul meu</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-4 pt-6 pb-12 max-w-lg mx-auto w-full">
        {/* Header: Avatar, name, email */}
        <div className="flex flex-col items-center mb-6">
          <PyroLogo size="lg" className="mb-3" />
          {editingName ? (
            <div className="flex items-center gap-2 mb-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 w-48 text-center text-sm"
                placeholder="Numele tău complet"
                autoFocus
              />
              <button
                disabled={savingName || editName.trim().length < 3}
                onClick={async () => {
                  setSavingName(true);
                  const { error } = await supabase.from("profiles").update({ display_name: editName.trim() }).eq("user_id", user!.id);
                  setSavingName(false);
                  if (error) { toast.error("Nu am putut salva numele."); }
                  else { setDisplayName(editName.trim()); setEditingName(false); toast.success("Numele a fost actualizat!"); }
                }}
                className="text-primary hover:text-primary/80 disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">
                {nickname || displayName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pythonist"}
              </h2>
              <button onClick={() => { setEditName(displayName || ""); setEditingName(true); }} className="text-muted-foreground hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        {/* Tabs */}
        <Tabs key={flagsLoaded ? "ready" : "loading"} value={activeTab} onValueChange={setActiveTab} className="w-full flex-1">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex-1">Profil</TabsTrigger>
            {showStudentTab && (
              <TabsTrigger value="student" className="flex-1 gap-1">
                <BookOpen className="h-3.5 w-3.5" /> Elev
              </TabsTrigger>
            )}
            {isTeacher && (
              <>
                <TabsTrigger value="classes" className="flex-1 gap-1">
                  <GraduationCap className="h-3.5 w-3.5" /> Clase
                </TabsTrigger>
                <TabsTrigger value="tests" className="flex-1 gap-1">
                  <FileText className="h-3.5 w-3.5" /> Teste
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <AccountProfileTab
              teacherStatus={teacherStatus}
              isClassMember={isClassMember}
              displayName={displayName}
              nickname={nickname}
              onTeacherStatusChange={setTeacherStatus}
              onDisplayNameChange={setDisplayName}
              onNicknameChange={setNickname}
              onJoinClass={handleJoinClass}
              joinLoading={joinLoading}
            />
          </TabsContent>

          {showStudentTab && (
            <TabsContent value="student" className="mt-4">
              <StudentTab
                memberClassName={memberClassName}
                onLeaveClass={() => { setIsClassMember(false); setMemberClassName(null); }}
              />
            </TabsContent>
          )}

          {isTeacher && (
            <>
              <TabsContent value="classes" className="mt-4">
                <TeacherClassesTab teacherStatus={teacherStatus} />
              </TabsContent>
              <TabsContent value="tests" className="mt-4">
                <TeacherTestsTab teacherStatus={teacherStatus} />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Footer actions */}
        <div className="mt-8 space-y-2">
          {isAdmin && (
            <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/admin")}>
              <Settings className="h-4 w-4" /> Panou Admin
            </Button>
          )}
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/privacy-policy")}>
            <Shield className="h-4 w-4" /> Politica de confidențialitate
          </Button>
          <Button variant="destructive" className="w-full gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Deconectează-te
          </Button>
          <div className="text-center">
            <button
              onClick={() => navigate("/delete-account")}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Șterge contul
            </button>
          </div>
        </div>
      </div>

      {/* Name dialog for class join */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <User className="h-5 w-5 text-primary" /> Numele din catalog
            </DialogTitle>
            <DialogDescription className="text-center text-foreground/70">
              Scrie-ți numele complet (prenume și nume de familie) așa cum apare în catalogul clasei.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Ex: Andrei Popescu" value={fullName} onChange={(e) => setFullName(e.target.value)} className="text-center" autoFocus />
            <p className="text-xs text-muted-foreground text-center">🔒 Acest nume va fi vizibil doar profesorului tău.</p>
            {fullName.trim().length > 0 && fullName.trim().length < 3 && (
              <p className="text-xs text-destructive text-center">Numele trebuie să aibă minim 3 caractere.</p>
            )}
            <Button className="w-full" onClick={handleNameConfirm} disabled={fullName.trim().length < 3 || joinLoading}>
              {joinLoading ? "Se înscrie..." : "Confirmă și intră în clasă"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn, signInWithGoogle, signInWithApple, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const wasLoggedInOnMount = useState(() => !!user)[0];

  useEffect(() => {
    if (user && !wasLoggedInOnMount) {
      navigate("/", { replace: true });
    }
  }, [user, wasLoggedInOnMount, navigate]);

  if (user && wasLoggedInOnMount) return <AccountView />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (!isLogin && !displayName.trim()) { toast.error("Introdu un nume de afișare."); return; }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message === "Invalid login credentials" ? "Email sau parolă greșită." : error.message);
        } else {
          toast.success("Bine ai revenit! 👋");
          await new Promise(r => setTimeout(r, 300));
          navigate("/", { replace: true });
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) { toast.error(error.message); }
        else { toast.success("Cont creat! Verifică-ți emailul pentru confirmare. 📬"); }
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
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/")} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{isLogin ? "Autentificare" : "Înregistrare"}</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="text-center mb-8">
          <PyroLogo size="lg" className="mx-auto mb-3" />
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
              {!(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") && (
                <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin} type="button">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuă cu Google
                </Button>
              )}
              {!(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") && (
                <Button variant="outline" className="w-full gap-2" onClick={handleAppleLogin} type="button">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continuă cu Apple
                </Button>
              )}
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
                <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-muted-foreground hover:text-primary hover:underline w-full text-right">
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

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/support")}
            className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors"
          >
            Ai nevoie de ajutor? Contactează suportul
          </button>
        </div>
      </div>

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
                  <p className="text-xs text-muted-foreground mt-1">Introdu emailul și vei primi un link de resetare.</p>
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
                    if (error) { toast.error(error.message); }
                    else { toast.success("Email trimis! Verifică inbox-ul. 📬"); setShowForgot(false); }
                  }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="Email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-10" autoFocus />
                  </div>
                  <Button type="submit" className="w-full" disabled={forgotLoading}>
                    {forgotLoading ? "Se trimite..." : "Trimite linkul"}
                  </Button>
                </form>
                <button onClick={() => setShowForgot(false)} className="text-xs text-muted-foreground hover:underline w-full text-center">
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
