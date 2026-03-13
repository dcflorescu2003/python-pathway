import { useState } from "react";
import { motion } from "framer-motion";
import { School, ChevronDown, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { schools, setSelectedSchool } from "@/data/schools";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import onboardingImg from "@/assets/onboarding-school.png";

interface SchoolOnboardingProps {
  onComplete: () => void;
}

const SchoolOnboarding = ({ onComplete }: SchoolOnboardingProps) => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = search.trim()
    ? schools
        .filter((s) =>
          `${s.name} ${s.city}`.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 40)
    : schools.slice(0, 40);

  const selectedSchool = schools.find((s) => s.id === selectedId);

  const handleContinue = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (selectedId) {
        setSelectedSchool(selectedId);
        await supabase
          .from("profiles")
          .update({ school_id: selectedId })
          .eq("user_id", user.id);
      } else {
        // Mark onboarding as done even without school
        await supabase
          .from("profiles")
          .update({ school_id: "skipped" })
          .eq("user_id", user.id);
      }
    } catch (e) {
      console.error("Failed to save school:", e);
    }
    onComplete();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md flex flex-col items-center"
      >
        {/* Image */}
        <motion.img
          src={onboardingImg}
          alt="Python la școală"
          className="w-40 h-40 object-contain mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        />

        {/* Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Bine ai venit în PyRo! 🐍
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Alege liceul tău pentru a te putea compara cu colegii și a urca în clasamentul școlii tale.
          </p>
        </motion.div>

        {/* School picker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full rounded-xl border border-border bg-card overflow-hidden mb-4"
        >
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Caută liceul tău..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0"
              autoFocus
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((school) => (
                <button
                  key={school.id}
                  onClick={() => setSelectedId(school.id === selectedId ? null : school.id)}
                  className={`w-full text-left px-4 py-3 text-sm border-b border-border last:border-0 transition-colors ${
                    selectedId === school.id
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <School className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {school.name}{" "}
                      <span className="text-muted-foreground">— {school.city}</span>
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-4 text-sm text-muted-foreground text-center">
                Niciun liceu găsit. Încearcă alt termen.
              </p>
            )}
            {!search.trim() && schools.length > 40 && (
              <p className="px-4 py-2 text-xs text-muted-foreground text-center">
                Caută pentru a vedea mai multe...
              </p>
            )}
          </div>
        </motion.div>

        {/* Selected indicator */}
        {selectedSchool && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-primary font-medium mb-4 flex items-center gap-1"
          >
            <Sparkles className="h-4 w-4" />
            {selectedSchool.name}
          </motion.p>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full space-y-2"
        >
          <Button
            onClick={handleContinue}
            disabled={saving}
            className="w-full h-12 text-base font-semibold rounded-xl"
          >
            {selectedId ? "Continuă" : "Continuă fără liceu"}
          </Button>
          {!selectedId && (
            <p className="text-xs text-muted-foreground text-center">
              Poți alege oricând mai târziu din pagina principală.
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SchoolOnboarding;
