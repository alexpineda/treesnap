import { FileTreeNode } from "../types";
import { useState } from "react";
import { useFileTree } from "./use-filetree";

type WorkspaceStatus = "not-loaded" | "loading" | "loaded" | "error";

export const useWorkspace = (
  addToRecentWorkspaces: (dirPath: string) => void
) => {
  const [workspacePath, setWorkspacePath] = useState<string>("");
  const [workspaceStatus, setWorkspaceStatus] =
    useState<WorkspaceStatus>("not-loaded");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileTreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const fileTree = useFileTree();

  const loadWorkspace = async (dirPath: string) => {
    try {
      await fileTree.loadFileTree(dirPath);
      addToRecentWorkspaces(dirPath);
      setWorkspacePath(dirPath);
      setWorkspaceStatus("loaded");
      return true;
    } catch (err) {
      setWorkspaceError(err instanceof Error ? err.message : String(err));
      setWorkspaceStatus("error");
      setWorkspacePath("");
      throw err;
    }
  };

  const close = () => {
    setSelectedFiles([]);
    setExpandedFolders(new Set());
    setWorkspacePath("");
    setWorkspaceStatus("not-loaded");
    setWorkspaceError(null);
    fileTree.reset();
  };

  return {
    loadWorkspace,
    status: workspaceStatus,
    error: workspaceError,
    fileTree,
    selectedFiles,
    expandedFolders,
    setSelectedFiles,
    setExpandedFolders,
    workspacePath,
    close,
  };
};
