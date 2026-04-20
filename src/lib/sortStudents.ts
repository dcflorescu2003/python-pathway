// Sort helper for student lists by Nume (last_name), with fallback to display_name.
// Romanian locale, case/diacritic-insensitive.
type SortableProfile = {
  profile?: {
    last_name?: string | null;
    display_name?: string | null;
  } | null;
};

function getSortKey(item: SortableProfile): string {
  const ln = item.profile?.last_name?.trim();
  if (ln) return ln;
  return (item.profile?.display_name || "Elev").trim();
}

export function sortByDisplayName<T extends SortableProfile>(arr: T[]): T[] {
  return [...arr].sort((a, b) =>
    getSortKey(a).localeCompare(getSortKey(b), "ro", { sensitivity: "base" })
  );
}
