interface LeaderboardIdentity {
  user_id: string;
  nickname: string | null;
  display_name: string | null;
}

export const FUNNY_NICKNAMES = [
  "PitonulViteaz",
  "CobraNervoasa",
  "BugHunter",
  "SarpeleNinja",
  "ByteViper",
  "PitoneluSef",
  "AnacondaIT",
  "ViperaZen",
  "DraconCodat",
  "CyberSnake",
  "SudoPiton",
  "AlgoCobra",
  "PixelBoa",
  "TurboPython",
  "MambaCurioasa",
] as const;

/** Alias stabil și amuzant, derivat din ID-ul contului (același peste tot). */
export function getDefaultNickname(userId: string): string {
  const hex = userId.replace(/-/g, "");
  const n = parseInt(hex.slice(0, 8), 16) || 0;
  const name = FUNNY_NICKNAMES[n % FUNNY_NICKNAMES.length];
  const suffix = (parseInt(hex.slice(8, 12), 16) || 0) % 100;
  return `${name}#${String(suffix).padStart(2, "0")}`;
}

/** Numele public: nickname-ul salvat sau aliasul amuzant. Niciodată numele real. */
export function getPublicName(entry: Pick<LeaderboardIdentity, "user_id" | "nickname">): string {
  return entry.nickname?.trim() || getDefaultNickname(entry.user_id);
}

export function getClassLeaderboardName(entry: LeaderboardIdentity, teacherView: boolean): string {
  const publicName = getPublicName(entry);
  return teacherView ? entry.display_name?.trim() || publicName : publicName;
}
