import { ChevronRight, FolderOpen } from "lucide-react";
import { Folder } from "lucide-react";
import { FileText } from "lucide-react";
import { FileTreeNode } from "../../types";
import { getAllDescendants } from "../../utils";
import classNames from "classnames";
import { CustomCheckbox } from "../ui/custom-checkbox";

const calculateDirectorySelectionState = (
  node: FileTreeNode,
  selectedFiles: FileTreeNode[]
): "none" | "partial" | "all" => {
  if (!node.is_directory || !node.children) return "none";

  const allDescendants = getAllDescendants(node);

  // Count selected files (not directories) among all descendants
  const selectedDescendants = allDescendants.filter(
    (f) =>
      !f.is_directory &&
      selectedFiles.some((s: FileTreeNode) => s.path === f.path)
  );
  const totalFiles = allDescendants.filter((f) => !f.is_directory);

  if (selectedDescendants.length === 0) return "none";
  if (selectedDescendants.length === totalFiles.length) return "all";
  return "partial";
};

const FolderToggle = ({
  isExpanded,
  onClick,
  className,
}: {
  isExpanded: boolean;
  className?: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={classNames("cursor-pointer flex-shrink-0", className)}
  >
    <ChevronRight
      size={14}
      className={classNames("transition-transform duration-200", {
        "transform rotate-90": isExpanded,
        "text-gray-400": !isExpanded,
        "text-gray-300": isExpanded,
      })}
    />
  </div>
);

const FileIconAndLabel = ({
  onClick,
  isFolder,
  isExpanded,
  node,
  className,
}: {
  onClick: () => void;
  isFolder: boolean;
  isExpanded: boolean;
  node: FileTreeNode;
  className?: string;
}) => {
  return (
    <div
      onClick={onClick}
      className={classNames(
        "flex items-center cursor-pointer min-w-0 flex-shrink overflow-hidden w-full",
        className
      )}
    >
      <span className="mr-1 w-4 inline-block text-center flex-shrink-0">
        {isFolder ? (
          isExpanded ? (
            <FolderOpen size={16} />
          ) : (
            <Folder size={16} />
          )
        ) : (
          <FileText size={16} />
        )}
      </span>
      <span className="text-gray-300 truncate flex-1">{node.name}</span>
    </div>
  );
};

export const FileTree = ({
  nodes,
  level = 0,
  expandedFolders,
  selectedFiles,
  handleFileSelect,
  onFoldersExpandedOrCollapsed,
}: {
  nodes: FileTreeNode[];
  level: number;
  expandedFolders: Set<string>;
  selectedFiles: FileTreeNode[];
  handleFileSelect: (node: FileTreeNode) => void;
  onFoldersExpandedOrCollapsed: (folders: Set<string>) => void;
}) => {
  const toggleFolder = (path: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    onFoldersExpandedOrCollapsed(newSet);
  };

  return nodes.map((node) => {
    const isFolder = node.is_directory;
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFiles.some((f) => f.path === node.path);
    const selectedFile = selectedFiles.find((f) => f.path === node.path);
    const isLoading = selectedFile?.isLoading;
    const selectionState = isFolder
      ? calculateDirectorySelectionState(node, selectedFiles)
      : undefined;

    return (
      <div
        key={node.path}
        style={{ marginLeft: `${level * 12}px` }}
        data-level={level}
      >
        <div className="flex items-center text-sm gap-1 overflow-hidden">
          {isFolder && (
            <FolderToggle
              className="pl-2 py-1"
              isExpanded={isExpanded}
              onClick={() => toggleFolder(node.path)}
            />
          )}
          {!isFolder && <div className="w-6 " />}
          <CustomCheckbox
            checked={isFolder ? selectionState === "all" : isSelected}
            indeterminate={isFolder && selectionState === "partial"}
            onChange={() => handleFileSelect(node)}
            className="flex-shrink-0 py-1"
          />

          <FileIconAndLabel
            onClick={() =>
              node.is_directory
                ? toggleFolder(node.path)
                : handleFileSelect(node)
            }
            isFolder={isFolder}
            isExpanded={isExpanded}
            node={node}
            className="py-1"
          />
          {!isFolder && (
            <span className="ml-2 text-sm text-gray-400 flex-shrink-0">
              {isLoading ? (
                <span className="animate-pulse">Calculating...</span>
              ) : node.tokenCount !== undefined ? (
                `${node.tokenCount} tokens`
              ) : null}
            </span>
          )}
        </div>

        {isFolder && isExpanded && node.children && (
          <FileTree
            nodes={node.children}
            level={level + 1}
            expandedFolders={expandedFolders}
            selectedFiles={selectedFiles}
            handleFileSelect={handleFileSelect}
            onFoldersExpandedOrCollapsed={onFoldersExpandedOrCollapsed}
          />
        )}
      </div>
    );
  });
};
