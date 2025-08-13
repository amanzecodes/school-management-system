import { prisma } from "./prisma";

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
}

/**
 * Retry a database operation with exponential backoff
 */
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (
        error.message?.includes("Unique constraint") ||
        error.message?.includes("Foreign key constraint") ||
        error.code === "P2002" // Unique constraint violation
      ) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt) : delay;

      console.log(
        `Database operation failed (attempt ${attempt + 1}/${
          maxRetries + 1
        }). Retrying in ${currentDelay}ms...`
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }
  }

  throw lastError;
}

/**
 * Execute a transaction with retry logic
 */
export async function executeTransactionWithRetry<T>(
  callback: (tx: any) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryDatabaseOperation(
    () =>
      prisma.$transaction(callback, {
        maxWait: 10000, // 10 seconds
        timeout: 20000, // 20 seconds
        isolationLevel: "ReadCommitted",
      }),
    options
  );
}
