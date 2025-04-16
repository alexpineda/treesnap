import { FileTreeNode } from "../types";
import { formatTokens } from "../utils/formatters";
import { Loader2 } from "lucide-react";
export const FileTokenSummaryLabel = ({
  selectedFiles,
  totalTokens,
  variant = "sidebar",
}: {
  selectedFiles: FileTreeNode[];
  totalTokens: number;
  variant?: "sidebar" | "default";
}) => {
  const numSelectedFiles = selectedFiles.filter((f) => !f.is_directory).length;
  const hasLoadingFiles = selectedFiles.some((f) => f.isLoading);

  if (variant === "sidebar") {
    return (
      <div className="flex items-center justify-between gap-2 overflow-hidden">
        <span className="text-sm text-gray-300 whitespace-nowrap">
          {numSelectedFiles}{" "}
          <span className="text-blue-400">files selected</span>
        </span>
        <span className="text-sm text-gray-300 whitespace-nowrap">
          {formatTokens(totalTokens)} tokens
        </span>
        {hasLoadingFiles && (
          <span className="animate-pulse flex-shrink-0">
            <Loader2 className="w-4 h-4 animate-spin" />
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <span className="text-gray-400 text-sm whitespace-nowrap">
        {numSelectedFiles} <span>files selected</span>
      </span>
      <span className="text-gray-400 text-sm whitespace-nowrap">
        {formatTokens(totalTokens)} tokens
      </span>
      {hasLoadingFiles && (
        <span className="animate-pulse flex-shrink-0">
          <Loader2 className="w-4 h-4 animate-spin" />
        </span>
      )}
    </div>
  );
};
