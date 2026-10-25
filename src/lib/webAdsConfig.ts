// Configurare reclame rewarded pe web (AdinPlay).
// Setările (activare, publisher ID, site ID) vin din tabelul web_ads_config,
// editabil din Admin — se pot opri instant, fără update.
import { supabase } from "@/integrations/supabase/client";

export type WebAdsConfig = { enabled: boolean; publisherId: string; siteId: string };

let current: WebAdsConfig = { enabled: false, publisherId: "", siteId: "" };
let loadPromise: Promise<WebAdsConfig> | null = null;

/** True când reclamele web sunt active și configurate (sincron, pentru logica inimilor). */
export function isWebAdsActive(): boolean {
  return current.enabled && !!current.publisherId && !!current.siteId;
}

export function getWebAdsConfig(): WebAdsConfig {
  return current;
}

export function loadWebAdsConfig(): Promise<WebAdsConfig> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const { data } = await supabase
        .from("web_ads_config")
        .select("enabled, publisher_id, site_id")
        .eq("id", 1)
        .maybeSingle();
      if (data) {
        current = {
          enabled: !!data.enabled,
          publisherId: (data.publisher_id || "").trim(),
          siteId: (data.site_id || "").trim(),
        };
      }
    } catch (err) {
      console.warn("web_ads_config load failed", err);
      loadPromise = null;
    }
    return current;
  })();
  return loadPromise;
}
