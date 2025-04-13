import { ChevronsDownUp, ChevronsUpDown, RefreshCcw } from "lucide-react";
import { FileTreeNode } from "../../types";
import { getAllFolderPaths } from "../../utils";
import { Tooltip } from "react-tooltip";
import { FileTokenSummaryLabel } from "../file-token-summary-label";

export const SidebarSummary = ({
  totalTokens,
  numExpandedFolders,
  setExpandedFolders,
  fileTree,
  onRefresh,
  selectedFiles,
}: {
  totalTokens: number;
  numExpandedFolders: number;
  setExpandedFolders: (folders: Set<string>) => void;
  fileTree: FileTreeNode[];
  onRefresh: () => void;
  selectedFiles: FileTreeNode[];
}) => (
  <div className="flex justify-between mt-3">
    <div className="pl-4">
      <FileTokenSummaryLabel
        selectedFiles={selectedFiles}
        totalTokens={totalTokens}
        variant="sidebar"
      />
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={onRefresh}
        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white"
      >
        <RefreshCcw size={14} className="text-gray-400" />
      </button>
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
          numExpandedFolders === 0
            ? "Expand All Folders"
            : "Collapse All Folders"
        }
      >
        {numExpandedFolders === 0 ? (
          <ChevronsUpDown size={14} />
        ) : (
          <ChevronsDownUp size={14} />
        )}
      </button>
    </div>
    <Tooltip id="expand-collapse" delayShow={500} />
  </div>
);
