import { useState, useEffect, useCallback } from "react";
import { activateLicense, getLocalLicenseState } from "../services/tauri";
import { LocalLicenseState } from "../types";

export const useLicense = () => {
  const [localLicenseState, setLocalLicenseState] =
    useState<LocalLicenseState>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch the current status (used on mount and for refresh)
  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const state = await getLocalLicenseState();
      setLocalLicenseState(state);
    } catch (err: any) {
      console.error("Error fetching license status:", err);
      setError(err?.message || "Could not retrieve license information.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial status on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Function to activate a license key
  const activate = useCallback(async (licenseKey: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const state = await activateLicense(licenseKey);
      setLocalLicenseState(state);
      return state; // Return status for immediate feedback if needed
    } catch (err: any) {
      console.error("Error activating license:", err);
      setError(err?.message || "Failed to activate license.");
      throw err; // Re-throw for component-level handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    localLicenseState,
    isLoading,
    error,
    activate,
    refreshStatus: fetchStatus, // Expose the fetch function as refresh
  };
};
