import { useState, useEffect, useCallback } from "react";
import {
  activateLicense,
  getLocalLicenseState,
  checkWorkspaceLimit,
  isUpgradeLicenseBannerDismissed as isUpgradeLicenseBannerDismissedPlatform,
  dismissUpgradeLicenseBanner as dismissUpgradeLicenseBannerPlatform,
} from "@/platform";
import { LocalLicenseState, ApiError, WorkspaceLimitStatus } from "../types";

export const useLicense = () => {
  const [localLicenseState, setLocalLicenseState] =
    useState<LocalLicenseState>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [workspaceLimitStatus, setWorkspaceLimitStatus] =
    useState<WorkspaceLimitStatus | null>(null);

  const [successfulActivation, setSuccessfulActivation] =
    useState<boolean>(false);

  const [isLicenseBannerDismissed, setIsLicenseBannerDismissed] =
    useState<boolean>(true);

  useEffect(() => {
    isUpgradeLicenseBannerDismissedPlatform().then((res) => {
      setIsLicenseBannerDismissed(res);
    });
  }, []);

  const dismissLicenseBanner = useCallback(async () => {
    await dismissUpgradeLicenseBannerPlatform();
    setIsLicenseBannerDismissed(true);
  }, []);

  // Function to fetch the current status (used on mount and for refresh)
  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { state, error } = await getLocalLicenseState();
    if (error) {
      setError(error);
    } else if (state) {
      setLocalLicenseState(state);
    }
    setIsLoading(false);
  }, []);

  // Fetch initial status on mount
  useEffect(() => {
    fetchStatus();
    checkWorkspaceLimit().then((res) => {
      setWorkspaceLimitStatus(res);
    });
  }, [fetchStatus]);

  // Function to activate a license key
  const activate = useCallback(async (licenseKey: string) => {
    setIsLoading(true);
    setError(null);
    setSuccessfulActivation(false); // Reset activation success flag
    const { state, error } = await activateLicense(licenseKey);
    if (error) {
      setError(error);
    } else if (state) {
      setLocalLicenseState(state);
      if (state.status === "activated") {
        setSuccessfulActivation(true);
        // Re-fetch workspace limit now that we're activated
        const status = await checkWorkspaceLimit();
        setWorkspaceLimitStatus(status);
      }
    }
    setIsLoading(false);
  }, []);

  return {
    localLicenseState,
    isLoading,
    error,
    activate,
    refreshStatus: fetchStatus, // Expose the fetch function as refresh
    workspaceLimitStatus,
    successfulActivation,
    isLicenseBannerDismissed,
    dismissLicenseBanner,
  };
};
