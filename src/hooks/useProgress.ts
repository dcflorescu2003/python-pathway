import { useState, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";


export interface UserProgress {
  xp: number;
  streak: number;
  lives: number;
  completedLessons: Record<string, { score: number; completed: boolean }>;
  startedLessons: Record<string, true>;
  skipUnlockedLessons: Record<string, true>;
  lastActivityDate: string;
  isPremium: boolean;
  /**
   * Silent flag: lives never decrement, displayed as ∞.
   * True for Premium users OR verified teachers (teacher_status='verified').
   * Verified teachers DO NOT get any other Premium perk; never advertise this in UI.
   */
  hasUnlimitedLives: boolean;
  livesUpdatedAt: string;
}

const MAX_LIVES = 5;
// Full refill happens 30 minutes after the user runs out of lives (lives === 0).
// No partial regeneration — between 1 and 4 lives, the only fast refill is a rewarded ad.
const FULL_REGEN_MS = 30 * 60 * 1000;
const STORAGE_KEY_PREFIX = "pyro-progress";
const LEGACY_KEY = "pylearn-progress";
const PENDING_SYNC_PREFIX = "pyro-progress-pending-sync";
const AWARD_QUEUE_PREFIX = "pyro-award-queue";

/** Un item de progres care trebuie trimis la server pentru XP. */
export interface AwardQueueItem {
  itemId: string;
  score: number;
  allowRedo: boolean;
  viaSolution: boolean;
  optimisticXp: number;
  attempts: number;
  lastAttemptAt: number;
  queuedAt: number;
}

function getAwardQueueKey(userId: string) {
  return `${AWARD_QUEUE_PREFIX}:${userId}`;
}

function readAwardQueue(userId: string): AwardQueueItem[] {
  try {
    const raw = localStorage.getItem(getAwardQueueKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AwardQueueItem[]) : [];
  } catch {
    return [];
  }
}

function writeAwardQueue(userId: string, items: AwardQueueItem[]) {
  try {
    if (items.length === 0) localStorage.removeItem(getAwardQueueKey(userId));
    else localStorage.setItem(getAwardQueueKey(userId), JSON.stringify(items));
  } catch {}
}

function enqueueAward(userId: string, item: Omit<AwardQueueItem, "attempts" | "lastAttemptAt" | "queuedAt">) {
  const queue = readAwardQueue(userId);
  // Un singur item în coadă per (itemId, viaSolution): păstrăm scorul maxim.
  const existing = queue.find((q) => q.itemId === item.itemId && q.viaSolution === item.viaSolution);
  if (existing) {
    existing.score = Math.max(existing.score, item.score);
    existing.allowRedo = existing.allowRedo || item.allowRedo;
    existing.optimisticXp = Math.max(existing.optimisticXp, item.optimisticXp);
  } else {
    queue.push({ ...item, attempts: 0, lastAttemptAt: 0, queuedAt: Date.now() });
  }
  writeAwardQueue(userId, queue);
}

function dequeueAward(userId: string, itemId: string, viaSolution: boolean) {
  const queue = readAwardQueue(userId).filter((q) => !(q.itemId === itemId && q.viaSolution === viaSolution));
  writeAwardQueue(userId, queue);
}

/** XP estimat, încă netrimis la server. */
function pendingQueueXp(userId: string): number {
  return readAwardQueue(userId).reduce((sum, q) => sum + (q.optimisticXp || 0), 0);
}

function getPendingSyncKey(userId: string) {
  return `${PENDING_SYNC_PREFIX}:${userId}`;
}

function markPendingSync(userId: string) {
  try { localStorage.setItem(getPendingSyncKey(userId), "1"); } catch {}
}

function clearPendingSync(userId: string) {
  try { localStorage.removeItem(getPendingSyncKey(userId)); } catch {}
}

function hasPendingSync(userId: string) {
  try { return localStorage.getItem(getPendingSyncKey(userId)) === "1"; } catch { return false; }
}


async function syncToCloudWithRetry(userId: string, p: UserProgress, attempts = 3) {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      await syncToCloud(userId, p);
      clearPendingSync(userId);
      return true;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  }
  console.error("[useProgress] syncToCloud failed after retries:", lastErr);
  markPendingSync(userId);
  return false;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function createDefaultProgress(): UserProgress {
  return {
    xp: 0,
    streak: 0,
    lives: MAX_LIVES,
    completedLessons: {},
    startedLessons: {},
    skipUnlockedLessons: {},
    lastActivityDate: "",
    isPremium: false,
    hasUnlimitedLives: false,
    livesUpdatedAt: new Date().toISOString(),
  };
}

function getScopedStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function checkStreakExpiry(p: UserProgress): UserProgress {
  if (!p.lastActivityDate) return { ...p, streak: 0 };
  const today = getTodayDate();
  const yesterdayStr = getYesterdayDate();

  if (p.lastActivityDate !== today && p.lastActivityDate !== yesterdayStr) {
    return { ...p, streak: 0 };
  }
  return p;
}

function computeNewStreak(currentStreak: number, lastActivityDate: string): number {
  const today = getTodayDate();
  if (lastActivityDate === today) return currentStreak;
  if (lastActivityDate === getYesterdayDate()) return currentStreak + 1;
  return 1;
}

function regenerateLives(p: UserProgress): UserProgress {
  if (p.hasUnlimitedLives || p.lives >= MAX_LIVES) return p;
  // Only full refill, only when the user is at 0 and 30 minutes have passed.
  if (p.lives !== 0) return p;
  const now = Date.now();
  const lastUpdate = new Date(p.livesUpdatedAt).getTime();
  if (now - lastUpdate < FULL_REGEN_MS) return p;
  return { ...p, lives: MAX_LIVES, livesUpdatedAt: new Date().toISOString() };
}

function parseStoredProgress(stored: string): UserProgress | null {
  try {
    const parsed = JSON.parse(stored);
    const merged: UserProgress = { ...createDefaultProgress(), ...parsed };
    // Defensive normalization: any entry present in completedLessons means the
    // lesson WAS completed. Old builds could leave behind { completed: false }
    // entries on device storage; force them to true so chapter counters match
    // the cloud state immediately, without waiting for a successful cloud merge.
    if (merged.completedLessons && typeof merged.completedLessons === "object") {
      const normalized: Record<string, { score: number; completed: boolean }> = {};
      for (const [id, data] of Object.entries(merged.completedLessons)) {
        const entry = data as { score?: number; completed?: boolean } | undefined;
        normalized[id] = {
          score: typeof entry?.score === "number" ? entry.score : 0,
          completed: true,
        };
      }
      merged.completedLessons = normalized;
    }
    return regenerateLives(checkStreakExpiry(merged));
  } catch {
    return null;
  }
}

function loadLocalProgress(userId?: string): UserProgress {
  try {
    if (userId) {
      const stored = localStorage.getItem(getScopedStorageKey(userId));
      return stored ? parseStoredProgress(stored) ?? createDefaultProgress() : createDefaultProgress();
    }

    const stored = localStorage.getItem(STORAGE_KEY_PREFIX) || localStorage.getItem(LEGACY_KEY);
    return stored ? parseStoredProgress(stored) ?? createDefaultProgress() : createDefaultProgress();
  } catch {
    return createDefaultProgress();
  }
}

function saveLocalProgress(p: UserProgress, userId?: string) {
  // Never write progress to the un-scoped key: it is read at boot before the
  // user is known, so a leftover snapshot would leak into the next account
  // that signs in on this device.
  if (!userId) return;
  try {
    localStorage.setItem(getScopedStorageKey(userId), JSON.stringify(p));
    localStorage.removeItem(STORAGE_KEY_PREFIX);
    localStorage.removeItem(LEGACY_KEY);
  } catch {}
}

export function useProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Start from a clean slate; real progress is loaded once the user id is known.
  const [progress, setProgress] = useState<UserProgress>(() => createDefaultProgress());
  const [streakJustIncreased, setStreakJustIncreased] = useState(false);
  const [newStreakCount, setNewStreakCount] = useState(0);
  // Câte acordări de XP așteaptă încă trimiterea către server.
  const [pendingAwards, setPendingAwards] = useState(0);
  const prevUserId = useRef<string | null>(null);
  const flushingRef = useRef(false);


  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const updated = regenerateLives(prev);
        if (updated.lives !== prev.lives) {
          saveLocalProgress(updated, user?.id);
          if (user) {
            supabase
              .from("profiles")
              .update({ lives: updated.lives, lives_updated_at: updated.livesUpdatedAt })
              .eq("user_id", user.id)
              .then();
          }
        }
        return updated;
      });
    }, 60_000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) {
      prevUserId.current = null;
      setProgress(createDefaultProgress());
      return;
    }

    if (prevUserId.current === user.id) return;
    prevUserId.current = user.id;

    setProgress(loadLocalProgress(user.id));

    const loadCloud = async () => {
      try {
        const [profileRes, lessonsRes, skipRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("xp, streak, lives, is_premium, last_activity_date, lives_updated_at, teacher_status")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("completed_lessons")
            .select("lesson_id, score")
            .eq("user_id", user.id),
          supabase
            .from("skip_unlocked_lessons")
            .select("lesson_id")
            .eq("user_id", user.id),
        ]);

        const anyError = profileRes.error || lessonsRes.error || skipRes.error;

        if (anyError) {
          console.error("[useProgress] cloud fetch error:", {
            profile: profileRes.error?.message,
            lessons: lessonsRes.error?.message,
            skips: skipRes.error?.message,
          });

          // Detect invalid/expired JWT (RLS would silently return 0 rows otherwise)
          const msg = `${profileRes.error?.message ?? ""} ${lessonsRes.error?.message ?? ""} ${skipRes.error?.message ?? ""}`.toLowerCase();
          const isAuthErr = msg.includes("jwt") || msg.includes("sub claim") || msg.includes("invalid claim") || msg.includes("not authenticated");

          if (isAuthErr) {
            try {
              const { data: userCheck, error: userErr } = await supabase.auth.getUser();
              if (userErr || !userCheck?.user) {
                console.warn("[useProgress] session invalid, signing out for re-login");
                await supabase.auth.signOut();
                if (typeof window !== "undefined") window.location.assign("/auth");
                return;
              }
            } catch {
              /* ignore */
            }
          }
          // IMPORTANT: do NOT overwrite local progress with empty when cloud errors.
          return;
        }

        const profile = profileRes.data;
        const lessons = lessonsRes.data;
        const skipUnlocks = skipRes.data;

        const cloudCompleted: Record<string, { score: number; completed: boolean }> = {};
        lessons?.forEach((lesson) => {
          cloudCompleted[lesson.lesson_id] = { score: lesson.score, completed: true };
        });

        const cloudSkipUnlocks: Record<string, true> = {};
        skipUnlocks?.forEach((row) => {
          cloudSkipUnlocks[row.lesson_id] = true;
        });

        const isPremiumCloud = profile?.is_premium ?? false;
        const isVerifiedTeacher = (profile as any)?.teacher_status === "verified";

        const cloudProgress: UserProgress = {
          xp: profile?.xp ?? 0,
          streak: profile?.streak ?? 0,
          lives: profile?.lives ?? MAX_LIVES,
          isPremium: isPremiumCloud,
          hasUnlimitedLives: isPremiumCloud || isVerifiedTeacher,
          lastActivityDate: profile?.last_activity_date ?? getTodayDate(),
          completedLessons: cloudCompleted,
          startedLessons: {},
          skipUnlockedLessons: cloudSkipUnlocks,
          livesUpdatedAt: profile?.lives_updated_at ?? new Date().toISOString(),
        };

        const localProgress = loadLocalProgress(user.id);
        const localCompletedCount = Object.keys(localProgress.completedLessons).length;
        const cloudCompletedCount = Object.keys(cloudCompleted).length;
        console.log("[useProgress] loaded from cloud:", { cloudCompletedCount, localCompletedCount, xp: cloudProgress.xp });

        // Always merge — never overwrite local progress with cloud "zeros".
        // mergeProgress keeps the union of completed lessons and the higher scores.
        const mergedProgress = checkStreakExpiry(mergeProgress(localProgress, cloudProgress));
        // Apply 30-min lives regeneration immediately on cloud load so a user who
        // reopens the app after the timer elapsed sees 5/5 right away instead of
        // waiting for the 60s interval tick.
        const finalProgress = regenerateLives(mergedProgress);

        setProgress(finalProgress);
        saveLocalProgress(finalProgress, user.id);

        if (finalProgress.lives !== mergedProgress.lives) {
          void supabase
            .from("profiles")
            .update({ lives: finalProgress.lives, lives_updated_at: finalProgress.livesUpdatedAt })
            .eq("user_id", user.id);
        }

        const localHasExtras =
          localCompletedCount > cloudCompletedCount ||
          Object.keys(localProgress.skipUnlockedLessons).length > Object.keys(cloudSkipUnlocks).length;

        if (localHasExtras || hasPendingSync(user.id)) {
          const extra = Math.max(0, localCompletedCount - cloudCompletedCount);
          console.log("[useProgress] pushing local-only lessons to cloud:", { extra, pendingFlag: hasPendingSync(user.id) });
          await syncToCloudWithRetry(user.id, finalProgress);
        }
      } catch (err) {
        console.error("[useProgress] Failed to load cloud progress:", err);
      }
    };

    void loadCloud();
  }, [user]);

  // Re-sync from cloud when tab/window regains focus, so counters on Index reflect
  // updates made elsewhere (e.g. streak bumped in LessonPage).
  useEffect(() => {
    if (!user) return;

    const refetch = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("xp, streak, lives, is_premium, last_activity_date, lives_updated_at, teacher_status")
          .eq("user_id", user.id)
          .single();
        if (!profile) return;

        setProgress((prev) => {
          const cloudDate = profile.last_activity_date ?? "";
          const cloudXP = profile.xp ?? prev.xp;
          const cloudStreak = profile.streak ?? prev.streak;

          const isPremiumCloud = profile.is_premium ?? prev.isPremium;
          const isVerifiedTeacher = (profile as any).teacher_status === "verified";

          // XP / streak sunt autoritare pe server (award_progress). Nu mai
          // folosim max(local, cloud): altfel o valoare locală veche/optimistă
          // rămâne pe telefon și diferă de web și de clasamente.
          const base: UserProgress = {
            ...prev,
            xp: cloudXP,
            streak: cloudStreak,
            lives: profile.lives ?? prev.lives,
            isPremium: isPremiumCloud,
            hasUnlimitedLives: isPremiumCloud || isVerifiedTeacher,
            lastActivityDate: cloudDate > prev.lastActivityDate ? cloudDate : prev.lastActivityDate,
            livesUpdatedAt: profile.lives_updated_at ?? prev.livesUpdatedAt,
          };

          const regenerated = regenerateLives(base);

          const unchanged =
            regenerated.xp === prev.xp &&
            regenerated.streak === prev.streak &&
            regenerated.lastActivityDate === prev.lastActivityDate &&
            regenerated.isPremium === prev.isPremium &&
            regenerated.hasUnlimitedLives === prev.hasUnlimitedLives &&
            regenerated.lives === prev.lives &&
            regenerated.livesUpdatedAt === prev.livesUpdatedAt;
          if (unchanged) return prev;

          saveLocalProgress(regenerated, user.id);

          if (regenerated.lives !== base.lives) {
            void supabase
              .from("profiles")
              .update({ lives: regenerated.lives, lives_updated_at: regenerated.livesUpdatedAt })
              .eq("user_id", user.id);
          }

          return regenerated;
        });
      } catch (err) {
        console.error("Failed to refetch progress on focus:", err);
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    const onFocus = () => void refetch();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    // Native (Capacitor): `focus`/`visibilitychange` nu se declanșează fiabil la
    // revenirea din background, deci ascultăm explicit appStateChange.
    let removeNative: (() => void) | undefined;
    void (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) void refetch();
        });
        removeNative = () => { void handle.remove(); };
      } catch {}
    })();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      removeNative?.();
    };

  }, [user]);

  const applyServerAward = useCallback(
    (lessonId: string, result: any) => {
      if (!result) return;
      setProgress((prev) => {
        const newStarted = { ...prev.startedLessons };
        delete newStarted[lessonId];
        // XP-ul serverului + estimarea itemilor rămași în coadă (netrimiși).
        const pending = user ? pendingQueueXp(user.id) : 0;
        const newProgress: UserProgress = {
          ...prev,
          xp: typeof result.total_xp === "number" ? result.total_xp + pending : prev.xp,
          streak: typeof result.streak === "number" ? result.streak : prev.streak,
          lastActivityDate: getTodayDate(),
          completedLessons: {
            ...prev.completedLessons,
            [lessonId]: {
              score: Math.max(prev.completedLessons[lessonId]?.score ?? 0, result.score ?? 0),
              completed: true,
            },
          },
          startedLessons: newStarted,
        };
        saveLocalProgress(newProgress, user?.id);
        return newProgress;
      });
      if (result.streak_increased) {
        setStreakJustIncreased(true);
        setNewStreakCount(result.streak ?? 0);
      }
      // XP-ul s-a schimbat pe server → clasamentele trebuie recitite.
      queryClient.invalidateQueries({ queryKey: ["leaderboard-top"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-user-rank"] });
    },
    [user, queryClient]
  );

  /**
   * Trimite către server toate acordările de XP rămase în coadă (offline,
   * sesiune expirată, erori de rețea). Idempotent: `award_progress` nu acordă
   * XP de două ori pentru același item și scor.
   */
  const flushAwardQueue = useCallback(async () => {
    if (!user) return;
    if (flushingRef.current) return;
    const queue = readAwardQueue(user.id);
    if (queue.length === 0) {
      setPendingAwards(0);
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setPendingAwards(queue.length);
      return;
    }

    flushingRef.current = true;
    let anySuccess = false;
    try {
      for (const item of queue) {
        // Backoff: nu reîncercăm imediat un item care tocmai a eșuat.
        const backoffMs = Math.min(5 * 60_000, 5_000 * Math.pow(2, Math.min(item.attempts, 6)));
        if (item.attempts > 0 && Date.now() - item.lastAttemptAt < backoffMs) continue;

        const { data, error } = await supabase.rpc("award_progress" as any, {
          p_item_id: item.itemId,
          p_score: item.score,
          p_allow_redo: item.allowRedo,
          p_via_solution: item.viaSolution,
        });

        if (error) {
          console.warn("[flushAwardQueue] award_progress failed:", item.itemId, error.message);
          const current = readAwardQueue(user.id);
          const entry = current.find((q) => q.itemId === item.itemId && q.viaSolution === item.viaSolution);
          if (entry) {
            entry.attempts += 1;
            entry.lastAttemptAt = Date.now();
            writeAwardQueue(user.id, current);
          }
          continue;
        }

        dequeueAward(user.id, item.itemId, item.viaSolution);
        anySuccess = true;
        applyServerAward(item.itemId, data as any);
      }
    } finally {
      flushingRef.current = false;
      const remaining = readAwardQueue(user.id);
      setPendingAwards(remaining.length);
      if (remaining.length === 0) clearPendingSync(user.id);
      if (anySuccess) {
        queryClient.invalidateQueries({ queryKey: ["leaderboard-top"] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard-user-rank"] });
      }
    }
  }, [user, applyServerAward, queryClient]);

  // Golim coada la pornire/autentificare, la revenirea online, la revenirea în
  // prim-plan și periodic cât timp mai există elemente nesincronizate.
  useEffect(() => {
    if (!user) {
      setPendingAwards(0);
      return;
    }
    setPendingAwards(readAwardQueue(user.id).length);
    void flushAwardQueue();

    const onOnline = () => void flushAwardQueue();
    const onVisible = () => {
      if (document.visibilityState === "visible") void flushAwardQueue();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    const interval = setInterval(() => {
      if (readAwardQueue(user.id).length > 0) void flushAwardQueue();
    }, 30_000);

    let removeNative: (() => void) | undefined;
    void (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) void flushAwardQueue();
        });
        removeNative = () => { void handle.remove(); };
      } catch {}
    })();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
      removeNative?.();
    };
  }, [user, flushAwardQueue]);

  const completeLesson = useCallback(
    async (lessonId: string, xpEarned: number, score: number) => {
      let optimisticAwarded = 0;
      // Actualizare optimistă locală (XP-ul final este calculat pe server)
      setProgress((prev) => {
        const previousEntry = prev.completedLessons[lessonId];
        const alreadyCompleted = !!previousEntry?.completed;
        const optimisticXP = alreadyCompleted ? 3 : xpEarned;
        optimisticAwarded = optimisticXP;

        const today = getTodayDate();
        const isFirstActivityToday = prev.lastActivityDate !== today;
        const newStreak = computeNewStreak(prev.streak, prev.lastActivityDate);

        if (isFirstActivityToday && !user) {
          setStreakJustIncreased(true);
          setNewStreakCount(newStreak);
        }

        const bestScore = Math.max(previousEntry?.score ?? 0, score);
        const newStarted = { ...prev.startedLessons };
        delete newStarted[lessonId];

        const newProgress: UserProgress = {
          ...prev,
          xp: prev.xp + optimisticXP,
          streak: newStreak,
          lastActivityDate: today,
          completedLessons: {
            ...prev.completedLessons,
            [lessonId]: { score: bestScore, completed: true },
          },
          startedLessons: newStarted,
        };

        saveLocalProgress(newProgress, user?.id);
        return newProgress;
      });

      if (!user) return;

      // Outbox: itemul intră în coadă înainte de apelul de rețea, ca să nu se
      // piardă XP-ul dacă apelul eșuează (offline, semnal slab, token expirat).
      enqueueAward(user.id, {
        itemId: lessonId,
        score,
        allowRedo: true,
        viaSolution: false,
        optimisticXp: optimisticAwarded,
      });
      setPendingAwards(readAwardQueue(user.id).length);

      await flushAwardQueue();
      if (readAwardQueue(user.id).length > 0) markPendingSync(user.id);
    },
    [user, flushAwardQueue]
  );

  /**
   * Elevul a apelat la rezolvarea unei probleme: o marcăm ca rezolvată și
   * primește 1 XP (doar prima dată).
   */
  const revealSolution = useCallback(
    async (itemId: string) => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("award_progress" as any, {
        p_item_id: itemId,
        p_score: 0,
        p_allow_redo: false,
        p_via_solution: true,
      });
      if (error) {
        console.error("[revealSolution] award_progress failed:", error.message);
        enqueueAward(user.id, {
          itemId,
          score: 0,
          allowRedo: false,
          viaSolution: true,
          optimisticXp: 1,
        });
        setPendingAwards(readAwardQueue(user.id).length);
        markPendingSync(user.id);
        return null;
      }
      applyServerAward(itemId, data as any);
      return data as any;
    },
    [user, applyServerAward]
  );



  const loseLife = useCallback(() => {
    setProgress((prev) => {
      if (prev.hasUnlimitedLives) return prev;
      const now = new Date().toISOString();
      const newLives = Math.max(0, prev.lives - 1);
      const newProgress = {
        ...prev,
        lives: newLives,
        // Anchor the 30-minute timer to the moment the user hits 0 lives.
        livesUpdatedAt: newLives === 0 ? now : prev.livesUpdatedAt,
      };
      saveLocalProgress(newProgress, user?.id);
      if (user) {
        supabase
          .from("profiles")
          .update({ lives: newLives, lives_updated_at: newProgress.livesUpdatedAt })
          .eq("user_id", user.id)
          .then();
      }
      return newProgress;
    });
  }, [user]);

  const resetLives = useCallback(() => {
    setProgress((prev) => {
      const now = new Date().toISOString();
      const newProgress = { ...prev, lives: MAX_LIVES, livesUpdatedAt: now };
      saveLocalProgress(newProgress, user?.id);
      if (user) {
        supabase
          .from("profiles")
          .update({ lives: MAX_LIVES, lives_updated_at: now })
          .eq("user_id", user.id)
          .then();
      }
      return newProgress;
    });
  }, [user]);

  const setLivesFromReward = useCallback(
    (newLives: number, livesUpdatedAt: string) => {
      setProgress((prev) => {
        const newProgress = { ...prev, lives: newLives, livesUpdatedAt };
        saveLocalProgress(newProgress, user?.id);
        return newProgress;
      });
    },
    [user]
  );

  const setPremium = useCallback(
    (value: boolean) => {
      setProgress((prev) => {
        const newProgress = { ...prev, isPremium: value, hasUnlimitedLives: value || prev.hasUnlimitedLives };
        saveLocalProgress(newProgress, user?.id);
        if (user) {
          supabase
            .from("profiles")
            .update({ is_premium: value })
            .eq("user_id", user.id)
            .then();
        }
        return newProgress;
      });
    },
    [user]
  );

  const recordActivity = useCallback(() => {
    setProgress((prev) => {
      const today = getTodayDate();
      if (prev.lastActivityDate === today) return prev;

      const newStreak = computeNewStreak(prev.streak, prev.lastActivityDate);
      setStreakJustIncreased(true);
      setNewStreakCount(newStreak);

      const newProgress: UserProgress = {
        ...prev,
        streak: newStreak,
        lastActivityDate: today,
      };

      saveLocalProgress(newProgress, user?.id);
      if (user) {
        // Streak-ul este calculat pe server (anti-fraudă)
        supabase
          .rpc("record_activity" as any)
          .then(({ data, error }: any) => {
            if (error) return console.error("[recordActivity]", error.message);
            if (data && typeof data.streak === "number") {
              setProgress((cur) => {
                const synced = { ...cur, streak: data.streak, lastActivityDate: today };
                saveLocalProgress(synced, user.id);
                return synced;
              });
            }
          });
      }
      return newProgress;
    });
  }, [user]);


  const dismissStreakCelebration = useCallback(() => setStreakJustIncreased(false), []);

  const unlockLessonViaSkip = useCallback(
    (lessonIds: string[]) => {
      setProgress((prev) => {
        const newSkipUnlocks = { ...prev.skipUnlockedLessons };
        for (const id of lessonIds) newSkipUnlocks[id] = true;
        const newProgress = { ...prev, skipUnlockedLessons: newSkipUnlocks };
        saveLocalProgress(newProgress, user?.id);
        if (user) {
          const rows = lessonIds.map((lesson_id) => ({ user_id: user.id, lesson_id }));
          supabase
            .from("skip_unlocked_lessons")
            .upsert(rows, { onConflict: "user_id,lesson_id", ignoreDuplicates: true })
            .then(({ error }) => {
              if (error) console.error("Failed to sync skip unlocks:", error);
            });
        }
        return newProgress;
      });
    },
    [user]
  );

  const markLessonStarted = useCallback(
    (lessonId: string) => {
      setProgress((prev) => {
        // dacă lecția e deja completă sau deja marcată ca începută, nu facem nimic
        // Dacă lecția e deja înregistrată ca finalizată (cu sau fără flag),
        // nu o re-marcăm ca „început” — altfel tile-ul ar afișa simbolul de reluare.
        if (prev.completedLessons[lessonId]) return prev;
        if (prev.startedLessons[lessonId]) return prev;
        const newProgress: UserProgress = {
          ...prev,
          startedLessons: { ...prev.startedLessons, [lessonId]: true },
        };
        saveLocalProgress(newProgress, user?.id);
        return newProgress;
      });
    },
    [user]
  );

  const resyncFromCloud = useCallback(async (): Promise<{ ok: boolean; count: number; error?: string; pushed?: number; report?: SyncReport | null }> => {
    if (!user) return { ok: false, count: 0, error: "Nu ești autentificat." };
    try {
      // PUSH first: restore the local history in one server-side batch. Historical
      // synchronization must never call award_progress or grant XP again.
      const localProgress = loadLocalProgress(user.id);
      const localCompleted = Object.entries(localProgress.completedLessons).filter(([, v]) => v.completed);
      let pushed = 0;
      let syncReport: SyncReport | null = null;
      if (localCompleted.length > 0) {
        console.log("[useProgress] resync push:", localCompleted.length, "local completions");
        syncReport = await syncToCloud(user.id, localProgress);
        pushed = localCompleted.length;
      }


      const [profileRes, lessonsRes, skipRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("xp, streak, lives, is_premium, last_activity_date, lives_updated_at, teacher_status")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("completed_lessons")
          .select("lesson_id, score")
          .eq("user_id", user.id),
        supabase
          .from("skip_unlocked_lessons")
          .select("lesson_id")
          .eq("user_id", user.id),
      ]);

      if (profileRes.error || lessonsRes.error || skipRes.error) {
        const err = profileRes.error?.message || lessonsRes.error?.message || skipRes.error?.message;
        return { ok: false, count: 0, error: err };
      }

      const cloudCompleted: Record<string, { score: number; completed: boolean }> = {};
      lessonsRes.data?.forEach((l) => {
        cloudCompleted[l.lesson_id] = { score: l.score, completed: true };
      });
      const cloudSkipUnlocks: Record<string, true> = {};
      skipRes.data?.forEach((r) => { cloudSkipUnlocks[r.lesson_id] = true; });

      const profile = profileRes.data;
      const isPremiumCloud = profile?.is_premium ?? false;
      const isVerifiedTeacher = (profile as any)?.teacher_status === "verified";

      setProgress((prev) => {
        const cloudProgress: UserProgress = {
          xp: profile?.xp ?? prev.xp,
          streak: profile?.streak ?? prev.streak,
          lives: profile?.lives ?? prev.lives,
          isPremium: isPremiumCloud,
          hasUnlimitedLives: isPremiumCloud || isVerifiedTeacher,
          lastActivityDate: profile?.last_activity_date ?? prev.lastActivityDate,
          completedLessons: cloudCompleted,
          startedLessons: {},
          skipUnlockedLessons: cloudSkipUnlocks,
          livesUpdatedAt: profile?.lives_updated_at ?? prev.livesUpdatedAt,
        };
        const merged = checkStreakExpiry(mergeProgress(prev, cloudProgress));
        saveLocalProgress(merged, user.id);
        return merged;
      });

      return { ok: true, count: Object.keys(cloudCompleted).length, pushed, report: syncReport ?? getLastSyncReport() };
    } catch (err: any) {
      return { ok: false, count: 0, error: err?.message ?? "Eroare necunoscută" };
    }
  }, [user]);

  return { progress, completeLesson, revealSolution, loseLife, resetLives, setLivesFromReward, setPremium, recordActivity, unlockLessonViaSkip, markLessonStarted, streakJustIncreased, newStreakCount, dismissStreakCelebration, resyncFromCloud };
}

