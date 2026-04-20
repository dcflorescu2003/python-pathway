import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, School, Search, User, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { schools } from "@/data/schools";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TeacherWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

const TeacherWizard = ({ onComplete, onCancel }: TeacherWizardProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("school_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const sid = data?.school_id;
        if (sid && schools.some((s) => s.id === sid)) {
          setSelectedSchoolId(sid);
        }
      });
  }, [user]);

  const filtered = schoolSearch.trim()
    ? schools.filter((s) => `${s.name} ${s.city}`.toLowerCase().includes(schoolSearch.toLowerCase())).slice(0, 40)
    : schools.slice(0, 40);

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ln = lastName.trim();
      const fn = firstName.trim();
      const display = `${ln} ${fn}`;
      // Update profile with school and name fields
      const updates: Record<string, string | null> = {
        display_name: display,
        last_name: ln,
        first_name: fn,
      };
      if (selectedSchoolId) updates.school_id = selectedSchoolId;

      await supabase.from("profiles").update(updates).eq("user_id", user.id);

      // Activate teacher mode
      const { error: rpcErr } = await supabase.rpc("request_teacher_status");
      if (rpcErr) throw rpcErr;

      // Verify the update actually persisted (guards against silent trigger blocks)
      const { data: check } = await supabase
        .from("profiles")
        .select("teacher_status, is_teacher")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!check || check.teacher_status !== "unverified" || !check.is_teacher) {
        throw new Error("Activarea nu s-a putut salva. Te rugăm să încerci din nou.");
      }

      toast.success("Ești acum profesor! Poți crea clase și teste.");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Eroare la activarea modului profesor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-primary/20">
      <CardContent className="p-4">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="school"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <GraduationCap className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-base font-bold text-foreground">Pasul 1: Alege liceul</h3>
                <p className="text-xs text-muted-foreground mt-1">Selectează instituția la care predai.</p>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <div className="p-2 border-b border-border flex items-center gap-2 bg-secondary/30">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Caută liceul..."
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent"
                    autoFocus
                  />
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {filtered.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => setSelectedSchoolId(school.id === selectedSchoolId ? null : school.id)}
                      className={`w-full text-left px-3 py-2.5 text-sm border-b border-border last:border-0 transition-all ${
                        selectedSchoolId === school.id
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <School className={`h-4 w-4 shrink-0 ${selectedSchoolId === school.id ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="truncate">
                          {school.name} <span className="text-muted-foreground">— {school.city}</span>
                        </span>
                      </span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">Niciun liceu găsit.</p>
                  )}
                </div>
              </div>

              {selectedSchool && (
                <p className="text-xs text-primary text-center font-medium">✓ {selectedSchool.name}</p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel} className="flex-1">Renunță</Button>
                <Button onClick={() => setStep(1)} disabled={!selectedSchoolId} className="flex-1 gap-1">
                  Continuă <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <User className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-base font-bold text-foreground">Pasul 2: Numele complet</h3>
                <p className="text-xs text-muted-foreground mt-1">Acest nume va fi vizibil doar administratorilor la verificare.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Nume (ex: Popescu)"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-center"
                  autoFocus
                />
                <Input
                  placeholder="Prenume (ex: Andrei)"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="text-center"
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Vei apărea în cataloage ca „Nume Prenume" pentru sortare alfabetică corectă.
              </p>
              {(lastName.trim().length > 0 && lastName.trim().length < 2) && (
                <p className="text-xs text-destructive text-center">Numele trebuie să aibă minim 2 caractere.</p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1 gap-1">
                  <ArrowLeft className="h-4 w-4" /> Înapoi
                </Button>
                <Button onClick={() => setStep(2)} disabled={lastName.trim().length < 2 || firstName.trim().length < 2} className="flex-1 gap-1">
                  Continuă <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-base font-bold text-foreground">Confirmare</h3>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                <p className="text-foreground"><strong>Liceu:</strong> {selectedSchool?.name}</p>
                <p className="text-foreground"><strong>Nume:</strong> {`${lastName.trim()} ${firstName.trim()}`}</p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  🔒 Pentru a beneficia de toate avantajele contului de profesor (acces la baza de teste predefinite), 
                  trebuie să treci prin procesul de verificare. Poți începe oricând din pagina de cont.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 gap-1">
                  <ArrowLeft className="h-4 w-4" /> Înapoi
                </Button>
                <Button onClick={handleConfirm} disabled={loading} className="flex-1 gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {loading ? "Se activează..." : "Devino Profesor"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default TeacherWizard;
