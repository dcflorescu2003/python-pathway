import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useTeacherClasses, useCreateClass, useDeleteClass, useRenameClass } from "@/hooks/useTeacher";
import { Plus, Trash2, Users, ChevronRight, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ClassManagerProps {
  onSelectClass: (classId: string) => void;
}

const ClassManager = ({ onSelectClass }: ClassManagerProps) => {
  const { data: classes = [], isLoading } = useTeacherClasses();
  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const renameClass = useRenameClass();
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEdit = (e: React.MouseEvent, classId: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(classId);
    setEditName(currentName);
  };

  const handleRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = editName.trim();
    if (name.length < 2) {
      toast.error("Numele clasei trebuie să aibă minim 2 caractere.");
      return;
    }
    try {
      await renameClass.mutateAsync({ classId: editingId!, name });
      toast.success("Nume actualizat.");
      setEditingId(null);
    } catch {
      toast.error("Eroare la redenumirea clasei.");
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createClass.mutateAsync(newName.trim());
      toast.success("Clasă creată!");
      setNewName("");
      setShowCreate(false);
    } catch (err: any) {
      toast.error(err?.message || "Eroare la crearea clasei.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, classId: string) => {
    e.stopPropagation();
    if (!confirm("Sigur vrei să ștergi această clasă? Toate provocările și elevii vor fi eliminați.")) return;
    try {
      await deleteClass.mutateAsync(classId);
      toast.success("Clasă ștearsă.");
    } catch {
      toast.error("Eroare la ștergerea clasei.");
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Se încarcă...</p>;

  return (
    <div className="space-y-3">
      {classes.map((cls) => (
        <Card
          key={cls.id}
          className={editingId === cls.id ? "" : "cursor-pointer hover:border-primary/50 transition-colors"}
          onClick={() => editingId !== cls.id && onSelectClass(cls.id)}
        >
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Users className="h-5 w-5 text-primary flex-shrink-0" />
              {editingId === cls.id ? (
                <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-9 text-sm"
                    placeholder="Numele clasei"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">Cod: {cls.join_code}</p>
                </div>
              ) : (
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{cls.name}</p>
                  <p className="text-xs text-muted-foreground">Cod: {cls.join_code}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {editingId === cls.id ? (
                <>
                  <button
                    onClick={handleRename}
                    disabled={renameClass.isPending || editName.trim().length < 2}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-primary disabled:opacity-40 transition-colors"
                    aria-label="Salvează numele clasei"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                    aria-label="Anulează"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => startEdit(e, cls.id, cls.name)}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Redenumește clasa"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, cls.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {!showCreate ? (
        <Button variant="outline" className="w-full gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Creează clasă nouă
        </Button>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Numele clasei (ex: Clasa a X-a B)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                Anulează
              </Button>
              <Button onClick={handleCreate} disabled={!newName.trim() || createClass.isPending} className="flex-1">
                {createClass.isPending ? "Se creează..." : "Creează"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClassManager;
