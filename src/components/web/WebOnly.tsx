import { Capacitor } from "@capacitor/core";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

/** Conținut destinat doar site-ului (SEO/reclame web): în aplicațiile native redirecționează acasă. */
const WebOnly = ({ children }: { children: ReactNode }) =>
  Capacitor.isNativePlatform() ? <Navigate to="/" replace /> : <>{children}</>;

export default WebOnly;
