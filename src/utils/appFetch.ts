import { beginGlobalActivity } from "./globalActivity";

/**
 * Fetch wrapper for requests that should participate in KaalKey's global loader.
 * Use native fetch underneath; this does not change response/error semantics.
 */
export async function appFetch(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): Promise<Response> {
  const finishActivity = beginGlobalActivity();

  try {
    return await fetch(input, init);
  } finally {
    finishActivity();
  }
}
