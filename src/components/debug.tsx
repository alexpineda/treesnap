import { useState, useEffect } from "react";
import { useDebug } from "../hooks/use-debug";
import { DebugLicenseParams, getLocalLicenseState } from "@/platform";
import { LocalLicenseState } from "../types";

export const DebugLicenseControls = () => {
  const {
    setLicenseState,
    clearLicenseState,
    addUsageEntries,
    isLoading,
    error,
    clearCache,
  } = useDebug();

  const [status, setStatus] = useState<LocalLicenseState["status"] | undefined>(
    undefined
  );
  const [licenseType, setLicenseType] = useState<
    LocalLicenseState["licenseType"] | undefined
  >(undefined);
  const [expiryOffset, setExpiryOffset] = useState<number | undefined>(
    undefined
  );
  const [refCode, setRefCode] = useState<string | undefined>(undefined);
  const [refCodeExpiryOffset, setRefCodeExpiryOffset] = useState<
    number | undefined
  >(undefined);
  const [usageCount, setUsageCount] = useState<number | undefined>(undefined);
  const [localState, setLocalState] = useState<LocalLicenseState | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const refreshLicenseState = async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const { state, error: fetchErr } = await getLocalLicenseState();
      if (fetchErr) {
        setFetchError(fetchErr.message);
        setLocalState(null);
      } else {
        setLocalState(state);
      }
    } catch (err: any) {
      setFetchError(err.message || "Failed to invoke getLocalLicenseState");
      setLocalState(null);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    refreshLicenseState();
  }, []);

  const handleSetLicense = async () => {
    const params: DebugLicenseParams = {
      status: status,
      licenseType: licenseType,
      expiresAtOffsetDays: expiryOffset,
      expireRefCodeAtOffsetDays: refCodeExpiryOffset,
      refCode: refCode,
    };
    const success = await setLicenseState(params);
    if (success) {
      refreshLicenseState();
    }
  };

  const handleClearLicense = async () => {
    const success = await clearLicenseState();
    if (success) {
      refreshLicenseState();
    }
  };

  const handleAddUsage = async () => {
    if (typeof usageCount === "number" && usageCount > 0) {
      const success = await addUsageEntries(usageCount);
      if (success) {
        refreshLicenseState();
      }
    }
  };

  if (!import.meta.env.DEV) {
    return null; // Don't render in production
  }

  if (!showControls) {
    return (
      <button
        className="text-sm text-gray-500"
        onClick={() => setShowControls(true)}
      >
        Show Debug Controls
      </button>
    );
  }

  return (
    <div className="w-full max-w-md border-yellow-500 border-2 my-4 rounded-lg shadow-md bg-white p-4 max-h-96 overflow-y-auto">
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-yellow-600">
            Debug Controls
          </h3>
          <p className="text-sm text-gray-500">
            License and usage manipulation (DEV ONLY).
          </p>
          <button onClick={() => setShowControls(false)}>
            Hide Debug Controls
          </button>
        </div>
        <div className="space-y-4">
          <div className="border p-3 rounded bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-700">
                Current Local State
              </h4>
              <button
                onClick={refreshLicenseState}
                disabled={isLoading || isFetching}
                className="px-2 py-1 text-xs font-medium rounded shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {fetchError && (
              <p className="text-red-600 text-sm mb-2">
                Error fetching state: {fetchError}
              </p>
            )}
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {localState
                ? JSON.stringify(localState, null, 2)
                : isFetching
                ? "Loading state..."
                : "No state found or error fetching."}
            </pre>
          </div>

          <div className="space-y-2 border p-3 rounded">
            <h4 className="font-semibold text-gray-700">Set License State</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="debug-status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="debug-status"
                  value={status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setStatus(e.target.value as LocalLicenseState["status"])
                  }
                  className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Status</option>
                  <option value="activated">Activated</option>
                  <option value="expired">Expired</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="debug-type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type
                </label>
                <select
                  id="debug-type"
                  value={licenseType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setLicenseType(
                      e.target.value as LocalLicenseState["licenseType"]
                    )
                  }
                  className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select License Type</option>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="team">Team</option>
                </select>
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="debug-expiry"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Expiry Offset (days)
                </label>
                <input
                  id="debug-expiry"
                  type="number"
                  placeholder="e.g., 30, -7, 365"
                  value={expiryOffset}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setExpiryOffset(
                      e.target.value === ""
                        ? undefined
                        : parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={handleSetLicense}
              disabled={isLoading}
              className="mt-2 px-3 py-1.5 text-sm font-medium rounded shadow-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Setting..." : "Set State"}
            </button>
          </div>

          <div className="border p-3 rounded flex justify-between items-center">
            <h4 className="font-semibold text-gray-700">Clear State</h4>
            <button
              onClick={handleClearLicense}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Clearing..." : "Clear All State"}
            </button>
          </div>

          <div className="space-y-2 border p-3 rounded">
            <h4 className="font-semibold text-gray-700">Add Dummy Usage</h4>
            <div className="flex gap-2 items-center">
              <input
                id="debug-usage"
                type="number"
                placeholder="Count"
                value={usageCount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUsageCount(
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value, 10)
                  )
                }
                className="flex-grow p-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={handleAddUsage}
                disabled={isLoading || typeof usageCount !== "number"}
                className="px-3 py-1.5 text-sm font-medium rounded shadow-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Adding..." : "Add Entries"}
              </button>
            </div>
          </div>

          <div className="space-y-2 border p-3 rounded">
            <h4 className="font-semibold text-gray-700">Set Referral Code</h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Referral Code"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="number"
                placeholder="Expiry Offset (days)"
                value={refCodeExpiryOffset}
                onChange={(e) =>
                  setRefCodeExpiryOffset(
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value, 10)
                  )
                }
                className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleSetLicense}
              disabled={isLoading}
              className="mt-2 px-3 py-1.5 text-sm font-medium rounded shadow-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Setting..." : "Set Referral Code"}
            </button>
          </div>

          <div className="space-y-2 border p-3 rounded">
            <h4 className="font-semibold text-gray-700">Clear Cache</h4>
            <button
              onClick={clearCache}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium rounded shadow-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Cache
            </button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          {error && (
            <p className="text-red-500 text-sm">Action Error: {error}</p>
          )}
          {!error && isLoading && (
            <p className="text-blue-500 text-sm">Action in progress...</p>
          )}
        </div>
      </div>
    </div>
  );
};
