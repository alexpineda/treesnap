import { useState, useEffect, useCallback } from "react";
import {
  activateLicense,
  getLocalLicenseState,
  checkWorkspaceLimit,
} from "../services/tauri";
import { LocalLicenseState } from "../types";

export const useLicense = () => {
  const [localLicenseState, setLocalLicenseState] =
    useState<LocalLicenseState>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceLimitError, setWorkspaceLimitError] = useState<string | null>(
    null
  );

  // Function to fetch the current status (used on mount and for refresh)
  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { state, error } = await getLocalLicenseState();
    if (error) {
      setError(error.message);
    } else if (state) {
      setLocalLicenseState(state);
    }
    setIsLoading(false);
  }, []);

  // Fetch initial status on mount
  useEffect(() => {
    fetchStatus();
    checkWorkspaceLimit().then((res) => {
      if (res.error) {
        setWorkspaceLimitError(res.error.message);
      } else {
        setWorkspaceLimitError(null);
      }
    });
  }, [fetchStatus]);

  // Function to activate a license key
  const activate = useCallback(async (licenseKey: string) => {
    setIsLoading(true);
    setError(null);
    const { state, error } = await activateLicense(licenseKey);
    if (error) {
      setError(error.message);
    } else if (state) {
      setLocalLicenseState(state);
    }
    setIsLoading(false);
  }, []);

  return {
    localLicenseState,
    isLoading,
    error,
    activate,
    refreshStatus: fetchStatus, // Expose the fetch function as refresh
    workspaceLimitError,
  };
};
