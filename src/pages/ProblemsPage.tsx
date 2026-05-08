import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Code, ChevronRight, ArrowLeft, Lock, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useProblems } from "@/hooks/useProblems";
import { useProgress } from "@/hooks/useProgress";
import { useSubscription } from "@/hooks/useSubscription";
import PremiumDialog from "@/components/PremiumDialog";
import LoadingScreen from "@/components/states/LoadingScreen";
import { matchesSearch } from "@/lib/searchUtils";

type Difficulty = "ușor" | "mediu" | "greu";
const DIFFICULTIES: Difficulty[] = ["ușor", "mediu", "greu"];

const difficultyConfig = {
  "ușor": { color: "bg-primary/20 text-primary border-primary/30" },
  "mediu": { color: "bg-warning/20 text-warning border-warning/30" },
  "greu": { color: "bg-destructive/20 text-destructive border-destructive/30" },
};

const ProblemsPage = () => {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { data, isLoading } = useProblems();
  const { subscribed } = useSubscription();
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [showPremium, setShowPremium] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [hideSolved, setHideSolved] = useState(false);

  if (isLoading || !data) return <LoadingScreen />;

  const { problems, problemChapters } = data;
  const isSearching = searchQuery.trim().length > 0;
  const problemMatches = (p: typeof problems[0]) =>
    matchesSearch(p.title, searchQuery) || matchesSearch(p.id, searchQuery);
  const isSolved = (p: typeof problems[0]) => !!progress.completedLessons[`problem-${p.id}`]?.completed;
  const passesFilters = (p: typeof problems[0]) =>
    (difficultyFilter === "all" || p.difficulty === difficultyFilter) &&
    (!hideSolved || !isSolved(p));

  const chapterProblems = selectedChapter
    ? problems.filter((p) => p.chapter === selectedChapter)
    : [];
  const filteredChapterProblems = (isSearching
    ? chapterProblems.filter(problemMatches)
    : chapterProblems
  ).filter(passesFilters);
  const globalSearchResults = isSearching ? problems.filter(problemMatches) : [];

  const selectedChapterData = problemChapters.find((c) => c.id === selectedChapter);

  const handleProblemClick = (problem: typeof problems[0]) => {
    if (problem.isPremium && !subscribed) {
      setShowPremium(true);
      return;
    }
    navigate(`/problem/${problem.id}`);
  };

  const renderProblemCard = (problem: typeof problems[0], index: number, showChapter = false) => {
    const config = difficultyConfig[problem.difficulty];
    const solved = progress.completedLessons[`problem-${problem.id}`]?.completed;
    const locked = problem.isPremium && !subscribed;
    const chapterTitle = showChapter ? problemChapters.find(c => c.id === problem.chapter)?.title : null;
    return (
      <motion.div key={problem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.3) }}>
        <Card className={`cursor-pointer active:scale-[0.98] transition-transform border-border hover:border-primary/30 ${locked ? "opacity-70" : ""}`} onClick={() => handleProblemClick(problem)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground truncate">{problem.title}</span>
                  {solved && <span className="text-xs text-primary font-bold">✓</span>}
                  {locked && <Lock className="h-3.5 w-3.5 text-warning" />}
                </div>
                <p className="text-[10px] font-mono text-muted-foreground truncate mb-1">{problem.id}{chapterTitle ? ` · ${chapterTitle}` : ""}</p>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`text-[10px] ${config.color}`}>{problem.difficulty}</Badge>
                  <span className="text-xs text-muted-foreground">{problem.xpReward} XP</span>
                  {problem.isPremium && <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">Premium</Badge>}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[var(--sat)]">
        <div className="flex items-center gap-3 px-4 py-3">
          {selectedChapter ? (
            <button onClick={() => setSelectedChapter(null)} className="active:scale-90 transition-transform">
              <ArrowLeft className="h-6 w-6 text-foreground" />
            </button>
          ) : (
            <Code className="h-7 w-7 text-accent" />
          )}
          <div>
            <h1 className="text-lg font-bold text-foreground">{selectedChapter ? selectedChapterData?.title : "Probleme"}</h1>
            <p className="text-xs text-muted-foreground">{selectedChapter ? "Alege o problemă de rezolvat" : "Rezolvă probleme Python și câștigă XP"}</p>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută după ID sau nume..."
              className="pl-9"
            />
          </div>
        </div>
      </header>

      <div className="px-4 pt-3 space-y-3">
        {selectedChapter ? (
          filteredChapterProblems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Niciun rezultat.</p>
          ) : (
            filteredChapterProblems.map((problem, index) => renderProblemCard(problem, index, false))
          )
        ) : isSearching ? (
          globalSearchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Niciun rezultat.</p>
          ) : (
            globalSearchResults.map((problem, index) => renderProblemCard(problem, index, true))
          )
        ) : (
          problemChapters.map((chapter, index) => {
            const chProblems = problems.filter((p) => p.chapter === chapter.id);
            const solvedCount = chProblems.filter((p) => progress.completedLessons[`problem-${p.id}`]?.completed).length;
            return (
              <motion.div key={chapter.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="cursor-pointer active:scale-[0.98] transition-transform border-border hover:border-primary/30" onClick={() => setSelectedChapter(chapter.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{chapter.icon}</span>
                        <div>
                          <span className="font-semibold text-foreground">{chapter.title}</span>
                          <p className="text-xs text-muted-foreground">{solvedCount}/{chProblems.length} rezolvate</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      <PremiumDialog open={showPremium} onOpenChange={setShowPremium} />
    </motion.div>
  );
};

export default ProblemsPage;
