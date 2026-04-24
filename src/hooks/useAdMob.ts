import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

// Google's official test IDs — safe to use during development
const TEST_REWARDED_ANDROID = "ca-app-pub-3940256099942544/5224354917";
const TEST_REWARDED_IOS = "ca-app-pub-3940256099942544/1712485313";

// Production rewarded ad unit IDs
const PROD_REWARDED_ANDROID = "ca-app-pub-8441862030200888/4681915410";
// TODO: Replace with iOS production unit ID when iOS app is registered in AdMob
const PROD_REWARDED_IOS = TEST_REWARDED_IOS;

const isDev = import.meta.env.DEV;

function getAdUnitId(): string {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return isDev ? TEST_REWARDED_IOS : PROD_REWARDED_IOS;
  return isDev ? TEST_REWARDED_ANDROID : PROD_REWARDED_ANDROID;
}

export function useAdMob() {
  const isNative = Capacitor.isNativePlatform();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isNative) return;
    let cancelled = false;
    (async () => {
      try {
        const { AdMob } = await import("@capacitor-community/admob");
        await AdMob.initialize({
          testingDevices: [],
          initializeForTesting: isDev,
        });
        // Request consent (GDPR / iOS ATT)
        try {
          const consentInfo = await AdMob.requestConsentInfo();
          if (
            consentInfo.isConsentFormAvailable &&
            consentInfo.status === "REQUIRED"
          ) {
            await AdMob.showConsentForm();
          }
        } catch (err) {
          // Non-blocking
          console.warn("AdMob consent flow failed:", err);
        }
        // iOS App Tracking Transparency
        try {
          const trackingInfo = await AdMob.trackingAuthorizationStatus();
          if (trackingInfo.status === "notDetermined") {
            await AdMob.requestTrackingAuthorization();
          }
        } catch {}
        if (!cancelled) setInitialized(true);
      } catch (err) {
        console.error("AdMob init failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNative]);

  /**
   * Show a rewarded ad. Resolves to true if the user earned the reward
   * (i.e. watched the full ad), false otherwise.
   */
  const showRewarded = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;
    try {
      const { AdMob, RewardAdPluginEvents } = await import(
        "@capacitor-community/admob"
      );
      const adId = getAdUnitId();

      let rewarded = false;
      const listeners: Array<{ remove: () => Promise<void> }> = [];

      // Promise that resolves on the first terminal event
      const result = new Promise<boolean>(async (resolve) => {
        let settled = false;
        const settle = (val: boolean, delay = 0) => {
          if (settled) return;
          settled = true;
          if (delay > 0) {
            setTimeout(() => resolve(val), delay);
          } else {
            resolve(val);
          }
        };

        listeners.push(
          await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
            rewarded = true;
            settle(true);
          })
        );
        listeners.push(
          await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
            // Wait briefly in case Rewarded event arrives just after Dismissed
            setTimeout(() => settle(rewarded), 500);
          })
        );
        listeners.push(
          await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => settle(false))
        );
        listeners.push(
          await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => settle(false))
        );

        // Safety timeout: if nothing happens within 5 minutes, resolve false
        setTimeout(() => settle(rewarded), 5 * 60 * 1000);
      });

      try {
        await AdMob.prepareRewardVideoAd({ adId, isTesting: isDev });
        await AdMob.showRewardVideoAd();
      } catch (err) {
        console.error("Failed to prepare/show rewarded ad:", err);
        // Cleanup listeners and bail
        await Promise.all(listeners.map((l) => l.remove().catch(() => {})));
        return false;
      }

      const earned = await result;

      // Cleanup
      await Promise.all(listeners.map((l) => l.remove().catch(() => {})));
      return earned;
    } catch (err) {
      console.error("Rewarded ad failed:", err);
      return false;
    }
  }, [isNative]);

  /**
   * Re-open the GDPR / privacy consent form so the user can change or
   * revoke their previously given consent. Resolves to true if the form
   * was shown successfully.
   */
  const showPrivacyOptions = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;
    try {
      const { AdMob } = await import("@capacitor-community/admob");
      // Refresh consent info so the SDK knows whether a privacy options
      // form is available for this user (region-dependent).
      const info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable) {
        await AdMob.showConsentForm();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Privacy options form failed:", err);
      return false;
    }
  }, [isNative]);

  return { isNative, initialized, showRewarded, showPrivacyOptions };
}
