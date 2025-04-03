import React from "react";
import { FileTreeNode } from "../types";
import { Folder, FileText, SquareX } from "lucide-react";
import classNames from "classnames";

interface SelectedFilesProps {
  selectedFiles: FileTreeNode[];
  dir: string;
  totalTokens: number;
  handleSort: () => void;
  sortDirection: "asc" | "desc";
  groupByDirectory?: boolean;
  onDeselect: (file: FileTreeNode) => void;
}

// Utility function to format token counts consistently
const formatTokens = (tokens: number, includeK = true): string => {
  const absTokens = Math.abs(tokens);
  const formatted = (absTokens / 1000).toFixed(2);
  return `~${formatted}${includeK ? "k" : ""}`;
};

export const SelectionSummary: React.FC<SelectedFilesProps> = ({
  selectedFiles,
  dir,
  totalTokens,
  handleSort,
  sortDirection,
  groupByDirectory = true,
  onDeselect,
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
    <div className="w-full text-white p-4 shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-4">
          <h3 className="m-0">Selection Summary</h3>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">
              {selectedFiles.filter((f) => !f.is_directory).length} files
            </span>
            <span className="text-gray-400 text-sm">
              {formatTokens(totalTokens)} Tokens
            </span>
            <span className="text-gray-400 text-sm ml-6">
              {(() => {
                const extensions = new Set(
                  selectedFiles
                    .filter((f) => !f.is_directory)
                    .map((f) => `.${f.name.split(".").pop()?.toLowerCase()}`)
                    .filter(Boolean)
                );
                return `${Array.from(extensions).join(", ")}`;
              })()}
            </span>
          </div>
        </div>

        <button
          onClick={handleSort}
          className="ml-2 bg-transparent border-none text-white flex items-center cursor-pointer"
        >
          <span className="mr-0.5">{sortDirection === "asc" ? "↑" : "↓"}</span>{" "}
          Sort
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {getGroupedFiles().map((file, index, files) => {
          const isDirectoryHeader =
            file.is_directory && file.dirPercentage !== undefined;

          return (
            <div key={file.path}>
              <div
                className={classNames("flex justify-between p-1", {
                  rounded: true,
                  "border-t-1 border-l-1 border-r-1 border-gray-600 bg-gray-800 hover:bg-gray-700":
                    isDirectoryHeader,
                  "border-l-1 border-r-1 border-gray-600 bg-gray-800 hover:bg-gray-700":
                    !isDirectoryHeader,
                  "border-b-1 border-gray-600 bg-gray-800":
                    !isDirectoryHeader && index === files.length - 1,
                  "mt-2": isDirectoryHeader,
                })}
              >
                <div className="flex items-center text-sm">
                  <span
                    className={`mr-2 ${
                      isDirectoryHeader ? "text-blue-400" : "text-gray-300"
                    }`}
                  >
                    {isDirectoryHeader ? (
                      <Folder size={16} />
                    ) : (
                      <FileText size={16} />
                    )}
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
                <div className="flex items-center gap-2">
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
                  <span className="text-gray-300 text-sm">
                    <button
                      className="bg-transparent border-none flex items-center cursor-pointer"
                      onClick={() => onDeselect(file)}
                    >
                      <SquareX size={16} />
                    </button>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
