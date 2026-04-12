import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, GraduationCap, AlertTriangle, Sparkles, Copy, CheckCircle, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeacherClasses, useTeacherReferralCodes } from "@/hooks/useTeacher";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import ClassManager from "@/components/teacher/ClassManager";
import ClassDetail from "@/components/teacher/ClassDetail";
import TestManager from "@/components/teacher/TestManager";
import TestBuilder from "@/components/teacher/TestBuilder";
import TeacherPremiumDialog from "@/components/TeacherPremiumDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TeacherPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTeacherPremium } = useSubscription();
  const { data: classes = [] } = useTeacherClasses();
  const { data: referralCodes = [] } = useTeacherReferralCodes();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showTestBuilder, setShowTestBuilder] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [teacherStatus, setTeacherStatus] = useState<string | null>(null);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("teacher_status")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setTeacherStatus(data?.teacher_status ?? null));
  }, [user]);

  const isVerified = teacherStatus === "verified";
  const isPending = teacherStatus === "pending";
  const isUnverified = teacherStatus === "unverified";

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const handleEditTest = (testId: string) => {
    setEditingTestId(testId);
    setShowTestBuilder(true);
  };

  const handleCloseBuilder = () => {
    setShowTestBuilder(false);
    setEditingTestId(null);
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
          <button onClick={() => navigate("/")} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <GraduationCap className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Panou Profesor</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {isUnverified && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Bine ai venit, profesor!
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Poți crea clase, provocări și teste cu exerciții existente sau personalizate.
              </p>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <p className="text-xs text-muted-foreground">
                  🔒 Pentru acces la <strong>subiecte și teste predefinite</strong>, parcurge pașii de verificare din pagina de cont.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isPending && (
          <Card className="mb-4 border-warning/30">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Verificare în curs</p>
                <p className="text-xs text-muted-foreground">Cererea ta este analizată. Vei fi notificat când este aprobată.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isVerified && !isTeacherPremium && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Upgrade la Profesor AI</p>
                  <p className="text-xs text-muted-foreground">Teste AI, feedback automat, statistici avansate</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowPremiumDialog(true)} className="gap-1 flex-shrink-0">
                <Sparkles className="h-3 w-3" />
                Upgrade
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Referral codes for verified teachers */}
        {isVerified && referralCodes.length > 0 && !showTestBuilder && !selectedClass && (
          <Card className="mb-4 border-border">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Codurile tale de invitație pentru colegi
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Trimite un cod unui coleg profesor — va fi verificat automat.
              </p>
              <div className="space-y-2">
                {referralCodes.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-mono font-bold text-foreground">{c.code}</span>
                      {c.used_by ? (
                        <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1 inline-flex">
                          <CheckCircle className="h-3 w-3 text-primary" /> Folosit
                        </span>
                      ) : (
                        <span className="text-xs text-primary ml-2">Disponibil</span>
                      )}
                    </div>
                    {!c.used_by && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1"
                        onClick={() => {
                          navigator.clipboard.writeText(c.code);
                          toast.success("Cod copiat!");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showTestBuilder ? (
          <TestBuilder onBack={handleCloseBuilder} editTestId={editingTestId} />
        ) : selectedClass ? (
          <ClassDetail
            classId={selectedClass.id}
            className={selectedClass.name}
            joinCode={selectedClass.join_code}
            onBack={() => setSelectedClassId(null)}
          />
        ) : (
          <Tabs defaultValue="classes" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="classes" className="flex-1">Clase</TabsTrigger>
              <TabsTrigger value="tests" className="flex-1">Teste</TabsTrigger>
            </TabsList>
            <TabsContent value="classes" className="mt-4">
              <ClassManager onSelectClass={setSelectedClassId} />
            </TabsContent>
            <TabsContent value="tests" className="mt-4">
              <TestManager
                onCreateTest={() => { setEditingTestId(null); setShowTestBuilder(true); }}
                onEditTest={handleEditTest}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <TeacherPremiumDialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog} />
    </motion.div>
  );
};

export default TeacherPage;
