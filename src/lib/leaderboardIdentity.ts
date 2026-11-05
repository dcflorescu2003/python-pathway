interface ClassLeaderboardIdentity {
  user_id: string;
  nickname: string | null;
  display_name: string | null;
}

export function getClassLeaderboardName(entry: ClassLeaderboardIdentity, teacherView: boolean): string {
  const nickname = entry.nickname?.trim();
  const publicName = nickname || `Pythonist-${entry.user_id.replace(/-/g, "").slice(0, 8)}`;
  return teacherView ? entry.display_name?.trim() || publicName : publicName;
}