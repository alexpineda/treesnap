import { FileTreeNode } from "../types";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export const useFileTree = () => {
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const loadFileTree = async (dirPath: string) => {
    try {
      setStatus("loading");
      // Use the function without tokens for the initial load
      const tree = await invoke<FileTreeNode[]>("get_file_tree", {
        dirPath,
      });
      setFileTree(tree); // Use the tree directly, no mapping needed
      setStatus("loaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  const reset = () => {
    setFileTree([]);
    setStatus("idle");
    setError(null);
  };

  return {
    data: fileTree,
    loadFileTree,
    status,
    error,
    reset,
  };
};
