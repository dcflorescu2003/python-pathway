import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { loadWebAdsConfig, type WebAdsConfig } from "@/lib/webAdsConfig";

// AdinPlay rewarded video (doar web).
declare global {
  interface Window {
    aiptag?: any;
    aipPlayer?: any;
  }
}

type Pending = (granted: boolean) => void;
let pending: Pending | null = null;
let grantedFlag = false;
let scriptPromise: Promise<boolean> | null = null;

function finish(val: boolean) {
  const cb = pending;
  pending = null;
  cb?.(val);
}

function loadScript(cfg: WebAdsConfig): Promise<boolean> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    try {
      const w = window as any;
      w.aiptag = w.aiptag || { cmd: [] };
      w.aiptag.cmd = w.aiptag.cmd || [];
      w.aiptag.cmd.player = w.aiptag.cmd.player || [];
      w.aiptag.cmp = { show: true, position: "centered", button: true, buttonText: "Setări confidențialitate", buttonPosition: "bottom-left" };
      w.aiptag.cmd.player.push(() => {
        w.aiptag.adplayer = new w.aipPlayer({
          AIP_REWARDEDGRANTED: () => {
            grantedFlag = true;
          },
          AIP_REWARDEDCOMPLETE: (state: string) => {
            // state: "success" | "empty" | "blocked" | "closed" | ...
            const ok = grantedFlag || state === "success";
            grantedFlag = false;
            finish(ok);
          },
          AIP_REMOVE: () => {},
        });
      });

      const s = document.createElement("script");
      s.src = `https://api.adinplay.com/libs/aiptag/pub/${encodeURIComponent(cfg.publisherId)}/${encodeURIComponent(cfg.siteId)}/tag.min.js`;
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => {
        scriptPromise = null;
        resolve(false);
      };
      document.head.appendChild(s);
    } catch (err) {
      console.error("AdinPlay init failed", err);
      scriptPromise = null;
      resolve(false);
    }
  });
  return scriptPromise;
}

export function useWebRewardedAds() {
  const isNative = Capacitor.isNativePlatform();
  const [cfg, setCfg] = useState<WebAdsConfig | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (isNative) return;
    let c = false;
    loadWebAdsConfig().then((v) => !c && setCfg(v));
    return () => {
      c = true;
    };
  }, [isNative]);

  const enabled = !isNative && !!cfg?.enabled && !!cfg.publisherId && !!cfg.siteId;

  /** Rezolvă true doar dacă reclama a fost vizionată complet. */
  const showRewarded = useCallback(async (): Promise<boolean> => {
    if (!enabled || !cfg || busyRef.current) return false;
    busyRef.current = true;
    try {
      const loaded = await loadScript(cfg);
      if (!loaded) return false;
      const w = window as any;
      return await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => finish(false), 3 * 60 * 1000);
        pending = (v) => {
          clearTimeout(timeout);
          resolve(v);
        };
        grantedFlag = false;
        w.aiptag.cmd.player.push(() => {
          try {
            if (w.aiptag.adplayer?.startRewardedAd) {
              w.aiptag.adplayer.startRewardedAd({ preload: false, showLoading: true });
            } else finish(false);
          } catch {
            finish(false);
          }
        });
      });
    } finally {
      busyRef.current = false;
    }
  }, [enabled, cfg]);

  return { enabled, ready: enabled, showRewarded };
}
