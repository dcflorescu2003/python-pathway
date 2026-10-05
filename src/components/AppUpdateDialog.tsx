import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/lib/appVersion";
import { compareVersions } from "@/lib/versionCompare";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const SNOOZE_KEY = "pyro_update_snooze";
const SNOOZE_MS = 24 * 60 * 60 * 1000;

const AppUpdateDialog = () => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const [open, setOpen] = useState(false);

  const { data: cfg } = useQuery({
    queryKey: ["app_version_config", platform],
    enabled: isNative && (platform === "android" || platform === "ios"),
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_version_config")
        .select("*")
        .eq("platform", platform)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const forced = !!cfg?.is_active && compareVersions(APP_VERSION, cfg.min_supported_version) < 0;
  const optional = !!cfg?.is_active && !forced && compareVersions(APP_VERSION, cfg.latest_version) < 0;

  useEffect(() => {
    if (!cfg) return;
    if (forced) return setOpen(true);
    if (optional) {
      try {
        const raw = localStorage.getItem(SNOOZE_KEY);
        const s = raw ? JSON.parse(raw) : null;
        if (s && s.version === cfg.latest_version && Date.now() - s.at < SNOOZE_MS) return;
      } catch { /* ignore */ }
      setOpen(true);
    }
  }, [cfg, forced, optional]);

  if (!cfg || (!forced && !optional)) return null;

  const openStore = () => {
    const url = cfg.store_url;
    if (url) window.open(url, "_system");
  };

  const later = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, JSON.stringify({ version: cfg.latest_version, at: Date.now() }));
    } catch { /* ignore */ }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!forced && !o) later(); }}>
      <DialogContent
        className="max-w-sm [&>button]:hidden"
        onPointerDownOutside={(e) => forced && e.preventDefault()}
        onEscapeKeyDown={(e) => forced && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{forced ? "Actualizare necesară" : "Versiune nouă disponibilă!"}</DialogTitle>
          <DialogDescription>
            {forced
              ? "Versiunea curentă nu mai este compatibilă. Te rugăm să actualizezi PyRo pentru a continua."
              : `PyRo ${cfg.latest_version} este disponibil în magazin.`}
          </DialogDescription>
        </DialogHeader>
        {cfg.release_notes && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{cfg.release_notes}</p>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <Button className="h-12 gap-2" onClick={openStore}>
            <Download className="h-4 w-4" /> Actualizează
          </Button>
          {!forced && (
            <Button variant="ghost" className="h-12" onClick={later}>Mai târziu</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppUpdateDialog;
