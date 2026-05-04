import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2, Clock } from "lucide-react";
import { useAdMob } from "@/hooks/useAdMob";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface WatchAdForLivesButtonProps {
  isPremium: boolean;
  onLivesGranted: (newLives: number, livesUpdatedAt: string) => void;
}

const WatchAdForLivesButton = ({ isPremium, onLivesGranted }: WatchAdForLivesButtonProps) => {
  const { isNative, showRewarded } = useAdMob();
  const [loading, setLoading] = useState(false);

  // Hide for premium users (already infinite lives) and on web (no native ads)
  if (isPremium || !isNative) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const earned = await showRewarded();
      if (!earned) {
        toast({
          title: "Reclamă neterminată",
          description: "Trebuie să vizionezi reclama complet pentru a primi viețile.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("reward-life");
      const errMsg = (data as any)?.error || error?.message || "";
      if (error || !data?.success) {
        // Friendly message when the daily ad limit was reached
        if (errMsg && errMsg.toLowerCase().includes("daily ad limit")) {
          toast({
            title: "Limita zilnică atinsă",
            description:
              "Ai folosit toate cele 3 reclame de astăzi. Fă o pauză de 30 de minute — inimile se reîncarcă automat după ce rămâi fără ele.",
          });
          return;
        }
        toast({
          title: "Nu s-au putut acorda viețile",
          description: errMsg || "Eroare necunoscută",
          variant: "destructive",
        });
        return;
      }

      onLivesGranted(data.lives, data.livesUpdatedAt);
      toast({
        title: "💖 Vieți primite!",
        description: `Acum ai ${data.lives} vieți. Reclame rămase azi: ${data.remaining}.`,
      });
    } catch (err) {
      toast({
        title: "Eroare",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={loading}
        variant="outline"
        className="w-full gap-2 border-primary/40 bg-primary/5 hover:bg-primary/10 touch-target"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Se încarcă reclama...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" /> Vizionează o reclamă pentru +5 inimi ❤️
          </>
        )}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground text-center">
        <Clock className="h-3 w-3" />
        Sau așteaptă 30 de minute după ce rămâi fără inimi pentru reumplere completă.
      </p>
    </div>
  );
};

export default WatchAdForLivesButton;
