import React, { useEffect, useState } from "react";
import { handleCheckForUpdates } from "../../utils/check-for-updates";
import { check } from "@/platform";

export const UpdateAvailable: React.FC = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  const handleUpdate = () => {
    handleCheckForUpdates(true); // Skip confirmation dialog
  };

  useEffect(() => {
    const checkForUpdates = async () => {
      const update = await check();
      setIsUpdateAvailable(update !== null);
    };
    checkForUpdates();
  }, []);

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div className="mb-3 flex items-center justify-between gap-4 rounded border border-green-600 bg-green-500/10 px-3 py-2 text-sm text-green-300">
      <span>An update is available! ✨</span>
      <button
        className="shrink-0 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
        onClick={handleUpdate}
      >
        Update Now
      </button>
    </div>
  );
};
