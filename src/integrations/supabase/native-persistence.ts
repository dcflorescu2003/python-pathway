// Native session persistence shim for Capacitor (iOS/Android).
//
// Why: on Capacitor iOS, WKWebView's localStorage can be evicted by the OS
// (low storage, app updates, certain backgrounding scenarios) which causes
// Supabase to "forget" the session a few seconds after login and emit
// SIGNED_OUT. This module mirrors any Supabase auth keys (`sb-*`) into
// @capacitor/preferences (UserDefaults on iOS / SharedPreferences on Android)
// and rehydrates them into localStorage at boot before Supabase initializes.
//
// IMPORTANT: We DO NOT propagate localStorage.removeItem to Preferences
// immediately. Supabase's GoTrue client clears localStorage when a token
// refresh fails (which can happen for benign reasons: poor network, clock
// skew, or a transient 5xx). If we mirrored that delete into Preferences
// we'd destroy our only durable backup, making auth-recovery impossible.
//
// Strategy: write-through on setItem, "soft delete" on removeItem. Cleared
// keys are kept in Preferences for up to BACKUP_TTL_MS so the auth layer
// can attempt a recovery; older backups are pruned at next boot.
//
// On web this module is a no-op.

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const isNative = Capacitor.isNativePlatform();
const PREFIX_KEYS = ["sb-", "supabase.auth"];
const BACKUP_TS_KEY = "pyro-auth-backup-ts";
const BACKUP_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const isAuthKey = (key: string) =>
  PREFIX_KEYS.some((p) => key.startsWith(p) || key.includes(p));

let installed = false;

/**
 * Read all currently-stored Supabase auth backups from native Preferences.
 * Used by the auth layer to attempt recovery after a transient SIGNED_OUT.
 */
export async function readNativeAuthBackup(): Promise<Record<string, string>> {
  if (!isNative) return {};
  try {
    const { keys } = await Preferences.keys();
    const out: Record<string, string> = {};
    await Promise.all(
      keys.map(async (key) => {
        if (!isAuthKey(key)) return;
        const { value } = await Preferences.get({ key });
        if (value != null) out[key] = value;
      })
    );
    return out;
  } catch {
    return {};
  }
}

/**
 * Force-clear the native auth backup. Call this only when the user has
 * truly signed out (explicit signOut button) or when a recovery attempt
 * has confirmed the refresh token is permanently invalid.
 */
export async function clearNativeAuthBackup(): Promise<void> {
  if (!isNative) return;
  try {
    const { keys } = await Preferences.keys();
    await Promise.all(
      keys.map((key) =>
        isAuthKey(key) ? Preferences.remove({ key }) : Promise.resolve()
      )
    );
    await Preferences.remove({ key: BACKUP_TS_KEY }).catch(() => undefined);
  } catch {
    /* ignore */
  }
}

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
    // 0. Prune stale backups (older than BACKUP_TTL_MS).
    try {
      const { value: tsRaw } = await Preferences.get({ key: BACKUP_TS_KEY });
      const ts = tsRaw ? parseInt(tsRaw, 10) : 0;
      if (ts && Date.now() - ts > BACKUP_TTL_MS) {
        await clearNativeAuthBackup();
      }
    } catch {
      /* ignore */
    }

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

    // 3. Mirror future localStorage writes into Preferences. Note that
    //    removeItem deliberately does NOT clear Preferences — see header
    //    comment. Use clearNativeAuthBackup() when truly signing out.
    const origSetItem = localStorage.setItem.bind(localStorage);

    localStorage.setItem = (key: string, value: string) => {
      origSetItem(key, value);
      if (isAuthKey(key)) {
        Preferences.set({ key, value })
          .then(() =>
            Preferences.set({ key: BACKUP_TS_KEY, value: String(Date.now()) })
          )
          .catch(() => undefined);
      }
    };
  } catch (err) {
    console.warn("[native-auth-persistence] install failed", err);
  }
}
