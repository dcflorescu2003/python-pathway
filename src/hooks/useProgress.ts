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
}

const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  streak: 0,
  lives: 3,
  completedLessons: {},
  lastActivityDate: new Date().toISOString().split("T")[0],
  isPremium: false,
};

const STORAGE_KEY = "pyro-progress";
const LEGACY_KEY = "pylearn-progress";

function loadLocalProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PROGRESS, ...parsed };
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
          .select("xp, streak, lives, is_premium, last_activity_date")
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
          lives: profile?.lives ?? 3,
          isPremium: profile?.is_premium ?? false,
          lastActivityDate: profile?.last_activity_date ?? new Date().toISOString().split("T")[0],
          completedLessons: cloudCompleted,
        };

        // Merge: take the maximum of local and cloud
        const local = loadLocalProgress();
        const merged = mergeProgress(local, cloudProgress);

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
      const newProgress = { ...prev, lives: Math.max(0, prev.lives - 1) };
      saveLocalProgress(newProgress);
      if (user) {
        supabase
          .from("profiles")
          .update({ lives: newProgress.lives })
          .eq("user_id", user.id)
          .then();
      }
      return newProgress;
    });
  }, [user]);

  const resetLives = useCallback(() => {
    setProgress((prev) => {
      const newProgress = { ...prev, lives: 3 };
      saveLocalProgress(newProgress);
      if (user) {
        supabase
          .from("profiles")
          .update({ lives: 3 })
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
  };
}

// Sync full progress state to cloud
async function syncToCloud(userId: string, p: UserProgress) {
  // Update profile
  await supabase
    .from("profiles")
    .update({
      xp: p.xp,
      streak: p.streak,
      lives: p.lives,
      is_premium: p.isPremium,
      last_activity_date: p.lastActivityDate,
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