function mergeProgress(a: UserProgress, b: UserProgress): UserProgress {
  const mergedLessons: Record<string, { score: number; completed: boolean }> = {
    ...a.completedLessons,
  };

  for (const [id, data] of Object.entries(b.completedLessons)) {
    const existing = mergedLessons[id];
    if (!existing) {
      mergedLessons[id] = data;
    } else if (data.completed && !existing.completed) {
      // Cloud says completed → always wins over a stale local completed:false
      mergedLessons[id] = { ...data, score: Math.max(data.score, existing.score) };
    } else if (data.score > existing.score) {
      mergedLessons[id] = { ...data, completed: existing.completed || data.completed };
    }
  }

  const mergedSkipUnlocks: Record<string, true> = {
    ...a.skipUnlockedLessons,
    ...b.skipUnlockedLessons,
  };

  const mergedDate = !a.lastActivityDate ? b.lastActivityDate
    : !b.lastActivityDate ? a.lastActivityDate
    : a.lastActivityDate > b.lastActivityDate ? a.lastActivityDate : b.lastActivityDate;

  // Curăță startedLessons de orice id deja prezent în completedLessons:
  // o lecție terminată nu poate rămâne „în curs”.
  const mergedStarted: Record<string, true> = {};
  for (const [id, v] of Object.entries({ ...a.startedLessons, ...b.startedLessons })) {
    if (!mergedLessons[id]) mergedStarted[id] = v as true;
  }

  return {
    // XP, streak, lives, and their timestamps are server-authoritative. Taking
    // max(local, cloud) would preserve stale inflated values after a correction.
    xp: b.xp,
    streak: b.streak,
    lives: b.lives,
    livesUpdatedAt: b.livesUpdatedAt,
    isPremium: a.isPremium || b.isPremium,
    hasUnlimitedLives: a.hasUnlimitedLives || b.hasUnlimitedLives,
    lastActivityDate: mergedDate,
    completedLessons: mergedLessons,
    startedLessons: mergedStarted,
    skipUnlockedLessons: mergedSkipUnlocks,
  };
}

