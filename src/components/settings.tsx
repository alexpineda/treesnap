import { useState, useEffect } from "react";
import { X, ShareIcon } from "lucide-react";
import { getVersion, confirm, check, relaunch, openLink, __VSCODE__ } from "@/platform";
import { ApplicationSettings } from "../types";
import { useLicense } from "../hooks/use-license";
import { LicenseArea } from "./license/license-area";

// Helper function to check if a date string is in the future
const isDateInFuture = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  try {
    const expiryDate = new Date(dateString);
    return expiryDate > new Date();
  } catch (e) {
    console.error("Error parsing date:", e);
    return false; // Treat invalid dates as expired
  }
};

export const Settings = ({
  onClose,
  settings,
  onSave,
}: {
  onClose: () => void;
  settings: ApplicationSettings;
  onSave: (settings: ApplicationSettings) => void;
}) => {
  const [showActivationForm, setShowActivationForm] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const license = useLicense();

  // Check if the referral code is active
  const isRefCodeActive =
    license.localLicenseState?.refCode &&
    isDateInFuture(license.localLicenseState.refCodeExpiresAt);

  useEffect(() => {
    getVersion()
      .then((version) => {
        setAppVersion(version);
      })
      .catch(console.error);
  }, []);

  const handleCheckForUpdates = async () => {
    if (license.localLicenseState?.status === "expired") {
      alert(
        "Your license has expired. Please activate your license to check for updates."
      );
      return;
    }

    try {
      const update = await check();
      if (update) {
        const confirmed = await confirm(
          `Update available!\n\nVersion: ${update.version}\nRelease Notes:\n${
            update.body || "No release notes provided."
          }\n\nDownload and install now?`,
          {
            title: "Update Found",
          }
        );

        if (confirmed) {
          try {
            await update.downloadAndInstall();

            const restartConfirm = await confirm(
              "Update installed successfully. Restart now to apply?",
              {
                title: "Restart Required",
              }
            );

            if (restartConfirm) {
              await relaunch();
            } else {
              alert(
                "Update installed. Please restart the application later to apply the changes."
              );
            }
          } catch (installError) {
            console.error("Update installation failed:", installError);
            alert(
              `Failed to install update: ${
                installError instanceof Error
                  ? installError.message
                  : installError
              }`
            );
          }
        } else {
          console.log("Update cancelled by user.");
          alert("Update cancelled by user.");
        }
      } else {
        console.log("No update found.");
        alert("You are running the latest version.");
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
      alert(
        `Failed to check for updates: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-[rgba(0,0,0,0.5)] fixed inset-0 z-50">
      {/* Dialog Sheet Container */}
      <div className="bg-gray-800 text-white shadow-xl rounded-lg max-w-2xl w-full p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-600 pb-3">
          <h2 className="text-lg font-medium text-white">
            Application Settings
          </h2>
          {appVersion && !__VSCODE__ && (
            <div className="flex items-center space-x-2">
              {/* Minimal Check for Updates button */}
              {license.localLicenseState?.status !== "expired" && (
                <button
                  onClick={handleCheckForUpdates}
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline focus:outline-none"
                >
                  Check for Updates
                </button>
              )}
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                v{appVersion}
              </span>
            </div>
          )}
          {__VSCODE__ && (
            <a href="https://www.treesnap.app" target="_blank">
              Download the desktop app
            </a>
          )}
        </div>

        {/* File Tree Section */}
        <div className="space-y-3">
          <h3 className="text-base font-medium mb-2 text-gray-200">
            File Tree Options
          </h3>
          {/* Grid for radio alignment */}
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            {/* Radio Option 1 */}
            <input
              type="radio"
              id="tree-include"
              name="treeOption"
              value="include"
              checked={settings.treeOption === "include"}
              onChange={() => onSave({ ...settings, treeOption: "include" })}
              className="form-radio text-blue-500 bg-gray-700 border-gray-600 mt-1 self-start"
            />
            <label
              htmlFor="tree-include"
              className="cursor-pointer text-gray-300"
            >
              Include full file tree
            </label>

            {/* Radio Option 2 */}
            <input
              type="radio"
              id="tree-include-selected"
              name="treeOption"
              value="include-only-selected"
              checked={settings.treeOption === "include-only-selected"}
              onChange={() =>
                onSave({ ...settings, treeOption: "include-only-selected" })
              }
              className="form-radio text-blue-500 bg-gray-700 border-gray-600 mt-1 self-start"
            />
            <label
              htmlFor="tree-include-selected"
              className="cursor-pointer text-gray-300"
            >
              Include only selected files in tree
            </label>

            {/* Radio Option 3 */}
            <input
              type="radio"
              id="tree-do-not-include"
              name="treeOption"
              value="do-not-include"
              checked={settings.treeOption === "do-not-include"}
              onChange={() =>
                onSave({ ...settings, treeOption: "do-not-include" })
              }
              className="form-radio text-blue-500 bg-gray-700 border-gray-600 mt-1 self-start"
            />
            <label
              htmlFor="tree-do-not-include"
              className="cursor-pointer text-gray-300"
            >
              Do not include file tree
            </label>
          </div>
        </div>

        <hr className="border-gray-600" />

        {/* License Section */}
        {license.localLicenseState?.status !== "activated" && (
          <div className="space-y-3">
            <h3 className="text-base font-medium mb-2 text-gray-200">
              License
            </h3>
            {license.localLicenseState?.status === "expired" && (
              <p className="text-sm text-yellow-400">
                Your application license has expired.
              </p>
            )}

            {license.localLicenseState?.status === "inactive" &&
              !showActivationForm && (
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 text-sm"
                  onClick={() => setShowActivationForm(true)}
                >
                  Activate License
                </button>
              )}

            {/* Conditionally render LicenseArea inline within this section */}
            {showActivationForm && (
              <LicenseArea showActivationUnderLimit={true} />
            )}
          </div>
        )}

        {/* ───────────────── Referral card ───────────────── */}
        {isRefCodeActive && (
          <>
            <hr className="border-gray-600" />
            <div className="space-y-3">
              <h3 className="text-base font-medium mb-2 text-gray-200">
                Enjoying TreeSnap?
              </h3>
              <div className="w-full">
                <div className="relative rounded-lg bg-gradient-to-br from-indigo-500 to-violet-700 p-[1.5px] shadow-md">
                  <div className="rounded-[inherit] bg-gray-700 backdrop-blur-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-100">
                        Share on social media
                      </p>
                    </div>

                    <div className="sm:w-auto w-full">
                      <button
                        // onClick={() => {
                        //   copyToClipboard(
                        //     `https://treesnap.app/?ref=${license.localLicenseState?.refCode}`
                        //   );
                        // }}
                        onClick={() => {
                          openLink(
                            `https://twitter.com/intent/tweet?text=So far loving @GetTreeSnap!`
                          );
                        }}
                        className="cursor-pointer group w-full inline-flex items-center justify-center gap-2
                                 rounded-md bg-indigo-600 py-1.5 px-3 text-white text-sm

                                 hover:bg-indigo-500 active:scale-[.98] transition"
                      >
                        <span className="truncate">
                          So far loving @GetTreeSnap!
                        </span>
                        <ShareIcon className="w-4 h-4 flex-shrink-0 group-active:scale-95 transition" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <hr className="border-gray-600" />

        {/* Footer */}
        <div className="pt-2 flex justify-end items-center w-full">
          <button
            onClick={onClose}
            className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white disabled:opacity-50 border border-gray-500 text-sm"
          >
            <X size={16} />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
