import { supabase } from "@/integrations/supabase/client";

/**
 * Cache persistent pentru cataloagele publice (lecții, probleme).
 * Serverul ține un număr de versiune care crește la orice editare a catalogului;
 * descărcăm catalogul complet doar când versiunea diferă de cea salvată local.
 * Cheile au prefixul `pyro-` ca să fie șterse la deconectare (localWipe).
 */
async function fetchCatalogVersion(): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from("catalog_version")
      .select("version")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return null;
    return Number(data.version);
  } catch {
    return null;
  }
}

export async function withCatalogCache<T>(
  name: string,
  fetcher: () => Promise<T>,
  shouldCache: (data: T) => boolean = () => true,
): Promise<T> {
  const key = `pyro-catalog-v1-${name}`;
  const version = await fetchCatalogVersion();

  if (version !== null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached?.version === version && cached.data !== undefined) return cached.data as T;
      }
    } catch { /* ignore corrupted cache */ }
  }

  const data = await fetcher();
  if (version !== null && shouldCache(data)) {
    try {
      localStorage.setItem(key, JSON.stringify({ version, data }));
    } catch { /* quota — ignore */ }
  }
  return data;
}
