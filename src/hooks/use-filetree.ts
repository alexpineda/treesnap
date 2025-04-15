import { FileChangeEvent, FileTreeNode } from "../types";
import { useEffect, useState } from "react";
import { closeWorkspace, openWorkspace } from "../services/tauri";
import { listen } from "@tauri-apps/api/event";

export const useFileTree = (
  onFilesChanged: (files: FileChangeEvent[]) => void
) => {
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [currentDirPath, setCurrentDirPath] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const loadFileTree = async (dirPath: string) => {
    if (status === "loading") return;

    setStatus("loading");
    setError(null);
    const { tree, error } = await openWorkspace(dirPath);
    if (error) {
      setError(error.message);
      setStatus("error");
      setCurrentDirPath(null);
      console.error(`Error loading file tree for ${dirPath}:`, error.message);
    } else if (tree) {
      setFileTree(tree);
      setCurrentDirPath(dirPath);
      setStatus("loaded");
      console.log(`File tree loaded for: ${dirPath}`);
    }
  };

  const close = async () => {
    if (currentDirPath) {
      try {
        await closeWorkspace();
        console.log(`Workspace closed for: ${currentDirPath}`);
      } catch (err) {
        console.error("Error closing workspace:", err);
      }
    }
    setFileTree([]);
    setCurrentDirPath(null);
    setStatus("idle");
    setError(null);
  };

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    if (status === "loaded" && currentDirPath) {
      console.log(
        `Setting up listener for files-changed-event in ${currentDirPath}`
      );
      const setupListener = async () => {
        try {
          unlisten = await listen<FileChangeEvent[]>(
            "files-changed-event",
            (event) => {
              console.log("Files changed event received:", event.payload);
              if (currentDirPath) {
                console.log("Reloading file tree due to change detection...");
                loadFileTree(currentDirPath);
                onFilesChanged(event.payload);
              }
            }
          );
        } catch (e) {
          console.error("Failed to set up file change listener:", e);
          setError("Failed to listen for file changes.");
          setStatus("error");
        }
      };
      setupListener();
    }

    return () => {
      if (unlisten) {
        console.log(
          `Cleaning up listener for files-changed-event in ${
            currentDirPath || "previous session"
          }`
        );
        unlisten();
      }
    };
  }, [status, currentDirPath]);

  return {
    data: fileTree,
    loadFileTree,
    status,
    error,
    close,
    currentDirPath,
  };
};
