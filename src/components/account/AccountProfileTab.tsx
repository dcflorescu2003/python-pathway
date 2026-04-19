import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useChapters } from "@/hooks/useChapters";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, XCircle, Code, Zap, Flame, Crown, CreditCard, Sparkles, GraduationCap, UserPlus, Shield, Clock, MessageSquare, Check, X, Pencil, Users, Copy, CheckCircle } from "lucide-react";
import { useTeacherReferralCodes } from "@/hooks/useTeacher";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import CouponRedemption from "@/components/CouponRedemption";
import PremiumDialog from "@/components/PremiumDialog";
import TeacherPremiumDialog from "@/components/TeacherPremiumDialog";
import TeacherVerificationForm from "@/components/teacher/TeacherVerificationForm";
import VerificationChat from "@/components/teacher/VerificationChat";
import TeacherWizard from "./TeacherWizard";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface AccountProfileTabProps {
  teacherStatus: string | null;
  isClassMember: boolean;
  displayName: string | null;
  nickname: string | null;
  onTeacherStatusChange: (status: string | null) => void;
  onDisplayNameChange: (name: string) => void;
  onNicknameChange: (name: string) => void;
  onJoinClass: (code: string) => void;
  joinLoading: boolean;
}

const AccountProfileTab = ({
  teacherStatus,
  isClassMember,
  displayName,
  nickname,
  onTeacherStatusChange,
  onDisplayNameChange,
  onNicknameChange,
  onJoinClass,
  joinLoading,
}: AccountProfileTabProps) => {
  const { user } = useAuth();
  const { progress } = useProgress();
  const { data: chapters } = useChapters();
  const { subscribed, subscriptionEnd, source, openPortal } = useSubscription();
  const { data: referralCodes = [] } = useTeacherReferralCodes();
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [showTeacherPremiumDialog, setShowTeacherPremiumDialog] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showTeacherWizard, setShowTeacherWizard] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [editingNickname, setEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  const totalLessons = (chapters || []).reduce((sum, ch) => sum + ch.lessons.length, 0);
  const completedCount = Object.values(progress.completedLessons).filter(l => l.completed).length;
  const totalMistakes = Object.values(progress.completedLessons)
    .filter(l => l.completed)
    .reduce((sum, l) => sum + Math.max(0, 100 - l.score), 0);
  const problemsSolved = Object.keys(progress.completedLessons)
    .filter(id => id.startsWith("problem-") && progress.completedLessons[id]?.completed).length;

  const stats = [
    { icon: BookOpen, label: "Lecții completate", value: `${completedCount}/${totalLessons}`, color: "text-primary" },
    { icon: XCircle, label: "Puncte pierdute", value: totalMistakes, color: "text-destructive" },
    { icon: Code, label: "Probleme rezolvate", value: problemsSolved, color: "text-accent-foreground" },
    { icon: Zap, label: "XP total", value: progress.xp, color: "text-xp" },
    { icon: Flame, label: "Serie zilnică", value: `${progress.streak} zile`, color: "text-warning" },
  ];

  const { data: pendingRequest } = useQuery({
    queryKey: ["my-verification-request", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("teacher_verification_requests")
        .select("id, admin_notes, status")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && teacherStatus === "pending",
  });

  const [showChat, setShowChat] = useState(false);

  const reloadTeacherStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("teacher_status")
      .eq("user_id", user.id)
      .single();
    const newStatus = data?.teacher_status ?? null;
    onTeacherStatusChange(newStatus === "unverified" ? "pending" : newStatus);
    setShowVerificationForm(false);
  };

  const handleSaveNickname = async () => {
    if (!user || editNickname.trim().length < 2) return;
    setSavingNickname(true);
    const { error } = await supabase
      .from("profiles")
      .update({ nickname: editNickname.trim() })
      .eq("user_id", user.id);
    setSavingNickname(false);
    if (error) {
      toast.error("Nu am putut salva nickname-ul.");
    } else {
      onNicknameChange(editNickname.trim());
      setEditingNickname(false);
      toast.success("Nickname actualizat!");
    }
  };

  return (
    <div className="space-y-4">
      {/* Nickname editor */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Nickname (public)</span>
            {editingNickname ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="h-7 w-36 text-sm"
                  placeholder="Nickname"
                  autoFocus
                />
                <button disabled={savingNickname || editNickname.trim().length < 2} onClick={handleSaveNickname} className="text-primary disabled:opacity-40">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingNickname(false)} className="text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => { setEditNickname(nickname || ""); setEditingNickname(true); }} className="flex items-center gap-1 text-sm text-foreground hover:text-primary">
                {nickname || displayName || user?.email?.split("@")[0] || "Anonim"}
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {!teacherStatus && (
        <Card className="border-border">
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
      )}

      {/* Premium / Subscription */}
      {(progress.isPremium || subscribed) ? (
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span className="font-medium text-yellow-500">Premium activ</span>
              {subscriptionEnd && (
                <span className="text-xs text-muted-foreground ml-auto">
                  până la {new Date(subscriptionEnd).toLocaleDateString("ro-RO")}
                </span>
              )}
            </div>
            {source === "coupon" && (
              <p className="text-[10px] text-muted-foreground mt-1">Activat prin cupon</p>
            )}
            {source === "stripe" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full gap-2"
                disabled={portalLoading}
                onClick={async () => {
                  setPortalLoading(true);
                  try { await openPortal(); } catch { toast.error("Nu am putut deschide portalul."); }
                  finally { setPortalLoading(false); }
                }}
              >
                <CreditCard className="h-4 w-4" />
                {portalLoading ? "Se deschide..." : "Gestionează abonamentul"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        teacherStatus === "verified" ? (
          <Button
            className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold shadow-lg"
            onClick={() => setShowTeacherPremiumDialog(true)}
          >
            <Crown className="h-5 w-5" /> Upgrade la Profesor AI <Sparkles className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold shadow-lg"
            onClick={() => setShowPremiumDialog(true)}
          >
            <Crown className="h-5 w-5" /> Pyro Premium <Sparkles className="h-4 w-4" />
          </Button>
        )
      )}

      <CouponRedemption />

      {/* Teacher section */}
      {teacherStatus ? (
        <div className="space-y-2">
          {teacherStatus === "verified" && (
            <p className="text-center text-sm font-medium text-green-600">✓ Profesor Verificat</p>
          )}

          {teacherStatus === "verified" && referralCodes.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Coduri invitație pentru colegi
                </p>
                <div className="space-y-2">
                  {referralCodes.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-sm font-mono font-bold text-foreground">{c.code}</span>
                        {c.used_by ? (
                          <span className="text-xs text-muted-foreground ml-2 inline-flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-primary" /> Folosit
                          </span>
                        ) : (
                          <span className="text-xs text-primary ml-2">Disponibil</span>
                        )}
                      </div>
                      {!c.used_by && (
                        <Button size="sm" variant="ghost" className="gap-1" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Cod copiat!"); }}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Aceste coduri oferă colegilor statut de Profesor Verificat (fără AI).
                </p>
              </CardContent>
            </Card>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-muted-foreground hover:text-destructive"
            onClick={() => setShowDeactivateDialog(true)}
          >
            <XCircle className="h-4 w-4" /> Dezactivează modul profesor
          </Button>

          <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Dezactivează modul profesor</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Ești pe cale să treci pe contul de elev. Această acțiune este <strong className="text-destructive">ireversibilă</strong> și va șterge permanent:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Toate clasele create și elevii înscriși</li>
                      <li>Toate testele create și rezultatele elevilor</li>
                      <li>Toate provocările trimise</li>
                      <li>Progresul de verificare — va trebui reluat de la zero</li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Renunță</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.rpc("deactivate_teacher_mode");
                      if (error) throw error;
                      const { data: profile } = await supabase
                        .from("profiles")
                        .select("is_teacher, teacher_status")
                        .eq("user_id", user!.id)
                        .single();
                      if (profile?.is_teacher === false) {
                        onTeacherStatusChange(null);
                        toast.success("Modul profesor a fost dezactivat.");
                      } else {
                        toast.error("Dezactivarea nu a fost confirmată. Încearcă din nou.");
                      }
                    } catch (err: any) {
                      toast.error(err.message || "Eroare la dezactivare.");
                    }
                  }}
                >
                  Sunt de acord
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Unverified: show verification */}
          {teacherStatus === "unverified" && (
            showVerificationForm ? (
              <Card>
                <CardContent className="p-4">
                  <TeacherVerificationForm
                    onSuccess={reloadTeacherStatus}
                    onCancel={() => setShowVerificationForm(false)}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/15 p-2.5 shrink-0">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground">Verifică-ți contul de profesor</h3>
                      <p className="text-xs text-muted-foreground mt-1">Deblochează toate funcțiile dedicate profesorilor.</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>Acces la <strong>biblioteca de teste predefinite</strong> ale platformei</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>Acces la <strong>banca de exerciții</strong> pentru construcția testelor</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>Insignă <strong>„Profesor Verificat"</strong> + 2 coduri invitație pentru colegi</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold shadow-md"
                    size="lg"
                    onClick={() => setShowVerificationForm(true)}
                  >
                    <Shield className="h-5 w-5" /> Începe verificarea
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground">
                    Durează 2 minute. 4 metode de verificare disponibile.
                  </p>
                </CardContent>
              </Card>
            )
          )}

          {/* Pending: status + chat */}
          {teacherStatus === "pending" && (
            <Card className="border-warning/30">
              <CardContent className="p-4 space-y-3">
                <div className="text-center">
                  <Clock className="h-5 w-5 text-warning mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Cerere profesor în așteptare</p>
                  <p className="text-xs text-muted-foreground mt-1">Vei fi notificat când contul tău este aprobat.</p>
                </div>
                {pendingRequest?.admin_notes && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-foreground mb-1">📋 Observații administrator</p>
                    <p className="text-xs text-muted-foreground">{pendingRequest.admin_notes}</p>
                  </div>
                )}
                {pendingRequest && (
                  <>
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setShowChat(!showChat)}>
                      <MessageSquare className="h-4 w-4" />
                      {showChat ? "Ascunde conversația" : "Mesaje & documente"}
                    </Button>
                    {showChat && (
                      <VerificationChat requestId={pendingRequest.id} adminNotes={pendingRequest.admin_notes} />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <>
          {!isClassMember && showTeacherWizard ? (
            <TeacherWizard
              onComplete={() => { setShowTeacherWizard(false); onTeacherStatusChange("unverified"); }}
              onCancel={() => setShowTeacherWizard(false)}
            />
          ) : !isClassMember ? (
            <div className="space-y-3">
              <div className="text-center space-y-1">
                <h3 className="text-base font-semibold text-foreground">Cum vrei să folosești PyRo?</h3>
                <p className="text-xs text-muted-foreground">Alege una dintre cele 2 variante</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Teacher card */}
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-4 space-y-3 flex flex-col h-full">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Ești profesor?</p>
                        <p className="text-xs text-muted-foreground">Creează clase și evaluează elevii</p>
                      </div>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1.5 flex-1">
                      <li className="flex gap-2"><span className="text-primary">✓</span> Creează clase și gestionează elevii</li>
                      <li className="flex gap-2"><span className="text-primary">✓</span> Construiește teste din banca de exerciții</li>
                      <li className="flex gap-2"><span className="text-primary">✓</span> Vezi analytics și rezultate</li>
                    </ul>
                    <Button className="w-full gap-2" onClick={() => setShowTeacherWizard(true)}>
                      <GraduationCap className="h-4 w-4" /> Devino Profesor
                    </Button>
                  </CardContent>
                </Card>

                {/* Student card */}
                <Card className="border-2 border-accent/40 bg-gradient-to-br from-accent/10 to-transparent">
                  <CardContent className="p-4 space-y-3 flex flex-col h-full">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <UserPlus className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Ești elev?</p>
                        <p className="text-xs text-muted-foreground">Alătură-te clasei profesorului tău</p>
                      </div>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1.5 flex-1">
                      <li className="flex gap-2"><span className="text-primary">✓</span> Acces la teste și provocări</li>
                      <li className="flex gap-2"><span className="text-primary">✓</span> Urmărește-ți progresul</li>
                      <li className="flex gap-2"><span className="text-primary">✓</span> Clasament în cadrul clasei</li>
                    </ul>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Cod clasă (ex: ABC123)"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={() => { onJoinClass(joinCode); setJoinCode(""); }} disabled={!joinCode.trim() || joinLoading} size="sm">
                        {joinLoading ? "..." : "Intră"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </>
      )}

      <PremiumDialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog} />
      <TeacherPremiumDialog open={showTeacherPremiumDialog} onOpenChange={setShowTeacherPremiumDialog} />
    </div>
  );
};

export default AccountProfileTab;
