import { FolderOpenIcon } from "lucide-react";
import { RecentWorkspace } from "../types";
import { basename } from "../utils";
import { useLicense } from "../hooks/use-license";
import classNames from "classnames";
import { __WEB_DEMO__ } from "@/platform";
// Render workspace selector view when no directory is selected
export const WorkspaceSelector = ({
  handleChooseDirectory,
  recentWorkspaces,
  setDir,
}: {
  handleChooseDirectory: () => void;
  recentWorkspaces: RecentWorkspace[];
  setDir: (dir: string) => void;
}) => {
  const { workspaceLimitStatus, localLicenseState } = useLicense();

  const showButton = !(
    localLicenseState?.status == "inactive" && !workspaceLimitStatus?.allowed
  );

  console.log("workspaceLimitStatus", workspaceLimitStatus);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-800 text-white px-10 text-center">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <img src="/logo.png" alt="RepoSnap" className="w-8 h-8" />
        RepoSnap
      </h2>
      <p className="text-sm my-2.5 mb-5">
        Open a folder to start analyzing your codebase.
      </p>

      <div className="flex flex-wrap gap-2.5">
        {showButton && (
          <button
            onClick={handleChooseDirectory}
            className={classNames(
              "flex items-center gap-2 bg-gray-700 text-white border border-gray-600 px-4 py-2 rounded cursor-pointer"
            )}
          >
            <FolderOpenIcon className="w-4 h-4" /> Open Folder
          </button>
        )}
      </div>

      <div className="h-px w-full bg-gray-700 mt-10 mb-5" />

      {recentWorkspaces.length > 0 && (
        <div className="w-full space-y-2">
          <h3 className="text-gray-300 text-left">Recent workspaces</h3>
          <div className="space-y-1">
            {recentWorkspaces.map((workspace, index) => (
              <div
                key={index}
                className=" text-blue-300 cursor-pointer text-left"
                onClick={() => {
                  setDir(workspace.path);
                }}
              >
                {basename(workspace.path)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
