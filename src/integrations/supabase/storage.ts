// Storage adapter for Supabase auth.
// On web → uses localStorage (sync, fast).
// On Capacitor native (iOS/Android) → uses @capacitor/preferences, which is
// guaranteed to be persisted to disk (UserDefaults / SharedPreferences) and
// is NOT evicted by WKWebView when iOS reclaims storage. This fixes the
// "logged in then logged out after a few seconds" bug on some iPhones where
// WKWebView's localStorage gets cleared between the auth callback and the
// first auto-refresh tick.

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

// In-memory cache so synchronous reads (which Supabase sometimes does at
// import time) still work on native after we hydrate from Preferences.
const memoryCache = new Map<string, string>();
let hydrationPromise: Promise<void> | null = null;

const isNative = Capacitor.isNativePlatform();

async function hydrateFromPreferences() {
  try {
    const { keys } = await Preferences.keys();
    await Promise.all(
      keys.map(async (key) => {
        const { value } = await Preferences.get({ key });
        if (value != null) memoryCache.set(key, value);
      })
    );

    // One-time migration: if Supabase auth keys still live in localStorage
    // (existing logged-in users on a previous build), copy them into
    // Preferences so they don't get logged out by the upgrade.
    if (typeof localStorage !== "undefined") {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (!key.startsWith("sb-") && !key.includes("supabase.auth")) continue;
          if (memoryCache.has(key)) continue;
          const value = localStorage.getItem(key);
          if (value == null) continue;
          memoryCache.set(key, value);
          await Preferences.set({ key, value });
        }
      } catch {
        // best-effort; ignore
      }
    }
  } catch (err) {
    console.warn("[supabase-storage] hydration failed", err);
  }
}

if (isNative) {
  hydrationPromise = hydrateFromPreferences();
}

export const supabaseAuthStorage = isNative
  ? {
      getItem: (key: string) => {
        // If we're still hydrating, await it so Supabase's initial getSession
        // sees the persisted token.
        if (hydrationPromise) {
          return hydrationPromise.then(() => memoryCache.get(key) ?? null);
        }
        return memoryCache.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        memoryCache.set(key, value);
        // fire-and-forget to disk; memory cache covers same-tick reads
        Preferences.set({ key, value }).catch((err) =>
          console.warn("[supabase-storage] setItem failed", err)
        );
      },
      removeItem: (key: string) => {
        memoryCache.delete(key);
        Preferences.remove({ key }).catch((err) =>
          console.warn("[supabase-storage] removeItem failed", err)
        );
      },
    }
  : (typeof localStorage !== "undefined" ? localStorage : undefined);
