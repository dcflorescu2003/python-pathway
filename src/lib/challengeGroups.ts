export interface GroupableChallenge {
  id: string;
  group_id?: string | null;
  group_title?: string | null;
  created_at: string;
  due_date: string | null;
}

export interface ChallengeGroup<T extends GroupableChallenge> {
  key: string;
  title: string;
  created_at: string;
  due_date: string | null;
  items: T[];
}

export function defaultGroupTitle(createdAt: string): string {
  return `Provocare – ${new Date(createdAt).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}`;
}

/** Groups challenge rows (one per lesson/problem) into a single challenge per assignment. */
export function groupChallenges<T extends GroupableChallenge>(rows: T[]): ChallengeGroup<T>[] {
  const map = new Map<string, ChallengeGroup<T>>();
  for (const r of rows) {
    const key = r.group_id || r.id;
    let g = map.get(key);
    if (!g) {
      g = { key, title: r.group_title || defaultGroupTitle(r.created_at), created_at: r.created_at, due_date: r.due_date, items: [] };
      map.set(key, g);
    }
    g.items.push(r);
    if (r.created_at < g.created_at) g.created_at = r.created_at;
  }
  return [...map.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
