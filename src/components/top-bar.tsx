import { Copy, Download, FolderOpen, X } from "lucide-react";
import { basename } from "../utils";
import { Tooltip } from "react-tooltip";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileTreeNode } from "../types";

export const TopBar = ({
  selectedFiles,
  workspacePath,
  handleClose,
}: {
  selectedFiles: FileTreeNode[];
  workspacePath: string;
  handleClose: () => void;
}) => {
  const [status, setStatus] = useState<
    "idle" | "copying" | "success" | "error"
  >("idle");

  // New function to handle the copy to clipboard with tree structure
  const handleCopyWithTree = async () => {
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
  return (
    <div className="flex relative border-b border-gray-700 bg-gray-800 text-xs text-gray-400 justify-between">
      <div className="flex items-center h-full">
        <div className="flex flex-col items-center justify-center px-3 py-2 border-r border-gray-700 cursor-pointer hover:bg-gray-700">
          <span className="mb-1">
            <FolderOpen size={16} />
          </span>
          <span>Quick Open</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-2 absolute left-1/2 -translate-x-1/2 h-full">
        <div className="flex items-center gap-2 text-gray-100">
          <p>{basename(workspacePath)}</p>
          <button
            onClick={handleClose}
            className="p-1 rounded cursor-pointer bg-gray-700 hover:bg-gray-600"
            title="Close directory"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex items-center h-full">
        <div
          className={`flex flex-col items-center justify-center px-3 py-2 border-r border-gray-700 cursor-pointer hover:bg-gray-700 ${
            status === "copying" ? "bg-gray-600" : ""
          }`}
          onClick={handleCopyWithTree}
          data-tooltip-id="copy"
          data-tooltip-content="Copy to clipboard with tree structure"
        >
          <span className="mb-1 h-full">
            {status === "copying" ? (
              <span className="animate-spin block w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full" />
            ) : status === "success" ? (
              <div className="text-green-500">✓</div>
            ) : (
              <Copy size={16} />
            )}
          </span>
          <Tooltip id="copy" delayShow={500} />
          <span>Copy</span>
        </div>
        <div className="flex flex-col items-center justify-center px-3 py-2 border-r border-gray-700 cursor-pointer hover:bg-gray-700">
          <span className="mb-1">
            <Download size={16} />
          </span>
          <span>Export</span>
        </div>
      </div>
    </div>
  );
};