export interface SyncReport {
  restored: number;
  existing: number;
  skipped: number;
  unknownIds: string[];
}

let lastSyncReport: SyncReport | null = null;
export function getLastSyncReport() {
  return lastSyncReport;
}

async function syncToCloud(userId: string, p: UserProgress) {
  // XP / streak / best_streak sunt server-authoritative (anti-fraudă):
  // se scriu exclusiv prin award_progress / record_activity.
  await supabase
    .from("profiles")
    .update({
      // Do NOT write `lives` or `lives_updated_at` here. Those are managed
      // exclusively by loseLife / setLivesFromReward / regenerateLives so that
      // a page refresh or a stale localStorage copy cannot reset the 30-min
      // regeneration timer on web.
      is_premium: p.isPremium,
      last_activity_date: p.lastActivityDate,
    })
    .eq("user_id", userId);

  const lessonEntries = Object.entries(p.completedLessons)
    .filter(([, value]) => value.completed)
    .map(([lessonId, value]) => ({ lesson_id: lessonId, score: value.score }));

  const report: SyncReport = { restored: 0, existing: 0, skipped: 0, unknownIds: [] };

  if (lessonEntries.length > 0) {
    // A single idempotent call validates every ID and restores the whole history
    // without touching XP, streak, or activity dates.
    const { data: restoreRes, error: restoreErr } = await supabase.rpc("restore_progress" as any, {
      p_items: lessonEntries,
    });
    if (restoreErr) {
      console.warn("[syncToCloud] restore_progress:", restoreErr.message);
      throw restoreErr;
    }
    const r = (restoreRes ?? {}) as { restored?: number; existing?: number; skipped?: number; unknown_ids?: string[] };
    report.restored = r.restored ?? 0;
    report.existing = r.existing ?? 0;
    report.skipped = r.skipped ?? 0;
    report.unknownIds = r.unknown_ids ?? [];
  }

  lastSyncReport = report;
  return report;
}


