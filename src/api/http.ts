/**
 * Robust HTTP fetch utility with timeout, exponential backoff retries,
 * and standard errors. No custom headers are sent to avoid CORS preflight.
 */

export interface FetchJsonOptions {
  timeoutMs?: number;
  retries?: number;
}

export async function fetchJson<T>(
  url: string,
  { timeoutMs = 12000, retries = 2 }: FetchJsonOptions = {}
): Promise<T> {
  let attempt = 0;
  let delay = 300;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Do not add custom headers on GET to prevent CORS preflight blocks
      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Retry on 5xx server errors
        if (response.status >= 500 && attempt < retries) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw new Error(`Server error ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        if (attempt < retries) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw new Error('Request timed out');
      }

      // Check if network error and can retry
      if (
        attempt < retries &&
        (!err.message || !err.message.startsWith('Server error 4'))
      ) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }

      if (err.message && err.message.startsWith('Server error')) {
        throw err;
      }

      throw new Error('Network error');
    }
  }

  throw new Error('Network error');
}
