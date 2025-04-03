import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { FileTreeNode } from "../types";

type TreeOption = "include" | "include-only-selected" | "do-not-include";

export const useExport = ({
  selectedFiles,
  workspacePath,
}: {
  selectedFiles: FileTreeNode[];
  workspacePath: string;
}) => {
  const [status, setStatus] = useState<
    "idle" | "copying" | "success" | "error"
  >("idle");

  // New function to handle the copy to clipboard with tree structure
  const copyExportToClipboard = async (treeOption: TreeOption = "include") => {
    setStatus("copying");
    try {
      // Get the paths of all selected files
      const selectedFilePaths = selectedFiles
        .filter((file) => !file.is_directory)
        .map((file) => file.path);

      if (selectedFilePaths.length === 0) {
        throw new Error("No files selected to copy.");
      }

      // Call the Rust command to directly copy to clipboard
      await invoke("copy_files_with_tree_to_clipboard", {
        dirPath: workspacePath,
        selectedFilePaths: selectedFilePaths,
        treeOption,
      });

      // Show success feedback
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
      }, 1000);
    } catch (err) {
      //TODO toast error
    } finally {
      setStatus("idle");
    }
  };
  return { status, copyExportToClipboard };
};
