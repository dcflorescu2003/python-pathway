import { useState, useCallback, useEffect, useRef } from "react";
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
  try {
    const key = userId ? getScopedStorageKey(userId) : STORAGE_KEY_PREFIX;
    localStorage.setItem(key, JSON.stringify(p));

    if (userId) {
      localStorage.removeItem(STORAGE_KEY_PREFIX);
      localStorage.removeItem(LEGACY_KEY);
    }
  } catch {}
}

export function useProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress>(() => loadLocalProgress());
  const [streakJustIncreased, setStreakJustIncreased] = useState(false);
  const [newStreakCount, setNewStreakCount] = useState(0);
  const prevUserId = useRef<string | null>(null);

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
          const isCloudNewer =
            (cloudDate && cloudDate > prev.lastActivityDate) ||
            (profile.streak ?? 0) > prev.streak ||
            (profile.xp ?? 0) > prev.xp;

          const isPremiumCloud = profile.is_premium ?? prev.isPremium;
          const isVerifiedTeacher = (profile as any).teacher_status === "verified";

          const base: UserProgress = isCloudNewer
            ? {
                ...prev,
                xp: Math.max(prev.xp, profile.xp ?? 0),
                streak: Math.max(prev.streak, profile.streak ?? 0),
                lives: profile.lives ?? prev.lives,
                isPremium: isPremiumCloud,
                hasUnlimitedLives: isPremiumCloud || isVerifiedTeacher,
                lastActivityDate: cloudDate > prev.lastActivityDate ? cloudDate : prev.lastActivityDate,
                livesUpdatedAt: profile.lives_updated_at ?? prev.livesUpdatedAt,
              }
            : {
                ...prev,
                // Still adopt cloud lives/livesUpdatedAt so regen can fire even
                // if no other field changed (e.g. user closed app at 0 lives).
                lives: profile.lives ?? prev.lives,
                livesUpdatedAt: profile.lives_updated_at ?? prev.livesUpdatedAt,
                isPremium: isPremiumCloud,
                hasUnlimitedLives: isPremiumCloud || isVerifiedTeacher,
              };

          const regenerated = regenerateLives(base);

          if (
            !isCloudNewer &&
            regenerated.lives === prev.lives &&
            regenerated.livesUpdatedAt === prev.livesUpdatedAt
          ) {
            return prev;
          }

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
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [user]);

  const completeLesson = useCallback(
    async (lessonId: string, xpEarned: number, score: number) => {
      let bonusMultiplier = 1;
      if (user) {
        try {
          const { data: memberships } = await supabase
            .from("class_members")
            .select("class_id")
            .eq("student_id", user.id);
          if (memberships && memberships.length > 0) {
            const classIds = memberships.map((membership) => membership.class_id);
            const { data: matchingChallenges } = await supabase
              .from("challenges")
              .select("id")
              .in("class_id", classIds)
              .eq("item_id", lessonId)
              .limit(1);
            if (matchingChallenges && matchingChallenges.length > 0) {
              bonusMultiplier = 1.1;
            }
          }
        } catch {}
      }

      setProgress((prev) => {
        const previousEntry = prev.completedLessons[lessonId];
        const alreadyCompleted = !!previousEntry?.completed;
        const finalXP = Math.round((alreadyCompleted ? 3 : xpEarned) * bonusMultiplier);

        // Diagnostic temporar: să vedem când și de ce se acordă 3 XP
        console.log("[completeLesson]", {
          lessonId,
          xpRewardSetat: xpEarned,
          alreadyCompleted,
          previousEntry,
          finalXP,
          bonusMultiplier,
        });

        const today = getTodayDate();
        const isFirstActivityToday = prev.lastActivityDate !== today;
        const newStreak = computeNewStreak(prev.streak, prev.lastActivityDate);

        if (isFirstActivityToday) {
          setStreakJustIncreased(true);
          setNewStreakCount(newStreak);
        }

        // Keep best score across redos — never lower a previously achieved score
        const bestScore = Math.max(previousEntry?.score ?? 0, score);

        // Lecția devine completă, deci o scoatem din "started"
        const newStarted = { ...prev.startedLessons };
        delete newStarted[lessonId];

        const newProgress: UserProgress = {
          ...prev,
          xp: prev.xp + finalXP,
          streak: newStreak,
          lastActivityDate: today,
          completedLessons: {
            ...prev.completedLessons,
            [lessonId]: { score: bestScore, completed: true },
          },
          startedLessons: newStarted,
        };

        saveLocalProgress(newProgress, user?.id);
        if (user) {
          syncToCloudWithRetry(user.id, newProgress).catch(console.error);
        }

        return newProgress;
      });
    },
    [user]
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
        syncToCloud(user.id, newProgress).catch(console.error);
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

  const resyncFromCloud = useCallback(async (): Promise<{ ok: boolean; count: number; error?: string; pushed?: number }> => {
    if (!user) return { ok: false, count: 0, error: "Nu ești autentificat." };
    try {
      // PUSH first: trimite în cloud orice lecție completată local care lipsește acolo.
      const localProgress = loadLocalProgress(user.id);
      const { data: existingCloud, error: existingErr } = await supabase
        .from("completed_lessons")
        .select("lesson_id, score")
        .eq("user_id", user.id);
      let pushed = 0;
      if (!existingErr) {
        const cloudMap = new Map((existingCloud ?? []).map((r) => [r.lesson_id, r.score ?? 0]));
        const toPush = Object.entries(localProgress.completedLessons)
          .filter(([id, v]) => v.completed && (!cloudMap.has(id) || (v.score ?? 0) > (cloudMap.get(id) ?? 0)));
        if (toPush.length > 0) {
          console.log("[useProgress] resync push:", toPush.length, "local-only/better lessons");
          await syncToCloudWithRetry(user.id, localProgress);
          pushed = toPush.length;
        }
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

      return { ok: true, count: Object.keys(cloudCompleted).length };
    } catch (err: any) {
      return { ok: false, count: 0, error: err?.message ?? "Eroare necunoscută" };
    }
  }, [user]);

  return { progress, completeLesson, loseLife, resetLives, setLivesFromReward, setPremium, recordActivity, unlockLessonViaSkip, markLessonStarted, streakJustIncreased, newStreakCount, dismissStreakCelebration, resyncFromCloud };
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
    xp: Math.max(a.xp, b.xp),
    streak: Math.max(a.streak, b.streak),
    // IMPORTANT: lives & livesUpdatedAt are server-authoritative.
    // Never take max(local, cloud) — that would let a refresh reset the 30-min
    // regen timer (web bypass). Always trust the cloud copy (param `b`).
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

async function syncToCloud(userId: string, p: UserProgress) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("best_streak")
    .eq("user_id", userId)
    .single();

  const currentBest = profile?.best_streak ?? 0;
  const newBest = Math.max(currentBest, p.streak);

  await supabase
    .from("profiles")
    .update({
      xp: p.xp,
      streak: p.streak,
      // Do NOT write `lives` or `lives_updated_at` here. Those are managed
      // exclusively by loseLife / setLivesFromReward / regenerateLives so that
      // a page refresh or a stale localStorage copy cannot reset the 30-min
      // regeneration timer on web.
      is_premium: p.isPremium,
      last_activity_date: p.lastActivityDate,
      best_streak: newBest,
    })
    .eq("user_id", userId);

  const lessonEntries = Object.entries(p.completedLessons)
    .filter(([, value]) => value.completed)
    .map(([lessonId, value]) => ({
      user_id: userId,
      lesson_id: lessonId,
      score: value.score,
    }));

  if (lessonEntries.length > 0) {
    // Fetch existing cloud scores to avoid lowering a previously achieved best
    const lessonIds = lessonEntries.map((e) => e.lesson_id);
    const { data: existing } = await supabase
      .from("completed_lessons")
      .select("lesson_id, score")
      .eq("user_id", userId)
      .in("lesson_id", lessonIds);

    const existingMap = new Map((existing ?? []).map((r) => [r.lesson_id, r.score ?? 0]));

    for (const entry of lessonEntries) {
      const cloudScore = existingMap.get(entry.lesson_id) ?? -1;
      if (entry.score >= cloudScore) {
        await supabase.from("completed_lessons").upsert(entry, { onConflict: "user_id,lesson_id" });
      }
    }
  }
}
