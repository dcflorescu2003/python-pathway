import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSelectedSchool, setSelectedSchool, schools } from "@/data/schools";
import { Flame, Zap, Medal, Loader2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const medalColors = [
  "text-yellow-400",
  "text-gray-300",
  "text-amber-600",
];

type Tab = "national" | "school" | "city";

interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  nickname: string | null;
  xp: number;
  streak: number;
  avatar_url: string | null;
  school_id: string | null;
}

const LeaderboardPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("school");
  const [userSchool, setUserSchool] = useState<string | null>(getSelectedSchool());
  const [schoolSearch, setSchoolSearch] = useState("");

  const userCity = userSchool ? schools.find(s => s.id === userSchool)?.city : null;
  const citySchoolIds = userCity ? schools.filter(s => s.city === userCity).map(s => s.id) : [];

  const filteredSchools = useMemo(() => {
    if (!schoolSearch.trim()) return [];
    const q = schoolSearch.toLowerCase();
    return schools.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)).slice(0, 8);
  }, [schoolSearch]);

  const handleSelectSchool = useCallback(async (schoolId: string) => {
    setSelectedSchool(schoolId);
    setUserSchool(schoolId);
    setSchoolSearch("");
    if (user) {
      await supabase.from("profiles").update({ school_id: schoolId }).eq("user_id", user.id);
    }
    queryClient.invalidateQueries({ queryKey: ["leaderboard-top"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard-user-rank"] });
    toast.success("Liceu selectat!");
  }, [user, queryClient]);

  // Query 1: Top 15 filtered by tab
  const { data: top15 = [], isLoading } = useQuery({
    queryKey: ["leaderboard-top", tab, userSchool],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("user_id, display_name, nickname, xp, streak, avatar_url, school_id")
        .order("xp", { ascending: false })
        .limit(15);

      if (tab === "school" && userSchool) {
        query = query.eq("school_id", userSchool);
      } else if (tab === "city" && citySchoolIds.length > 0) {
        query = query.in("school_id", citySchoolIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as LeaderboardEntry[];
    },
  });

  // Query 2: Current user's profile + rank
  const { data: userRankData } = useQuery({
    queryKey: ["leaderboard-user-rank", tab, userSchool, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, display_name, nickname, xp, streak, avatar_url, school_id")
        .eq("user_id", user!.id)
        .single();
      if (!profile) return null;

      let countQuery = supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .gt("xp", profile.xp);

      if (tab === "school" && userSchool) {
        countQuery = countQuery.eq("school_id", userSchool);
      } else if (tab === "city" && citySchoolIds.length > 0) {
        countQuery = countQuery.in("school_id", citySchoolIds);
      }

      const { count } = await countQuery;
      return { ...profile, rank: (count || 0) + 1 } as LeaderboardEntry & { rank: number };
    },
  });

  const userInTop15 = user ? top15.some(e => e.user_id === user.id) : false;
  const showUserBelow = !!userRankData && !userInTop15;

  const renderRow = (entry: LeaderboardEntry, idx: number, animDelay: number) => {
    const isUser = entry.user_id === user?.id;
    const displayName = entry.nickname || entry.display_name || "Anonim";
    return (
      <motion.div
        key={entry.user_id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: animDelay * 0.03 }}
        className={`flex items-center gap-3 rounded-xl border p-3 active:scale-[0.98] transition-all ${
          isUser
            ? "border-primary bg-primary/10 glow-primary"
            : "border-border bg-card"
        }`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          {idx < 3 ? (
            <Medal className={`h-5 w-5 ${medalColors[idx]}`} />
          ) : (
            <span className="text-xs font-mono text-muted-foreground font-bold">
              {idx + 1}
            </span>
          )}
        </div>

        <span className="text-xl">{entry.avatar_url || "🐍"}</span>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${isUser ? "text-primary" : "text-foreground"}`}>
            {isUser ? "Tu" : displayName}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Zap className="h-3 w-3 text-xp" />
              {entry.xp} XP
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Flame className="h-3 w-3 text-warning" />
              {entry.streak}d
            </span>
          </div>
        </div>

        <div className="shrink-0 rounded-full bg-secondary px-2.5 py-1">
          <span className="text-xs font-mono font-bold text-xp">{entry.xp}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-xl">🏆</span>
          <h1 className="text-lg font-bold text-foreground">Clasament</h1>
        </div>
        <div className="flex px-4 pb-2 gap-2">
          <button
            onClick={() => setTab("school")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === "school"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            🏫 Liceu
          </button>
          <button
            onClick={() => setTab("city")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === "city"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            🏙️ Oraș
          </button>
          <button
            onClick={() => setTab("national")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === "national"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            🌍 Național
          </button>
        </div>
      </header>

      <main className="px-4 py-4">
        {(tab === "school" || tab === "city") && !userSchool && (
          <div className="rounded-xl border border-border bg-card p-4 mb-4">
            <p className="text-sm text-foreground/70 text-center mb-3">
              Alege liceul tău pentru a vedea clasamentul pe {tab === "city" ? "oraș" : "liceu"}.
            </p>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută liceul..."
                value={schoolSearch}
                onChange={e => setSchoolSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {filteredSchools.length > 0 && (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filteredSchools.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSchool(s.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm bg-secondary/50 hover:bg-primary/20 transition-colors"
                  >
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{s.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {top15.map((entry, idx) => renderRow(entry, idx, idx))}

            {showUserBelow && (
              <>
                <div className="flex items-center justify-center py-2 gap-2">
                  <span className="text-muted-foreground text-lg tracking-[0.3em]">• • •</span>
                </div>
                {renderRow(userRankData, userRankData.rank - 1, 16)}
              </>
            )}

            {top15.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Niciun utilizator încă.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LeaderboardPage;
