// Native session persistence shim for Capacitor (iOS/Android).
//
// Why: on Capacitor iOS, WKWebView's localStorage can be evicted by the OS
// (low storage, app updates, certain backgrounding scenarios) which causes
// Supabase to "forget" the session a few seconds after login and emit
// SIGNED_OUT. This module mirrors any Supabase auth keys (`sb-*`) into
// @capacitor/preferences (UserDefaults on iOS / SharedPreferences on Android)
// and rehydrates them into localStorage at boot before Supabase initializes.
//
// On web this module is a no-op.

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const isNative = Capacitor.isNativePlatform();
const PREFIX_KEYS = ["sb-", "supabase.auth"];

const isAuthKey = (key: string) =>
  PREFIX_KEYS.some((p) => key.startsWith(p) || key.includes(p));

let installed = false;

/**
 * Synchronously hydrates localStorage from Preferences and starts mirroring
 * future writes. Must run before the Supabase client is created.
 *
 * Returns a promise that resolves once hydration completes; on native we
 * await it from main.tsx so the very first getSession() reads valid data.
 */
export async function installNativeAuthPersistence(): Promise<void> {
  if (!isNative || installed) return;
  installed = true;

  try {
    // 1. Hydrate localStorage from Preferences (durable storage → volatile WebView).
    const { keys } = await Preferences.keys();
    await Promise.all(
      keys.map(async (key) => {
        if (!isAuthKey(key)) return;
        const { value } = await Preferences.get({ key });
        if (value != null) {
          try {
            localStorage.setItem(key, value);
          } catch {
            /* localStorage may be temporarily unavailable */
          }
        }
      })
    );

    // 2. Reverse-migrate: if a previous build only wrote to localStorage,
    //    copy those keys into Preferences so they survive WebView eviction.
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !isAuthKey(key)) continue;
        const existing = await Preferences.get({ key });
        if (existing.value != null) continue;
        const value = localStorage.getItem(key);
        if (value != null) {
          await Preferences.set({ key, value });
        }
      }
    } catch {
      /* ignore */
    }

    // 3. Mirror future localStorage writes into Preferences.
    const origSetItem = localStorage.setItem.bind(localStorage);
    const origRemoveItem = localStorage.removeItem.bind(localStorage);

    localStorage.setItem = (key: string, value: string) => {
      origSetItem(key, value);
      if (isAuthKey(key)) {
        Preferences.set({ key, value }).catch(() => undefined);
      }
    };

    localStorage.removeItem = (key: string) => {
      origRemoveItem(key);
      if (isAuthKey(key)) {
        Preferences.remove({ key }).catch(() => undefined);
      }
    };
  } catch (err) {
    console.warn("[native-auth-persistence] install failed", err);
  }
}
