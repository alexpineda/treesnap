import React from "react";

interface FolderSummaryProps {
  selectedFiles: {
    path: string;
    is_directory: boolean;
    tokenCount?: number;
  }[];
  dir: string;
  totalTokens: number;
}

// Utility function to format token counts consistently
const formatTokens = (tokens: number, includeK = true): string => {
  const absTokens = Math.abs(tokens);
  const formatted = (absTokens / 1000).toFixed(2);
  return `~${formatted}${includeK ? "k" : ""}`;
};

export const FolderSummary: React.FC<FolderSummaryProps> = ({
  selectedFiles,
  dir,
  totalTokens,
}) => {
  // Compute folder data
  const folderData = selectedFiles
    .filter((f) => !f.is_directory)
    .reduce((acc, file) => {
      // Get directory path
      const dirPath = file.path.substring(0, file.path.lastIndexOf("/"));
      const relativePath = dirPath.replace(dir, "").replace(/^\//, "");
      const groupKey = relativePath || "root";

      // Initialize or update directory token count
      if (!acc[groupKey]) {
        acc[groupKey] = {
          tokens: 0,
          fileCount: 0,
        };
      }

      acc[groupKey].tokens += file.tokenCount || 0;
      acc[groupKey].fileCount += 1;

      return acc;
    }, {} as Record<string, { tokens: number; fileCount: number }>);

  // Sort folders by token count
  const sortedFolders = Object.entries(folderData).sort(
    (a, b) => b[1].tokens - a[1].tokens
  );

  return (
    <div className="w-full h-full bg-gray-800 text-white rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-2.5">
        <h3 className="m-0">Folder Summary</h3>
      </div>
      <div className="mb-5">
        {sortedFolders.map(([dirName, { tokens, fileCount }]) => {
          const percentage =
            totalTokens > 0 ? Math.round((tokens / totalTokens) * 100) : 0;

          return (
            <div
              key={dirName}
              className="flex flex-col p-2.5 my-0.5 bg-gray-700 rounded border-l-4 border-blue-500"
            >
              <div className="flex items-center text-sm">
                <span className="mr-2 text-blue-400">📁</span>
                <span
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "normal",
                  }}
                  className="text-gray-300"
                >
                  {dirName}/
                </span>
              </div>
              <div className="flex justify-between text-sm pl-6 mt-1">
                <div className="space-x-2">
                  <span className="text-blue-400">{formatTokens(tokens)}</span>
                  <span className="text-gray-400">{percentage}%</span>
                </div>
                <span className="text-gray-400">
                  {fileCount} {fileCount === 1 ? "file" : "files"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
