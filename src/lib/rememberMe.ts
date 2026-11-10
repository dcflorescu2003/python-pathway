// "Ține-mă minte" for email+password login.
// When unchecked, the session is dropped on the next cold start of the app/browser.
const FLAG = "pyro-remember-me";
const ALIVE = "pyro-session-alive";

export function setRememberMe(remember: boolean) {
  try {
    if (remember) localStorage.removeItem(FLAG);
    else localStorage.setItem(FLAG, "0");
    sessionStorage.setItem(ALIVE, "1");
  } catch { /* storage unavailable */ }
}

export function clearRememberMe() {
  try { localStorage.removeItem(FLAG); } catch { /* ignore */ }
}

/** Returns true when the stored session must be discarded (fresh start + remember disabled). */
export function shouldDropSessionOnStart(): boolean {
  try {
    const drop = localStorage.getItem(FLAG) === "0" && !sessionStorage.getItem(ALIVE);
    sessionStorage.setItem(ALIVE, "1");
    return drop;
  } catch {
    return false;
  }
}
