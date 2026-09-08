import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useWebRewardedAds } from "@/hooks/useWebRewardedAds";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface WebWatchAdForLivesButtonProps {
  isPremium: boolean;
  onLivesGranted: (newLives: number, livesUpdatedAt: string) => void;
}

const WebWatchAdForLivesButton = ({ isPremium, onLivesGranted }: WebWatchAdForLivesButtonProps) => {
  const { enabled, showRewarded } = useWebRewardedAds();
  const [loading, setLoading] = useState(false);

  // Afișat doar pe web, cu flag-ul H5 Games activ și pentru utilizatori fără ∞ inimi.
  if (!enabled || isPremium) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const earned = await showRewarded();
      if (!earned) {
        toast({
          title: "Reclama nu este disponibilă momentan",
          description: "Încearcă din nou mai târziu sau instalează aplicația mobilă.",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("reward-life");
      const errMsg = (data as any)?.error || error?.message || "";
      if (error || !data?.success) {
        if (errMsg && errMsg.toLowerCase().includes("daily ad limit")) {
          toast({
            title: "Limita zilnică atinsă",
            description:
              "Ai folosit toate reclamele de astăzi. Fă o pauză de 30 de minute — inimile se reîncarcă automat după ce rămâi fără ele.",
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
  );
};

export default WebWatchAdForLivesButton;
