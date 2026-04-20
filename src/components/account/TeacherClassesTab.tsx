import { useEffect, useState } from "react";
import { useTeacherClasses } from "@/hooks/useTeacher";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Pencil, Check, X, User } from "lucide-react";
import ClassManager from "@/components/teacher/ClassManager";
import ClassDetail from "@/components/teacher/ClassDetail";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TeacherClassesTabProps {
  teacherStatus: string | null;
}

const TeacherClassesTab = ({ teacherStatus }: TeacherClassesTabProps) => {
  const { data: classes = [] } = useTeacherClasses();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile-catalog-name", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, first_name, last_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const [editing, setEditing] = useState(false);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing && profile) {
      const ln = (profile as any).last_name || "";
      const fn = (profile as any).first_name || "";
      if (ln || fn) {
        setLastName(ln);
        setFirstName(fn);
      } else if (profile.display_name) {
        const parts = profile.display_name.trim().split(/\s+/);
        setLastName(parts[0] || "");
        setFirstName(parts.slice(1).join(" ") || "");
      }
    }
  }, [editing, profile]);

  const handleSave = async () => {
    const ln = lastName.trim();
    const fn = firstName.trim();
    if (ln.length < 2 || fn.length < 2) {
      toast.error("Completează nume și prenume (min. 2 caractere fiecare)");
      return;
    }
    setSaving(true);
    const display = `${ln} ${fn}`;
    const { error } = await supabase
      .from("profiles")
      .update({ last_name: ln, first_name: fn, display_name: display })
      .eq("user_id", user!.id);
    setSaving(false);
    if (error) {
      toast.error("Eroare la salvare");
      return;
    }
    toast.success("Nume actualizat");
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["profile-catalog-name", user?.id] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  if (selectedClass) {
    return (
      <ClassDetail
        classId={selectedClass.id}
        className={selectedClass.name}
        joinCode={selectedClass.join_code}
        onBack={() => setSelectedClassId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {teacherStatus === "unverified" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              🔒 Pentru acces la <strong>subiecte și teste predefinite</strong>, parcurge pașii de verificare din tab-ul Profil.
            </p>
          </CardContent>
        </Card>
      )}

      {teacherStatus === "pending" && (
        <Card className="border-warning/30">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
            <p className="text-xs text-muted-foreground">Verificare în curs — vei fi notificat când este aprobată.</p>
          </CardContent>
        </Card>
      )}

      {/* Catalog name editor */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Numele tău în catalog</span>
          </div>

          <div className="space-y-2 text-sm">
            {editing ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Nume (ex: Popescu)"
                    autoFocus
                  />
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Prenume (ex: Andrei)"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={saving || lastName.trim().length < 2 || firstName.trim().length < 2}
                    onClick={handleSave}
                    className="text-primary hover:text-primary/80 disabled:opacity-40 flex items-center gap-1 text-xs font-medium"
                  >
                    <Check className="h-4 w-4" /> Salvează
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                  >
                    <X className="h-4 w-4" /> Anulează
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{profile?.display_name || "—"}</span>
                <button
                  onClick={() => setEditing(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">🔒 Vizibil doar elevilor din clasele tale</p>
        </CardContent>
      </Card>

      <ClassManager onSelectClass={setSelectedClassId} />
    </div>
  );
};

export default TeacherClassesTab;
