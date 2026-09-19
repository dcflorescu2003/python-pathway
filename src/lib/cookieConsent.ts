// Gestionarea consimțământului pentru cookie-uri / reclame (GDPR, web only).
// Alegerea utilizatorului se păstrează în localStorage sub cheia de mai jos.
// Notă: această cheie e intenționat globală (nu namespaced pe user.id) —
// consimțământul ține de browser/dispozitiv, nu de contul autentificat.

export type CookieConsent = "accepted" | "essential";

const CONSENT_KEY = "cookie_consent";
export const COOKIE_SETTINGS_EVENT = "pyro-open-cookie-settings";

const ADSENSE_CLIENT = "ca-pub-8441862030200888";
const ADSENSE_SCRIPT_ID = "pyro-adsense-script";

export const getCookieConsent = (): CookieConsent | null => {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "essential" ? value : null;
  } catch {
    return null;
  }
};

export const setCookieConsent = (consent: CookieConsent) => {
  try {
    localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // localStorage poate fi indisponibil în mod privat; bannerul va reapărea.
  }
};

// Deschide din nou bannerul (butonul „Setări cookie-uri" din footer).
export const openCookieSettings = () => {
  window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT));
};

// Încarcă scriptul AdSense DOAR după consimțământul explicit al utilizatorului.
// Fără accept, scriptul nu ajunge niciodată în pagină.
export const loadAdSenseIfConsented = () => {
  if (getCookieConsent() !== "accepted") return;
  if (typeof document === "undefined") return;
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = ADSENSE_SCRIPT_ID;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(script);
};
