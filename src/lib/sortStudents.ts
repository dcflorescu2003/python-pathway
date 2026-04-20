// Sort helper for student lists by display_name (Romanian locale, case/diacritic-insensitive)
export function sortByDisplayName<T extends { profile?: { display_name?: string | null } | null }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const nameA = (a.profile?.display_name || "Elev").trim();
    const nameB = (b.profile?.display_name || "Elev").trim();
    return nameA.localeCompare(nameB, "ro", { sensitivity: "base" });
  });
}
