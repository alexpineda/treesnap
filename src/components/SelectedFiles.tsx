import React from "react";
import { FileTreeNode } from "../types";

interface SelectedFilesProps {
  selectedFiles: FileTreeNode[];
  dir: string;
  totalTokens: number;
  handleSort: () => void;
  sortDirection: "asc" | "desc";
  groupByDirectory?: boolean;
}

// Utility function to format token counts consistently
const formatTokens = (tokens: number, includeK = true): string => {
  const absTokens = Math.abs(tokens);
  const formatted = (absTokens / 1000).toFixed(2);
  return `~${formatted}${includeK ? "k" : ""}`;
};

export const SelectedFiles: React.FC<SelectedFilesProps> = ({
  selectedFiles,
  dir,
  totalTokens,
  handleSort,
  sortDirection,
  groupByDirectory = true,
}) => {
  // Group files by directory for display
  const getGroupedFiles = () => {
    if (!groupByDirectory) return selectedFiles.filter((f) => !f.is_directory);

    const groups: Record<string, FileTreeNode[]> = {};

    selectedFiles
      .filter((f) => !f.is_directory)
      .forEach((file) => {
        // Get the full directory path relative to the root
        const dirPath = file.path.substring(0, file.path.lastIndexOf("/"));
        const relativePath = dirPath.replace(dir, "").replace(/^\//, "");
        const groupKey = relativePath || "/";

        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }

        groups[groupKey].push(file);
      });

    return Object.entries(groups).flatMap(([dirPath, files]) => {
      // Total tokens for this directory
      const dirTokens = files.reduce(
        (sum, file) => sum + (file.tokenCount || 0),
        0
      );
      const dirPercentage =
        totalTokens > 0 ? Math.round((dirTokens / totalTokens) * 100) : 0;

      // Create a "directory header" node
      const dirNode: FileTreeNode = {
        name: dirPath === "/" ? "root" : dirPath.split("/").join(" / "),
        path: `${dirPath}_header`,
        is_directory: true,
        tokenCount: dirTokens,
        dirPercentage,
        children: files,
      };

      return [dirNode, ...files];
    });
  };

  return (
    <div className="w-full bg-gray-800 text-white rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center">
          <h3 className="m-0">Selected Files</h3>
          <button
            onClick={handleSort}
            className="ml-2 bg-transparent border-none text-white flex items-center cursor-pointer"
          >
            <span className="mr-0.5">
              {sortDirection === "asc" ? "↑" : "↓"}
            </span>{" "}
            Sort
          </button>
        </div>
        <div className="flex items-center">
          <span className="mr-2.5 text-gray-400 text-sm">
            {selectedFiles.filter((f) => !f.is_directory).length} files
          </span>
          <span className="text-gray-400 text-sm">
            {formatTokens(totalTokens)} Tokens
          </span>
        </div>
      </div>

      <div
        className="mb-5 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 250px)" }}
      >
        {getGroupedFiles().map((file, index, files) => {
          const isDirectoryHeader =
            file.is_directory && file.dirPercentage !== undefined;
          const isFirstFileInGroup =
            isDirectoryHeader &&
            index < files.length - 1 &&
            !files[index + 1].is_directory;

          return (
            <div key={file.path}>
              <div
                className={`flex justify-between p-2.5 ${
                  isDirectoryHeader ? "mt-2.5" : "my-0.5"
                } ${
                  isDirectoryHeader ? "bg-gray-800" : "bg-gray-700"
                } rounded ${
                  isDirectoryHeader ? "border-l-4 border-blue-500" : ""
                }`}
              >
                <div className="flex items-center text-sm">
                  <span
                    className={`mr-2 ${
                      isDirectoryHeader ? "text-blue-400" : "text-gray-300"
                    }`}
                  >
                    {isDirectoryHeader ? "📁" : "📄"}
                  </span>
                  <span
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      whiteSpace: "normal",
                    }}
                    className="text-gray-300"
                  >
                    {isDirectoryHeader ? `${file.name}/` : file.name}
                  </span>
                </div>
                <div>
                  {file.tokenCount !== undefined && (
                    <span
                      className={`${
                        isDirectoryHeader ? "text-blue-400" : "text-gray-400"
                      }`}
                    >
                      -{formatTokens(file.tokenCount)}
                      {isDirectoryHeader &&
                        file.dirPercentage !== undefined &&
                        ` (${file.dirPercentage}%)`}
                      {!isDirectoryHeader &&
                        totalTokens > 0 &&
                        ` (${Math.round(
                          (file.tokenCount / totalTokens) * 100
                        )}%)`}
                    </span>
                  )}
                </div>
              </div>
              {isFirstFileInGroup && (
                <div className="h-px bg-gray-700 ml-5"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
