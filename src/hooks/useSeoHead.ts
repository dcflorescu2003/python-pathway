import { useEffect } from "react";

const SITE_URL = "https://pyroskill.info";
const MARK = "data-pyro-seo";

interface SeoOptions {
  title?: string;
  description?: string;
  /** Absolute path, e.g. "/support". Ignored when noindex is true. */
  canonicalPath?: string;
  noindex?: boolean;
  /** Overrides for social previews; falls back to title/description. */
  ogTitle?: string;
  ogDescription?: string;
  /** Absolute https URL. */
  ogImage?: string;
  ogType?: string;
}

/**
 * Sets title / description / canonical (or noindex) for pages that don't use Helmet.
 * Existing head tags are updated in place (never duplicated) and restored on unmount,
 * so this never produces conflicting canonical signals.
 */
export function useSeoHead({
  title,
  description,
  canonicalPath,
  noindex,
  ogTitle,
  ogDescription,
  ogImage,
  ogType,
}: SeoOptions) {
  useEffect(() => {
    const restore: Array<() => void> = [];

    const setAttr = (el: Element, attr: string, value: string) => {
      const prev = el.getAttribute(attr);
      el.setAttribute(attr, value);
      restore.push(() => {
        if (prev === null) el.removeAttribute(attr);
        else el.setAttribute(attr, prev);
      });
    };

    const ensure = (selector: string, create: () => HTMLElement) => {
      const existing = document.head.querySelector<HTMLElement>(selector);
      if (existing) return existing;
      const el = create();
      el.setAttribute(MARK, "");
      document.head.appendChild(el);
      restore.push(() => el.remove());
      return el;
    };

    if (title) {
      const prevTitle = document.title;
      document.title = title;
      restore.push(() => {
        document.title = prevTitle;
      });
    }

    if (description) {
      const meta = document.head.querySelector('meta[name="description"]');
      if (meta) setAttr(meta, "content", description);
    }

    if (noindex) {
      const robots = ensure('meta[name="robots"]', () => {
        const m = document.createElement("meta");
        m.setAttribute("name", "robots");
        return m;
      });
      setAttr(robots, "content", "noindex, follow");
    } else if (canonicalPath) {
      const url = `${SITE_URL}${canonicalPath}`;

      const link = ensure('link[rel="canonical"]', () => {
        const l = document.createElement("link");
        l.setAttribute("rel", "canonical");
        return l;
      });
      setAttr(link, "href", url);

      const ogUrl = ensure('meta[property="og:url"]', () => {
        const m = document.createElement("meta");
        m.setAttribute("property", "og:url");
        return m;
      });
      setAttr(ogUrl, "content", url);
    }

    // Social preview tags stay route-specific even when no canonical is set,
    // so shared links never fall back to the generic index.html copy.
    const setMeta = (selector: string, attr: "property" | "name", key: string, value: string) => {
      const el = ensure(selector, () => {
        const m = document.createElement("meta");
        m.setAttribute(attr, key);
        return m;
      });
      setAttr(el, "content", value);
    };

    const socialTitle = ogTitle ?? title;
    const socialDescription = ogDescription ?? description;

    if (socialTitle) {
      setMeta('meta[property="og:title"]', "property", "og:title", socialTitle);
      setMeta('meta[name="twitter:title"]', "name", "twitter:title", socialTitle);
    }

    if (socialDescription) {
      setMeta('meta[property="og:description"]', "property", "og:description", socialDescription);
      setMeta('meta[name="twitter:description"]', "name", "twitter:description", socialDescription);
    }

    if (ogType) {
      setMeta('meta[property="og:type"]', "property", "og:type", ogType);
    }

    if (ogImage) {
      setMeta('meta[property="og:image"]', "property", "og:image", ogImage);
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", ogImage);
    }

    return () => {
      restore.reverse().forEach((fn) => fn());
    };
  }, [title, description, canonicalPath, noindex, ogTitle, ogDescription, ogImage, ogType]);
}

export default useSeoHead;
