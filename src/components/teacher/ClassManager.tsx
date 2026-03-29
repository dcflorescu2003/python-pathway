import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useTeacherClasses, useCreateClass, useDeleteClass } from "@/hooks/useTeacher";
import { Plus, Trash2, Users, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ClassManagerProps {
  onSelectClass: (classId: string) => void;
}

const ClassManager = ({ onSelectClass }: ClassManagerProps) => {
  const { data: classes = [], isLoading } = useTeacherClasses();
  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createClass.mutateAsync(newName.trim());
      toast.success("Clasă creată!");
      setNewName("");
      setShowCreate(false);
    } catch {
      toast.error("Eroare la crearea clasei.");
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
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => onSelectClass(cls.id)}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">{cls.name}</p>
                <p className="text-xs text-muted-foreground">Cod: {cls.join_code}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleDelete(e, cls.id)}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
