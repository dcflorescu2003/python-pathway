/**
 * Normalizes a user-provided external link.
 * Returns an absolute http(s) URL, or null when the value is not a plausible URL.
 */
export function normalizeExternalUrl(value?: string | null): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  if (/\s/.test(raw)) return null;

  const lower = raw.toLowerCase();
  if (
    lower.startsWith("mailto:") ||
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:")
  ) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  // Require a dotted hostname (domain.tld) or localhost.
  const host = url.hostname;
  const isDomain = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(host);
  if (!isDomain) return null;
  if (!/\.[a-z]{2,}$/i.test(host)) return null;

  return url.toString();
}
