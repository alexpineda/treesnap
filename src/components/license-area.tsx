import React, { useState, useCallback } from "react";
import { useLicense } from "../hooks/use-license";

export const LicenseArea = () => {
  const {
    localLicenseState: localLicenseState,
    isLoading,
    error,
    activate,
    refreshStatus,
    workspaceLimitError,
    successfulActivation,
  } = useLicense();
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [activationError, setActivationError] = useState<string | null>(null);

  const handleActivate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!licenseKeyInput.trim()) {
        setActivationError("Please enter a license key.");
        return;
      }
      setActivationError(null);
      try {
        await activate(licenseKeyInput);
      } catch (err: any) {
        setActivationError(
          err.message || "An unknown error occurred during activation."
        );
      }
    },
    [activate, licenseKeyInput]
  );

  const renderContent = () => {
    if (isLoading) {
      return null;
    }

    if (error) {
      return (
        <>
          <div className="p-2 text-sm border border-red-300 rounded bg-red-50 text-red-700">
            Error loading license: {error.message}
          </div>
          <button
            type="button"
            onClick={refreshStatus}
            disabled={isLoading}
            className="text-sm text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Ok
          </button>
        </>
      );
    }

    if (!localLicenseState) {
      return null;
    }

    if (localLicenseState.status === "inactive") {
      if (workspaceLimitError) {
        return (
          <form onSubmit={handleActivate} className="flex flex-col gap-2">
            <p className="text-sm text-gray-400">{workspaceLimitError}</p>
            <input
              type="text"
              placeholder="Enter your license key"
              value={licenseKeyInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLicenseKeyInput(e.target.value)
              }
              disabled={isLoading}
              className="p-2 text-sm text-gray-100 border border-gray-300 rounded focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {activationError && (
              <div className="p-2 text-sm border border-red-300 rounded bg-red-50 text-red-700">
                {activationError}
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading || !licenseKeyInput.trim()}
              className="p-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Activating..." : "Activate"}
            </button>
            <button
              type="button"
              onClick={refreshStatus}
              disabled={isLoading}
              className="text-sm text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Refresh Status
            </button>
          </form>
        );
      }
      return null;
    }

    if (localLicenseState.status === "activated") {
      if (successfulActivation) {
        return (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-green-500">
              License Successfully Activated!
            </p>
          </div>
        );
      }
      return null;
    }

    if (localLicenseState.status === "expired") {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-red-500">License Expired</p>
          <button
            type="button"
            onClick={refreshStatus}
            disabled={isLoading}
            className="text-sm text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Refresh Status
          </button>
        </div>
      );
    }

    // Fallback for Unknown status after initial load attempt
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-400">
          Could not determine license status.
        </p>
        <button
          type="button"
          onClick={refreshStatus}
          disabled={isLoading}
          className="text-sm text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Retry
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2 max-w-[300px]">{renderContent()}</div>
  );
};
