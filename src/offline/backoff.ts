export function getBackoffDelay(retries: number) {
  const BASE_DELAY = 1000;      // 1 second
  const MAX_DELAY = 30_000;     // 30 seconds cap

  return Math.min(BASE_DELAY * 2 ** retries, MAX_DELAY);
}
