/** Thrown when a write can't reach the server yet; the offline queue retries these. */
export class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableError';
  }
}

// fetch() failure messages: Chrome, Safari ("Load failed"), Firefox, React Native
const NETWORK_ERROR_PATTERN =
  /failed to fetch|load failed|networkerror|network request failed|network error|fetch failed|timed? ?out|ERR_INTERNET_DISCONNECTED/i;

/** True for failures caused by connectivity rather than by the server rejecting the request. */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof RetryableError) return true;
  const message = error instanceof Error ? error.message : String(error ?? '');
  return NETWORK_ERROR_PATTERN.test(message);
};

/** RFC 4122 v4 id. Client-generated ids make replayed inserts idempotent. */
export const generateId = (): string => {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};
