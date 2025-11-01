import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

interface ErrorRecoveryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
}

export const useErrorRecovery = (
  config: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  },
) => {
  const [state, setState] = useState<ErrorRecoveryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });
  const { toast } = useToast();

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const calculateDelay = (attempt: number): number => {
    const delay = config.baseDelay * Math.pow(2, attempt);
    return Math.min(delay, config.maxDelay);
  };

  const executeWithRetry = useCallback(
    async function <T>(
      operation: () => Promise<T>,
      onError?: (error: Error, attempt: number) => void,
    ): Promise<T> {
      setState((prev) => ({ ...prev, isRetrying: true, retryCount: 0 }));

      for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
          const result = await operation();
          setState((prev) => ({ ...prev, isRetrying: false, lastError: null }));
          return result;
        } catch (error) {
          const err = error as Error;
          setState((prev) => ({
            ...prev,
            retryCount: attempt + 1,
            lastError: err,
          }));

          onError?.(err, attempt + 1);

          if (attempt === config.maxRetries) {
            setState((prev) => ({ ...prev, isRetrying: false }));

            toast({
              title: "Operation Failed",
              description: `Failed after ${config.maxRetries} attempts. Please try again later.`,
              variant: "destructive",
            });

            throw err;
          }

          const delay = calculateDelay(attempt);
          await sleep(delay);

          toast({
            title: `Retrying... (${attempt + 1}/${config.maxRetries})`,
            description: "Please wait while we retry the operation.",
            duration: 2000,
          });
        }
      }

      throw new Error("Unexpected retry loop exit");
    },
    [config, toast],
  );

  const reset = useCallback(() => {
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
    });
  }, []);

  return {
    ...state,
    executeWithRetry,
    reset,
  };
};
