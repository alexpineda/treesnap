import { FileTreeNode } from "../types";
import { getFileTreeWithTokens } from "../services/tauri";

export const findNodeByPath = (
  nodes: FileTreeNode[],
  path: string
): FileTreeNode | null => {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

export const getAllDescendants = (node: FileTreeNode): FileTreeNode[] => {
  let items: FileTreeNode[] = [node];
  if (node.children) {
    node.children.forEach((child) => {
      items = items.concat(getAllDescendants(child));
    });
  }
  return items;
};

export const getAllFolderPaths = (nodes: FileTreeNode[]): string[] => {
  let paths: string[] = [];
  nodes.forEach((node) => {
    if (node.is_directory) {
      paths.push(node.path);
      if (node.children) {
        paths = paths.concat(getAllFolderPaths(node.children));
      }
    }
  });
  return paths;
};

export const toggleSelect = (
  node: FileTreeNode,
  fileTree: FileTreeNode[],
  selectedFiles: FileTreeNode[]
) => {
  if (node.is_directory) {
    // --- Directory Selection Logic ---

    // Find the corresponding node in the main fileTree to get its children
    const displayNode = findNodeByPath(fileTree, node.path);
    if (!displayNode) {
      console.error(
        "Could not find directory node in display tree:",
        node.path
      );
      return selectedFiles; // Return original selection on error
    }

    // Get all descendants (files and directories) from the display node
    const allDescendants = getAllDescendants(displayNode);
    const allDescendantPaths = new Set(allDescendants.map((d) => d.path));

    // Check if any *file* descendant of this directory is currently selected
    const isAnyFileDescendantSelected = selectedFiles.some(
      (sf) => !sf.is_directory && allDescendantPaths.has(sf.path)
    );

    if (isAnyFileDescendantSelected) {
      // DESELECTING: Remove all descendants (files) from the selection
      return selectedFiles.filter((sf) => !allDescendantPaths.has(sf.path));
    } else {
      // SELECTING: Add all file descendants to the selection
      const filesToAdd = allDescendants
        .filter((n) => !n.is_directory)
        // Ensure we add the node object itself, not just the path
        // Let the calculateTotalTokens effect handle fetching tokens later
        .map((n) => ({ ...n, tokenCount: undefined, isLoading: true })); // Mark as loading

      // Add new files, avoiding duplicates (though filtering selected should handle this)
      const existingPaths = new Set(selectedFiles.map((f) => f.path));
      const uniqueNewFiles = filesToAdd.filter(
        (f) => !existingPaths.has(f.path)
      );
      return [...selectedFiles, ...uniqueNewFiles];
    }
  } else {
    // --- File Selection Logic ---
    const isCurrentlySelected = selectedFiles.some((f) => f.path === node.path);

    if (isCurrentlySelected) {
      // Remove file
      return selectedFiles.filter((f) => f.path !== node.path);
    } else {
      // Add file (mark as loading, calculateTotalTokens useEffect will handle fetching tokens)
      return [
        ...selectedFiles,
        { ...node, tokenCount: undefined, isLoading: true },
      ];
    }
  }
};
