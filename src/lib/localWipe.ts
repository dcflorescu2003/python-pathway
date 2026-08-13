import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

/**
 * Wipes all app-owned local data (progress, school, test drafts, dialog flags,
 * cooldowns) so a different account signing in on the same device starts clean.
 *
 * Supabase auth keys (`sb-*`) are NOT touched here — sign-out handles those.
 */
const KEY_PREFIXES = ["pyro-", "pylearn-", "test_draft_"];

const EXACT_KEYS = ["pyro-school"];

const isAppKey = (key: string) =>
  !key.startsWith("sb-") &&
  !key.includes("supabase.auth") &&
  (EXACT_KEYS.includes(key) || KEY_PREFIXES.some((p) => key.startsWith(p)));

export async function wipeLocalUserData() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && isAppKey(k)) keys.push(k);
    }
    keys.forEach((k) => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    });
  } catch { /* ignore */ }

  try {
    sessionStorage.clear();
  } catch { /* ignore */ }

  if (Capacitor.isNativePlatform()) {
    try {
      const { keys } = await Preferences.keys();
      await Promise.all(
        keys
          .filter((k) => isAppKey(k))
          .map((key) => Preferences.remove({ key }).catch(() => undefined)),
      );
    } catch { /* ignore */ }
  }
}
