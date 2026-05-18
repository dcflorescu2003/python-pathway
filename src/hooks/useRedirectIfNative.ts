import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

/**
 * Redirecționează automat utilizatorii din aplicația nativă (Capacitor)
 * către landingul aplicației. Paginile web de marketing sunt strict pentru
 * browser desktop/mobile, nu pentru app store builds.
 */
export const useRedirectIfNative = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);
};
