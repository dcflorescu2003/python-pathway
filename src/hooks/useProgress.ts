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
const REGEN_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes

const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  streak: 0,
  lives: MAX_LIVES,
  completedLessons: {},
  lastActivityDate: new Date().toISOString().split("T")[0],
  isPremium: false,
  livesUpdatedAt: new Date().toISOString(),
};

const STORAGE_KEY = "pyro-progress";
const LEGACY_KEY = "pylearn-progress";

function checkStreakExpiry(p: UserProgress): UserProgress {
  const today = new Date().toISOString().split("T")[0];
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

function loadLocalProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const progress = checkStreakExpiry({ ...DEFAULT_PROGRESS, ...parsed });
      return regenerateLives(progress);
    }
  } catch {}
  return { ...DEFAULT_PROGRESS };
}

function saveLocalProgress(p: UserProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function useProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress>(loadLocalProgress);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const prevUserId = useRef<string | null>(null);

  // Load progress from cloud when user logs in
  useEffect(() => {
    if (!user) {
      prevUserId.current = null;
      setCloudLoaded(false);
      return;
    }

    if (prevUserId.current === user.id) return;
    prevUserId.current = user.id;

    const loadCloud = async () => {
      try {
        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("xp, streak, lives, is_premium, last_activity_date, lives_updated_at")
          .eq("user_id", user.id)
          .single();

        // Fetch completed lessons
        const { data: lessons } = await supabase
          .from("completed_lessons")
          .select("lesson_id, score")
          .eq("user_id", user.id);

        const cloudCompleted: Record<string, { score: number; completed: boolean }> = {};
        lessons?.forEach((l) => {
          cloudCompleted[l.lesson_id] = { score: l.score, completed: true };
        });

        const cloudProgress: UserProgress = {
          xp: profile?.xp ?? 0,
          streak: profile?.streak ?? 0,
          lives: profile?.lives ?? MAX_LIVES,
          isPremium: profile?.is_premium ?? false,
          lastActivityDate: profile?.last_activity_date ?? new Date().toISOString().split("T")[0],
          completedLessons: cloudCompleted,
          livesUpdatedAt: profile?.lives_updated_at ?? new Date().toISOString(),
        };

        // Merge: take the maximum of local and cloud
        const local = loadLocalProgress();
        const merged = checkStreakExpiry(mergeProgress(local, cloudProgress));

        setProgress(merged);
        saveLocalProgress(merged);
        setCloudLoaded(true);

        // Push merged data back to cloud
        await syncToCloud(user.id, merged);
      } catch (err) {
        console.error("Failed to load cloud progress:", err);
        setCloudLoaded(true);
      }
    };

    loadCloud();
  }, [user]);

  const completeLesson = useCallback(
    async (lessonId: string, xpEarned: number, score: number) => {
      // Check if this is a challenge for bonus XP
      let bonusMultiplier = 1;
      if (user) {
        try {
          const { data: memberships } = await supabase
            .from("class_members")
            .select("class_id")
            .eq("student_id", user.id);
          if (memberships && memberships.length > 0) {
            const classIds = memberships.map((m) => m.class_id);
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

        const today = new Date().toISOString().split("T")[0];
        const wasYesterday = (() => {
          const d = new Date(prev.lastActivityDate);
          d.setDate(d.getDate() + 1);
          return d.toISOString().split("T")[0] === today;
        })();

        const newProgress: UserProgress = {
          ...prev,
          xp: prev.xp + finalXP,
          streak:
            prev.lastActivityDate === today
              ? prev.streak
              : wasYesterday
              ? prev.streak + 1
              : 1,
          lastActivityDate: today,
          completedLessons: {
            ...prev.completedLessons,
            [lessonId]: { score, completed: true },
          },
        };
        saveLocalProgress(newProgress);

        // Async cloud sync
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
      const newProgress = { ...prev, lives: newLives, livesUpdatedAt: prev.lives === MAX_LIVES ? now : prev.livesUpdatedAt };
      saveLocalProgress(newProgress);
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
      saveLocalProgress(newProgress);
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
        saveLocalProgress(newProgress);
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

  return { progress, completeLesson, loseLife, resetLives, setPremium };
}

// Merge two progress states, keeping the best of each
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
    lastActivityDate:
      a.lastActivityDate > b.lastActivityDate ? a.lastActivityDate : b.lastActivityDate,
    completedLessons: mergedLessons,
    livesUpdatedAt: a.livesUpdatedAt > b.livesUpdatedAt ? a.livesUpdatedAt : b.livesUpdatedAt,
  };
}

// Sync full progress state to cloud
async function syncToCloud(userId: string, p: UserProgress) {
  // Fetch current best_streak to potentially update it
  const { data: profile } = await supabase
    .from("profiles")
    .select("best_streak")
    .eq("user_id", userId)
    .single();

  const currentBest = profile?.best_streak ?? 0;
  const newBest = Math.max(currentBest, p.streak);

  // Update profile
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

  // Upsert completed lessons
  const lessonEntries = Object.entries(p.completedLessons)
    .filter(([, v]) => v.completed)
    .map(([lessonId, v]) => ({
      user_id: userId,
      lesson_id: lessonId,
      score: v.score,
    }));

  if (lessonEntries.length > 0) {
    for (const entry of lessonEntries) {
      await supabase
        .from("completed_lessons")
        .upsert(entry, { onConflict: "user_id,lesson_id" });
    }
  }
}
