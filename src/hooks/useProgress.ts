import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserProgress {
  xp: number;
  streak: number;
  lives: number;
  completedLessons: Record<string, { score: number; completed: boolean }>;
  lastActivityDate: string;
  isPremium: boolean;
  livesUpdatedAt: string;
}

const MAX_LIVES = 5;
const REGEN_INTERVAL_MS = 20 * 60 * 1000;
const STORAGE_KEY_PREFIX = "pyro-progress";
const LEGACY_KEY = "pylearn-progress";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function createDefaultProgress(): UserProgress {
  return {
    xp: 0,
    streak: 0,
    lives: MAX_LIVES,
    completedLessons: {},
    lastActivityDate: getTodayDate(),
    isPremium: false,
    livesUpdatedAt: new Date().toISOString(),
  };
}

function getScopedStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function checkStreakExpiry(p: UserProgress): UserProgress {
  const today = getTodayDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (p.lastActivityDate !== today && p.lastActivityDate !== yesterdayStr) {
    return { ...p, streak: 0 };
  }
  return p;
}

function regenerateLives(p: UserProgress): UserProgress {
  if (p.isPremium || p.lives >= MAX_LIVES) return p;
  const now = Date.now();
  const lastUpdate = new Date(p.livesUpdatedAt).getTime();
  const elapsed = now - lastUpdate;
  const regenCount = Math.floor(elapsed / REGEN_INTERVAL_MS);
  if (regenCount <= 0) return p;
  const newLives = Math.min(MAX_LIVES, p.lives + regenCount);
  return { ...p, lives: newLives, livesUpdatedAt: new Date().toISOString() };
}

function parseStoredProgress(stored: string): UserProgress | null {
  try {
    const parsed = JSON.parse(stored);
    return regenerateLives(checkStreakExpiry({ ...createDefaultProgress(), ...parsed }));
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
  const [progress, setProgress] = useState<UserProgress>(() => createDefaultProgress());
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
        const { data: profile } = await supabase
          .from("profiles")
          .select("xp, streak, lives, is_premium, last_activity_date, lives_updated_at")
          .eq("user_id", user.id)
          .single();

        const { data: lessons } = await supabase
          .from("completed_lessons")
          .select("lesson_id, score")
          .eq("user_id", user.id);

        const cloudCompleted: Record<string, { score: number; completed: boolean }> = {};
        lessons?.forEach((lesson) => {
          cloudCompleted[lesson.lesson_id] = { score: lesson.score, completed: true };
        });

        const cloudProgress: UserProgress = {
          xp: profile?.xp ?? 0,
          streak: profile?.streak ?? 0,
          lives: profile?.lives ?? MAX_LIVES,
          isPremium: profile?.is_premium ?? false,
          lastActivityDate: profile?.last_activity_date ?? getTodayDate(),
          completedLessons: cloudCompleted,
          livesUpdatedAt: profile?.lives_updated_at ?? new Date().toISOString(),
        };

        const localProgress = loadLocalProgress(user.id);
        const hasCloudProgress = cloudProgress.xp > 0 || Object.keys(cloudCompleted).length > 0 || cloudProgress.isPremium;
        const finalProgress = hasCloudProgress
          ? checkStreakExpiry(mergeProgress(localProgress, cloudProgress))
          : checkStreakExpiry(cloudProgress);

        setProgress(finalProgress);
        saveLocalProgress(finalProgress, user.id);

        if (hasCloudProgress) {
          await syncToCloud(user.id, finalProgress);
        }
      } catch (err) {
        console.error("Failed to load cloud progress:", err);
      }
    };

    void loadCloud();
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
        const alreadyCompleted = !!prev.completedLessons[lessonId]?.completed;
        const finalXP = Math.round((alreadyCompleted ? 3 : xpEarned) * bonusMultiplier);

        const today = getTodayDate();
        const wasYesterday = (() => {
          const d = new Date(prev.lastActivityDate);
          d.setDate(d.getDate() + 1);
          return d.toISOString().split("T")[0] === today;
        })();

        const newProgress: UserProgress = {
          ...prev,
          xp: prev.xp + finalXP,
          streak: prev.lastActivityDate === today ? prev.streak : wasYesterday ? prev.streak + 1 : 1,
          lastActivityDate: today,
          completedLessons: {
            ...prev.completedLessons,
            [lessonId]: { score, completed: true },
          },
        };

        saveLocalProgress(newProgress, user?.id);
        if (user) {
          syncToCloud(user.id, newProgress).catch(console.error);
        }

        return newProgress;
      });
    },
    [user]
  );

  const loseLife = useCallback(() => {
    setProgress((prev) => {
      if (prev.isPremium) return prev;
      const now = new Date().toISOString();
      const newLives = Math.max(0, prev.lives - 1);
      const newProgress = {
        ...prev,
        lives: newLives,
        livesUpdatedAt: prev.lives === MAX_LIVES ? now : prev.livesUpdatedAt,
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

  const setPremium = useCallback(
    (value: boolean) => {
      setProgress((prev) => {
        const newProgress = { ...prev, isPremium: value };
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

      const wasYesterday = (() => {
        const d = new Date(prev.lastActivityDate);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0] === today;
      })();

      const newProgress: UserProgress = {
        ...prev,
        streak: wasYesterday ? prev.streak + 1 : 1,
        lastActivityDate: today,
      };

      saveLocalProgress(newProgress, user?.id);
      if (user) {
        syncToCloud(user.id, newProgress).catch(console.error);
      }
      return newProgress;
    });
  }, [user]);

  return { progress, completeLesson, loseLife, resetLives, setPremium, recordActivity };
}

function mergeProgress(a: UserProgress, b: UserProgress): UserProgress {
  const mergedLessons: Record<string, { score: number; completed: boolean }> = {
    ...a.completedLessons,
  };

  for (const [id, data] of Object.entries(b.completedLessons)) {
    if (!mergedLessons[id] || data.score > mergedLessons[id].score) {
      mergedLessons[id] = data;
    }
  }

  return {
    xp: Math.max(a.xp, b.xp),
    streak: Math.max(a.streak, b.streak),
    lives: Math.max(a.lives, b.lives),
    isPremium: a.isPremium || b.isPremium,
    lastActivityDate: a.lastActivityDate > b.lastActivityDate ? a.lastActivityDate : b.lastActivityDate,
    completedLessons: mergedLessons,
    livesUpdatedAt: a.livesUpdatedAt > b.livesUpdatedAt ? a.livesUpdatedAt : b.livesUpdatedAt,
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
      lives: p.lives,
      is_premium: p.isPremium,
      last_activity_date: p.lastActivityDate,
      best_streak: newBest,
      lives_updated_at: p.livesUpdatedAt,
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
    for (const entry of lessonEntries) {
      await supabase.from("completed_lessons").upsert(entry, { onConflict: "user_id,lesson_id" });
    }
  }
}
