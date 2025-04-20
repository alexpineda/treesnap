import { useState } from "react";
import {
  debugSetLicenseState,
  debugClearLicenseState,
  debugAddUsageEntries,
  DebugLicenseParams,
  TauriApiError,
} from "@/platform";

/**
 * Hook providing access to debug license commands.
 * These functions will only work in development builds.
 */
export const useDebug = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const _executeDebugCommand = async (
    commandFn: () => Promise<{ error: TauriApiError | null }>
  ): Promise<boolean> => {
    if (!import.meta.env.DEV) {
      console.warn("Debug commands are only available in development mode.");
      setError("Debug commands only work in development.");
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await commandFn();
      if (result.error) {
        setError(result.error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const setLicenseState = async (params: DebugLicenseParams) => {
    return _executeDebugCommand(() => debugSetLicenseState(params));
  };

  const clearLicenseState = async () => {
    return _executeDebugCommand(debugClearLicenseState);
  };

  const addUsageEntries = async (count: number) => {
    return _executeDebugCommand(() => debugAddUsageEntries(count));
  };

  return {
    setLicenseState,
    clearLicenseState,
    addUsageEntries,
    isLoading,
    error,
  };
};
