import { useEffect } from "react";

const SITE_URL = "https://pyroskill.info";
const MARK = "data-pyro-seo";

interface SeoOptions {
  title?: string;
  description?: string;
  /** Absolute path, e.g. "/support". Ignored when noindex is true. */
  canonicalPath?: string;
  noindex?: boolean;
}

function upsert(selector: string, create: () => HTMLElement) {
  let el = document.head.querySelector<HTMLElement>(`${selector}[${MARK}]`);
  if (!el) {
    el = create();
    el.setAttribute(MARK, "");
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Sets title / description / canonical (or noindex) for pages that don't use Helmet.
 * Tags are marked and removed on unmount so they never conflict with react-helmet-async.
 */
export function useSeoHead({ title, description, canonicalPath, noindex }: SeoOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    if (description) {
      const existing = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (existing) existing.setAttribute("content", description);
    }

    if (noindex) {
      const robots = upsert('meta[name="robots"]', () => {
        const m = document.createElement("meta");
        m.setAttribute("name", "robots");
        return m;
      });
      robots.setAttribute("content", "noindex, follow");
    } else if (canonicalPath) {
      const url = `${SITE_URL}${canonicalPath === "/" ? "/" : canonicalPath}`;

      const link = upsert('link[rel="canonical"]', () => {
        const l = document.createElement("link");
        l.setAttribute("rel", "canonical");
        return l;
      });
      link.setAttribute("href", url);

      const ogUrl = upsert('meta[property="og:url"]', () => {
        const m = document.createElement("meta");
        m.setAttribute("property", "og:url");
        return m;
      });
      ogUrl.setAttribute("content", url);

      if (title) {
        const ogTitle = upsert('meta[property="og:title"]', () => {
          const m = document.createElement("meta");
          m.setAttribute("property", "og:title");
          return m;
        });
        ogTitle.setAttribute("content", title);
      }

      if (description) {
        const ogDesc = upsert('meta[property="og:description"]', () => {
          const m = document.createElement("meta");
          m.setAttribute("property", "og:description");
          return m;
        });
        ogDesc.setAttribute("content", description);
      }
    }

    return () => {
      document.title = previousTitle;
      document.head.querySelectorAll(`[${MARK}]`).forEach((el) => el.remove());
    };
  }, [title, description, canonicalPath, noindex]);
}

export default useSeoHead;
