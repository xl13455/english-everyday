/** 本浏览器会话是否已从开场页进入真题站 */
export const ENTRY_SESSION_KEY = "ee-entered";

export function hasEnteredThisSession(): boolean {
  try {
    return sessionStorage.getItem(ENTRY_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markEnteredThisSession(): void {
  try {
    sessionStorage.setItem(ENTRY_SESSION_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}
