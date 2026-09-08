import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { ADSENSE_CLIENT_ID, H5_GAMES_ADS_ENABLED } from "@/lib/webAdsConfig";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    adBreak?: (config: Record<string, unknown>) => void;
    adConfig?: (config: Record<string, unknown>) => void;
  }
}

let scriptPromise: Promise<boolean> | null = null;

function loadAdsScript(): Promise<boolean> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    try {
      const existing = document.querySelector('script[data-pyro-h5-games="1"]');
      if (existing) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.pyroH5Games = "1";
      script.onload = () => resolve(true);
      script.onerror = () => {
        scriptPromise = null;
        resolve(false);
      };
      document.head.appendChild(script);

      // Coada oficială Ad Placement API
      window.adsbygoogle = window.adsbygoogle || [];
      window.adBreak = (o: Record<string, unknown>) => window.adsbygoogle!.push(o);
      window.adConfig = (o: Record<string, unknown>) => window.adsbygoogle!.push(o);
      window.adConfig({ preloadAdBreaks: "on", sound: "on" });
    } catch (err) {
      console.error("H5 Games Ads script init failed:", err);
      scriptPromise = null;
      resolve(false);
    }
  });
  return scriptPromise;
}

export function useWebRewardedAds() {
  const isNative = Capacitor.isNativePlatform();
  const enabled = H5_GAMES_ADS_ENABLED && !!ADSENSE_CLIENT_ID && !isNative;
  const [ready, setReady] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadAdsScript().then((ok) => {
      if (!cancelled) setReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  /**
   * Afișează o reclamă rewarded. Rezolvă true doar dacă utilizatorul
   * a vizionat reclama complet (adViewed), false altfel.
   */
  const showRewarded = useCallback(async (): Promise<boolean> => {
    if (!enabled || busyRef.current) return false;
    const loaded = ready || (await loadAdsScript());
    if (!loaded || typeof window.adBreak !== "function") return false;

    busyRef.current = true;
    try {
      return await new Promise<boolean>((resolve) => {
        let settled = false;
        let viewed = false;
        const settle = (val: boolean) => {
          if (settled) return;
          settled = true;
          resolve(val);
        };

        // Timeout de siguranță: dacă nu sosește niciun eveniment terminal.
        const timeout = setTimeout(() => settle(viewed), 5 * 60 * 1000);
        const settleAndClear = (val: boolean) => {
          clearTimeout(timeout);
          settle(val);
        };

        window.adBreak!({
          type: "reward",
          name: "refill-lives",
          beforeReward: (showAdFn: () => void) => {
            // Utilizatorul a apăsat deja butonul nostru opt-in — afișăm direct.
            showAdFn();
          },
          adViewed: () => {
            viewed = true;
            settleAndClear(true);
          },
          adDismissed: () => {
            // Așteptăm puțin în caz că adViewed sosește imediat după dismiss.
            setTimeout(() => settleAndClear(viewed), 500);
          },
          adBreakDone: (info?: { breakStatus?: string }) => {
            const status = info?.breakStatus;
            if (status && status !== "viewed") {
              // notReady / noFill / dismissed / frequencyCapped etc.
              setTimeout(() => settleAndClear(viewed), 500);
            }
          },
        });
      });
    } catch (err) {
      console.error("H5 Games rewarded ad failed:", err);
      return false;
    } finally {
      busyRef.current = false;
    }
  }, [enabled, ready]);

  return { enabled, ready, showRewarded };
}
