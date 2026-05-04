export const TEACHER_TEST_LIMITS = {
  unverified: 50,
  verified: 100,
  ai: 150,
} as const;

export type TeacherTier = "unverified" | "verified" | "ai";

export const TEACHER_TIER_LABEL: Record<TeacherTier, string> = {
  unverified: "Profesor neverificat",
  verified: "Profesor verificat",
  ai: "Profesor AI",
};

export function getTeacherTestLimit(args: {
  teacherStatus?: string | null;
  isTeacherPremium?: boolean;
}): { limit: number; tier: TeacherTier } {
  if (args.isTeacherPremium) return { limit: TEACHER_TEST_LIMITS.ai, tier: "ai" };
  if (args.teacherStatus === "verified") return { limit: TEACHER_TEST_LIMITS.verified, tier: "verified" };
  return { limit: TEACHER_TEST_LIMITS.unverified, tier: "unverified" };
}
