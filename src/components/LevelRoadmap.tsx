import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getAllLevelTiers } from "@/data/levels";
import { cn } from "@/lib/utils";

interface LevelRoadmapProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLevel: number;
}

const LevelRoadmap = ({ open, onOpenChange, currentLevel }: LevelRoadmapProps) => {
  const tiers = getAllLevelTiers();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">Drumul spre Master 🐍</DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Evoluția ta de la ou la legendă
          </DialogDescription>
        </DialogHeader>

        <div className="relative pl-8 pb-2">
          {/* Vertical line */}
          <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-border" />

          {tiers.map((tier, idx) => {
            const isActive = currentLevel >= tier.minLevel;
            const isCurrent =
              idx < tiers.length - 1
                ? currentLevel >= tier.minLevel && currentLevel < tiers[idx + 1].minLevel
                : currentLevel >= tier.minLevel;

            return (
              <div key={tier.minLevel} className="relative flex items-start gap-3 mb-5 last:mb-0">
                {/* Dot */}
                <div
                  className={cn(
                    "absolute -left-8 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 z-10",
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground scale-125"
                      : isActive
                        ? "border-primary bg-primary/20"
                        : "border-border bg-card"
                  )}
                >
                  {isCurrent && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
                </div>

                {/* Content */}
                <div
                  className={cn(
                    "flex-1 rounded-xl border p-3 transition-all",
                    isCurrent
                      ? "border-primary bg-primary/5 shadow-sm"
                      : isActive
                        ? "border-border bg-card"
                        : "border-border/50 bg-card/50 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-lg"
                      style={{ transform: `scale(${tier.scale})`, display: "inline-block" }}
                    >
                      {tier.emoji}
                    </span>
                    <div>
                      <p className={cn("text-sm font-bold", isCurrent ? "text-primary" : "text-foreground")}>
                        {tier.name}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        Nivel {tier.minLevel}{tier.minLevel < 25 ? `–${(tiers[idx + 1]?.minLevel ?? 25) - 1}` : "+"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelRoadmap;
