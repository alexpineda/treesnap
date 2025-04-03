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
