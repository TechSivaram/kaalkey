/**
 * Tracks native system UI launched by KaalKey (photo/document pickers and share
 * sheets). Android can background the host Activity while this UI is visible.
 */
let activeExternalActivities = 0;
let externalActivityBackgrounded = false;

export function beginExternalActivity(): () => void {
  activeExternalActivities += 1;
  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    activeExternalActivities = Math.max(0, activeExternalActivities - 1);
  };
}

export function shouldIgnoreExternalActivityTransition(nextState: string): boolean {
  if (activeExternalActivities > 0) {
    if (/inactive|background/.test(nextState)) externalActivityBackgrounded = true;
    return true;
  }
  if (nextState === "active" && externalActivityBackgrounded) {
    externalActivityBackgrounded = false;
    return true;
  }
  return false;
}
