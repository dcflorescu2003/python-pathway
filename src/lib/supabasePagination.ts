// Supabase caps single requests at 1000 rows by default. Use this helper for any
// "global" select (no parent filter) that may exceed that limit, so we don't
// silently drop rows. Apply ordering and filters on the builder before calling.
export const SUPABASE_PAGE_SIZE = 1000;


export async function fetchAllPaginated<T = any>(
  buildQuery: () => { range: (from: number, to: number) => any },
  pageSize: number = SUPABASE_PAGE_SIZE
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < pageSize) break;
  }
  return all;
}
