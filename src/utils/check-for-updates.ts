import { confirm, check, relaunch, getLocalLicenseState } from "@/platform";

export const handleCheckForUpdates = async (skipUpdateConfirm = false) => {
  const { state: license, error } = await getLocalLicenseState();

  if (error) {
    alert(
      "Failed to check for updates. Please try again later. If the problem persists, please contact support."
    );
    return;
  }

  if (license?.status === "expired") {
    alert(
      "Your license has expired. Please activate your license to check for updates."
    );
    return;
  }

  try {
    const update = await check();
    if (update) {
      const confirmed =
        skipUpdateConfirm ||
        (await confirm(
          `Update available!\n\nVersion: ${update.version}\nRelease Notes:\n${
            update.body || "No release notes provided."
          }\n\nDownload and install now?`,
          {
            title: "Update Found",
          }
        ));

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
