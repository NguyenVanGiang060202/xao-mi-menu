export const OPTOUT_KEY = "xaomi_ignore_traffic";

export function isTrackingOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(OPTOUT_KEY) === "1") return true;
    if (document.cookie.includes(`${OPTOUT_KEY}=1`)) return true;
    if (document.cookie.includes("xaomi_admin=")) return true;
  } catch {
    // Ignore storage access errors
  }
  return false;
}

export function setTrackingOptOut(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      localStorage.setItem(OPTOUT_KEY, "1");
      document.cookie = `${OPTOUT_KEY}=1; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      localStorage.removeItem(OPTOUT_KEY);
      document.cookie = `${OPTOUT_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  } catch {
    // Ignore storage access errors
  }
}

export function initTrackingOptOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("ignore_me") === "1" || url.searchParams.get("optout") === "1") {
      setTrackingOptOut(true);
      url.searchParams.delete("ignore_me");
      url.searchParams.delete("optout");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + url.hash);
      return true;
    }
  } catch {
    // Ignore URL errors
  }
  return isTrackingOptedOut();
}
