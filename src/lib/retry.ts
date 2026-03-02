export interface RetryOptions {
  attempts?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const hasErrorProperty = (value: unknown): value is { error: unknown } => {
  return typeof value === 'object' && value !== null && 'error' in value;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : '';
  }
  return '';
};

export const isTransientNetworkError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('networkerror') ||
    message.includes('failed to fetch') ||
    message.includes('load failed') ||
    message.includes('fetch') ||
    message.includes('err_aborted')
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async <T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  const {
    attempts = 3,
    initialDelayMs = 400,
    backoffMultiplier = 1.8,
    shouldRetry = isTransientNetworkError,
  } = options;

  let delayMs = initialDelayMs;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await operation();

      if (hasErrorProperty(result) && result.error && shouldRetry(result.error, attempt)) {
        throw result.error;
      }

      return result;
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      await sleep(delayMs);
      delayMs = Math.round(delayMs * backoffMultiplier);
    }
  }

  throw lastError ?? new Error('Request failed after retries');
};
