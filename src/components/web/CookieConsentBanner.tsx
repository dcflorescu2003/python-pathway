import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COOKIE_SETTINGS_EVENT,
  getCookieConsent,
  loadAdSenseIfConsented,
  setCookieConsent,
} from "@/lib/cookieConsent";

// Banner de consimțământ GDPR afișat doar pe web, la prima vizită.
// „Accept" -> încărcăm și scriptul AdSense; „Doar esențiale" -> nu încărcăm nimic terț.
const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pe aplicațiile native (iOS/Android) reclamele trec prin AdMob, nu prin AdSense.
    if (Capacitor.isNativePlatform()) return;

    const consent = getCookieConsent();
    if (consent === null) {
      setVisible(true);
    } else if (consent === "accepted") {
      // Utilizator recurent care a acceptat deja: încărcăm AdSense direct.
      loadAdSenseIfConsented();
    }

    const onOpenSettings = () => setVisible(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, onOpenSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, onOpenSettings);
  }, []);

  const choose = (consent: "accepted" | "essential") => {
    setCookieConsent(consent);
    if (consent === "accepted") {
      loadAdSenseIfConsented();
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(1rem+var(--sab))]">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-2xl sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Cookie-uri și confidențialitate</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Folosim stocare locală esențială pentru autentificare și progres. Cu acordul tău,
              Google AdSense poate folosi cookie-uri pentru a afișa reclame care susțin aplicația
              gratuită. Detalii în{" "}
              <Link to="/privacy-policy" className="text-primary underline underline-offset-2">
                Politica de confidențialitate
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="sm:min-w-[140px]"
            onClick={() => choose("essential")}
          >
            Doar esențiale
          </Button>
          <Button
            size="sm"
            className="sm:min-w-[140px]"
            onClick={() => choose("accepted")}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
