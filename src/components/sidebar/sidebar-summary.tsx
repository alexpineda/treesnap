import { ChevronsDownUp } from "lucide-react";
import { ChevronsUpDown } from "lucide-react";
import { FileTreeNode } from "../../types";
import { formatTokens, getAllFolderPaths } from "../../utils";
import { Tooltip } from "react-tooltip";

export const SidebarSummary = ({
  totalTokens,
  numExpandedFolders,
  numSelectedFiles,
  setExpandedFolders,
  fileTree,
}: {
  totalTokens: number;
  numExpandedFolders: number;
  numSelectedFiles: number;
  setExpandedFolders: (folders: Set<string>) => void;
  fileTree: FileTreeNode[];
}) => (
  <div className="flex justify-between mt-3">
    <div className="pl-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-gray-300">
          {numSelectedFiles} files selected
        </span>
        <span className="text-sm text-blue-400">
          {formatTokens(totalTokens)} Tokens
        </span>
      </div>
    </div>
    <button
      onClick={() => {
        if (numExpandedFolders === 0) {
          const allPaths = getAllFolderPaths(fileTree);
          setExpandedFolders(new Set(allPaths));
        } else {
          setExpandedFolders(new Set());
        }
      }}
      className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white"
      data-tooltip-id="expand-collapse"
      data-tooltip-content={
        numExpandedFolders === 0 ? "Expand All Folders" : "Collapse All Folders"
      }
    >
      {numExpandedFolders === 0 ? (
        <ChevronsUpDown size={14} />
      ) : (
        <ChevronsDownUp size={14} />
      )}
    </button>
    <Tooltip id="expand-collapse" delayShow={500} />
  </div>
);
