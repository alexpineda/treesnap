import { Copy, FolderOpen, Settings, X, Keyboard } from "lucide-react";
import { basename } from "../utils";
import { Tooltip } from "react-tooltip";
import { FileTreeNode, ApplicationSettings } from "../types";
import { useExport } from "../hooks/use-export";

export const TopBar = ({
  selectedFiles,
  workspacePath,
  handleClose,
  onSettingsClick,
  onQuickOpenClick,
  showQuickOpenButton,
  settings,
}: {
  selectedFiles: FileTreeNode[];
  workspacePath: string;
  handleClose: () => void;
  onSettingsClick: () => void;
  onQuickOpenClick: () => void;
  showQuickOpenButton: boolean;
  settings: ApplicationSettings;
}) => {
  const { status, copyExportToClipboard } = useExport({
    selectedFiles,
    workspacePath,
    settings,
  });

  const isDisabled = selectedFiles.length === 0 || status === "copying";

  return (
    <div className="flex relative border-b border-gray-700 bg-gray-800 text-xs text-gray-400 justify-between">
      <div className="flex items-center h-full">
        <div
          className={`flex items-center justify-center px-3 py-2 border-r border-gray-700
                      cursor-pointer hover:bg-gray-700 h-full
                      ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !isDisabled && copyExportToClipboard()}
          title={isDisabled ? "No files selected" : "Copy ⌘/Ctrl+C"}
        >
          <span className="h-full flex items-center">
            {status === "copying" ? (
              <span
                className="animate-spin block w-4 h-4 border-2
                                 border-gray-300 border-t-transparent rounded-full"
              />
            ) : status === "success" ? (
              <div className="text-green-500">✓</div>
            ) : (
              <Copy size={16} className="text-emerald-400" />
            )}
          </span>
          <span className="ml-2">Export Selection to Clipboard</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-2 absolute left-1/2 -translate-x-1/2 h-full">
        <div className="flex items-center gap-2 text-gray-200 text-sm">
          <p>{basename(workspacePath)}</p>
          <button
            onClick={handleClose}
            className="p-1 rounded-full cursor-pointer bg-gray-700 hover:bg-gray-600"
            data-tooltip-id="copy"
            data-tooltip-content="Close directory"
            title="Close directory"
          >
            <X size={12} />
          </button>
        </div>
      </div>
      <div className="flex ">
        {showQuickOpenButton && (
          <div
            className="flex flex-col items-center justify-center px-3 py-2 border-r border-gray-700 cursor-pointer hover:bg-gray-700"
            onClick={onQuickOpenClick}
          >
            <span className="mb-1">
              <FolderOpen size={16} />
            </span>
            <span>Quick Open</span>
          </div>
        )}
        <div className="flex items-center h-full">
          <div
            className="flex flex-col items-center justify-center px-3 py-2 border-r border-gray-700 cursor-pointer hover:bg-gray-700"
            onClick={onSettingsClick}
          >
            <span className="mb-1">
              <Settings size={16} />
            </span>
            <span>Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
};
