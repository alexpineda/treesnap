import { ChevronRight, FolderOpen } from "lucide-react";
import { Folder } from "lucide-react";
import { FileText } from "lucide-react";
import { FileTreeNode } from "../../types";
import { getAllDescendants } from "../../utils";

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
}: {
  isExpanded: boolean;
  onClick: () => void;
}) => (
  <div onClick={onClick} className="cursor-pointer flex-shrink-0">
    <ChevronRight
      size={16}
      className={`transition-transform duration-200 ${
        isExpanded ? "transform rotate-90" : ""
      }`}
    />
  </div>
);

const FileIconAndLabel = ({
  onClick,
  isFolder,
  isExpanded,
  node,
}: {
  onClick: () => void;
  isFolder: boolean;
  isExpanded: boolean;
  node: FileTreeNode;
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center cursor-pointer min-w-0 flex-shrink overflow-hidden w-full`}
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
        <div className="flex items-center py-1 pl-2 cursor-pointer text-sm gap-1 overflow-hidden">
          {isFolder && (
            <FolderToggle
              isExpanded={isExpanded}
              onClick={() => toggleFolder(node.path)}
            />
          )}
          {!isFolder && <div className="w-4 " />}
          <input
            type="checkbox"
            checked={isFolder ? selectionState === "all" : isSelected}
            ref={(el) => {
              if (el && isFolder) {
                el.indeterminate = selectionState === "partial";
              }
            }}
            onChange={() => handleFileSelect(node)}
            onClick={(e) => e.stopPropagation()}
            className={`w-4 h-4 inline-block align-middle relative cursor-pointer flex-shrink-0 border-none ${
              isSelected || selectionState === "all"
                ? "bg-blue-500"
                : "bg-gray-800"
            }`}
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
