import { useParams, useNavigate } from "react-router-dom";
import { getStoredChapters } from "@/hooks/useExerciseStore";
import { chapterTheories } from "@/data/chapterTheory";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const ChapterTheoryPage = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();

  const chapters = getStoredChapters();
  const chapter = chapters.find((c) => c.id === chapterId);
  const theory = chapterTheories.find((t) => t.chapterId === chapterId);

  if (!chapter || !theory) {
    return <div className="p-8 text-center text-foreground">Teorie negăsită</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/chapter/${chapter.id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs font-mono text-muted-foreground">Capitol {chapter.number}</p>
            <h1 className="text-lg font-bold text-foreground">Teorie: {chapter.title}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {theory.sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-mono font-bold text-primary-foreground"
                style={{ backgroundColor: `hsl(${chapter.color})` }}
              >
                {idx + 1}
              </span>
              {section.title}
            </h2>

            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mb-4">
              {section.content}
            </div>

            {section.code && (
              <pre className="code-block text-sm overflow-x-auto">
                <code className="text-foreground">{section.code}</code>
              </pre>
            )}
          </motion.div>
        ))}
      </main>
    </div>
  );
};

export default ChapterTheoryPage;
