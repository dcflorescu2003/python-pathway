import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  currentUserEmail?: string;
}

const NewLessonNotifier = (_: Props) => {
  const [chapterTitle, setChapterTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!lessonTitle.trim()) {
      toast.error("Titlul lecției e obligatoriu.");
      return;
    }
    if (!confirm(`Trimit notificare push tuturor utilizatorilor pentru "${lessonTitle}"?`)) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("notify-new-lesson", {
        body: {
          lesson_title: lessonTitle.trim(),
          chapter_title: chapterTitle.trim(),
          lesson_id: lessonId.trim() || undefined,
        },
      });
      if (error) throw error;
      toast.success(`Notificat ${data?.notified ?? 0} utilizatori (${data?.pushed ?? 0} push-uri).`);
      setChapterTitle("");
      setLessonTitle("");
      setLessonId("");
    } catch (err: any) {
      toast.error(err?.message || "Eroare la trimitere.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="h-4 w-4 text-primary" />
          Anunță lecție nouă
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Trimite o notificare push + in-app tuturor utilizatorilor.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="ch-title" className="text-xs">Capitol (opțional)</Label>
          <Input id="ch-title" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} placeholder="Ex: Capitolul 3 — Funcții" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ls-title" className="text-xs">Titlu lecție *</Label>
          <Input id="ls-title" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Ex: Argumente implicite" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ls-id" className="text-xs">Lesson ID (opțional, pentru deep-link)</Label>
          <Input id="ls-id" value={lessonId} onChange={(e) => setLessonId(e.target.value)} placeholder="Ex: lesson-3-2" />
        </div>
        <Button onClick={send} disabled={sending || !lessonTitle.trim()} className="w-full">
          {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Megaphone className="h-4 w-4 mr-2" />}
          Trimite notificare
        </Button>
      </CardContent>
    </Card>
  );
};

export default NewLessonNotifier;
