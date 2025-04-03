import { Workspace } from "../types";

// Render workspace selector view when no directory is selected
export const WorkspaceSelector = ({
  handleChooseDirectory,
  recentWorkspaces,
  resetStates,
  setDir,
}: {
  handleChooseDirectory: () => void;
  recentWorkspaces: Workspace[];
  resetStates: () => void;
  setDir: (dir: string) => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-800 text-white p-5 text-center">
      <h2>Codebases</h2>
      <p className="text-sm my-2.5 mb-5">
        Open a folder to start analyzing your codebase.
      </p>

      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={handleChooseDirectory}
          className="flex items-center gap-2 bg-gray-700 text-white border border-gray-600 p-2 rounded cursor-pointer"
        >
          <span>📁</span> Open Folder
        </button>
      </div>

      {recentWorkspaces.length > 0 && (
        <div className="mt-10 w-full">
          <h3 className="text-sm text-gray-400 text-left">Recent workspaces</h3>
          <div className="mt-2.5">
            {recentWorkspaces.map((workspace, index) => (
              <div
                key={index}
                className="py-2 text-blue-500 cursor-pointer text-left"
                onClick={() => {
                  resetStates();
                  setDir(workspace.path);
                }}
              >
                {workspace.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
