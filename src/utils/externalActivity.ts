/**
 * Backward-compatible re-export. New lifecycle integrations should import from
 * src/platform/lifecycle/externalActivity.
 */
export {
  beginExternalActivity,
  shouldIgnoreExternalActivityTransition,
} from "../platform/lifecycle/externalActivity";
