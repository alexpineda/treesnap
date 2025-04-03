import { invoke } from "@tauri-apps/api/core";
import { FileTreeNode } from "../types";

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

export const toggleSelect = async (
  node: FileTreeNode,
  fileTree: FileTreeNode[],
  selectedFiles: FileTreeNode[]
) => {
  if (node.is_directory) {
    // --- Directory Selection Logic ---

    // Find the corresponding node in the main fileTree to get its current children for path checking
    const displayNode = findNodeByPath(fileTree, node.path);
    if (!displayNode) {
      console.error(
        "Could not find directory node in display tree:",
        node.path
      );
      return;
    }

    const allDescendantPaths = getAllDescendants(displayNode).map(
      (d) => d.path
    );

    // Determine if we are selecting or deselecting based on current selection state
    const isSelecting = !selectedFiles.some(
      (sf) => allDescendantPaths.includes(sf.path) && !sf.is_directory
    );

    if (isSelecting) {
      // Fetch the subtree with tokens
      const subtreeWithTokens = await invoke<FileTreeNode[]>(
        "get_file_tree_with_tokens",
        { dirPath: node.path }
      );

      // Need to reconstruct the root node for getAllDescendants to work correctly on the result
      const rootSubtreeNode: FileTreeNode = {
        ...node,
        children: subtreeWithTokens,
      };
      const filesToAdd = getAllDescendants(rootSubtreeNode)
        .filter((n) => !n.is_directory)
        .map((n) => ({ ...n, tokenCount: n.token_count })); // Map token_count

      // Add new files, avoiding duplicates
      const existingPaths = new Set(selectedFiles.map((f) => f.path));
      const uniqueNewFiles = filesToAdd.filter(
        (f) => !existingPaths.has(f.path)
      );
      return [...selectedFiles, ...uniqueNewFiles];
    } else {
      // Deselecting: remove all descendants found in the display tree
      return selectedFiles.filter(
        (sf) => !allDescendantPaths.includes(sf.path)
      );
    }
  } else {
    // --- File Selection Logic ---
    const isCurrentlySelected = selectedFiles.some((f) => f.path === node.path);

    if (isCurrentlySelected) {
      // Remove file
      return selectedFiles.filter((f) => f.path !== node.path);
    } else {
      // Add file (calculateTotalTokens useEffect will handle fetching tokens if needed)
      return [...selectedFiles, node];
    }
  }
};
