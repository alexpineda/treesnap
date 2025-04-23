import { useState, useEffect, useRef, useCallback } from "react";
import { FileTreeNode } from "../types";
import classNames from "classnames";
import { formatTokens } from "../utils";
import { FileTokenSummaryLabel } from "./file-token-summary-label";

interface TreeMapProps {
  selectedFiles: FileTreeNode[];
  totalTokens: number;
  onFileClick?: (file: FileTreeNode) => void;
  setSelectedFiles: (files: FileTreeNode[]) => void;
  maxDepth?: number;
  className?: string;
}

type TreeMapItem = {
  name: string;
  path: string;
  size: number;
  color: string;
  tokenCount: number;
  percentage: number;
  file: FileTreeNode;
};

type TreeMapLayout = {
  item: TreeMapItem;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Type for the extension popover state
type ExtensionPopoverInfo = {
  extension: string;
  color: string;
  x: number;
  y: number;
};

export const TreeMap = ({
  selectedFiles,
  setSelectedFiles,
  totalTokens,
  onFileClick,
  className,
}: TreeMapProps) => {
  const [items, setItems] = useState<TreeMapItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipInfo, setTooltipInfo] = useState<{
    file: TreeMapItem;
    x: number;
    y: number;
  } | null>(null);
  const [popoverInfo, setPopoverInfo] = useState<{
    item: TreeMapItem;
    x: number;
    y: number;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [extensionPopoverInfo, setExtensionPopoverInfo] =
    useState<ExtensionPopoverInfo | null>(null);
  const extensionPopoverRef = useRef<HTMLDivElement>(null);

  // Generate color based on file extension
  const getColorForFile = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const colorMap: Record<string, string> = {
      js: "bg-gradient-to-br from-yellow-300 to-yellow-500", // JavaScript - yellow gradient
      jsx: "bg-gradient-to-br from-cyan-300 to-cyan-500", // React - light blue gradient
      ts: "bg-gradient-to-br from-blue-500 to-blue-700", // TypeScript - blue gradient
      tsx: "bg-gradient-to-br from-cyan-400 to-cyan-600", // React TypeScript - light blue gradient
      css: "bg-gradient-to-br from-blue-600 to-blue-800", // CSS - blue gradient
      scss: "bg-gradient-to-br from-pink-400 to-pink-600", // SCSS - pink gradient
      html: "bg-gradient-to-br from-orange-500 to-orange-700", // HTML - orange gradient
      json: "bg-gradient-to-br from-gray-700 to-gray-900", // JSON - dark gray gradient
      md: "bg-gradient-to-br from-blue-700 to-blue-900", // Markdown - dark blue gradient
      py: "bg-gradient-to-br from-blue-500 to-blue-700", // Python - blue gradient
      rs: "bg-gradient-to-br from-orange-300 to-orange-500", // Rust - orange gradient
      go: "bg-gradient-to-br from-blue-400 to-blue-600", // Go - blue gradient
      java: "bg-gradient-to-br from-amber-600 to-amber-800", // Java - brown gradient
      rb: "bg-gradient-to-br from-red-500 to-red-700", // Ruby - red gradient
      php: "bg-gradient-to-br from-purple-500 to-purple-700", // PHP - purple gradient
      c: "bg-gradient-to-br from-gray-500 to-gray-700", // C - gray gradient
      cpp: "bg-gradient-to-br from-pink-500 to-pink-700", // C++ - pink gradient
      h: "bg-gradient-to-br from-gray-500 to-gray-700", // Header - gray gradient
      swift: "bg-gradient-to-br from-orange-300 to-orange-500", // Swift - orange gradient
      kt: "bg-gradient-to-br from-purple-300 to-purple-500", // Kotlin - purple gradient
    };

    return colorMap[ext] || "bg-gradient-to-br from-gray-400 to-gray-600"; // Default gray gradient for unknown extensions
  };

  useEffect(() => {
    if (selectedFiles.length === 0 || totalTokens === 0) {
      setItems([]);
      return;
    }

    // Create TreeMap items from selected files
    const treeMapItems: TreeMapItem[] = selectedFiles
      .filter(
        (file) =>
          !file.is_directory &&
          file.tokenCount !== undefined &&
          file.tokenCount > 0
      )
      .map((file) => {
        const percentage = (file.tokenCount || 0) / totalTokens;
        return {
          name: file.name,
          path: file.path,
          size: Math.max(percentage * 100, 0.1), // Ensure at least 0.1% to be visible
          color: getColorForFile(file.name),
          tokenCount: file.tokenCount || 0,
          percentage: percentage,
          file,
        };
      })
      .sort((a, b) => b.size - a.size); // Sort by size descending

    setItems(treeMapItems);
  }, [selectedFiles, totalTokens]);

  const handleMouseOver = (item: TreeMapItem, event: React.MouseEvent) => {
    setTooltipInfo({
      file: item,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleMouseOut = () => {
    setTooltipInfo(null);
  };

  const handleClick = (item: TreeMapItem, event: React.MouseEvent) => {
    if (onFileClick) {
      onFileClick(item.file);
    }
    setPopoverInfo({
      item: item,
      x: event.clientX,
      y: event.clientY,
    });
    event.stopPropagation();
  };

  const handleDeselect = (itemToDeselect: TreeMapItem) => {
    console.log("deselecting", itemToDeselect);
    setSelectedFiles(
      selectedFiles.filter((file) => file.path !== itemToDeselect.path)
    );
    setPopoverInfo(null);
  };

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      // Close file popover if click is outside
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setPopoverInfo(null);
      }
      // Close extension popover if click is outside
      if (
        extensionPopoverRef.current &&
        !extensionPopoverRef.current.contains(event.target as Node) &&
        extensionPopoverInfo // Only check if it's open
      ) {
        setExtensionPopoverInfo(null);
      }
    },
    [setPopoverInfo, setExtensionPopoverInfo, extensionPopoverInfo] // Add extensionPopoverInfo dependency
  );

  useEffect(() => {
    // Add listener if either popover is open
    if (popoverInfo || extensionPopoverInfo) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    // Cleanup listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverInfo, extensionPopoverInfo, handleClickOutside]); // Add extensionPopoverInfo

  // Update container styling approach
  const containerStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
  };

  // Create a non-overlapping layout
  const createTreemapLayout = (): TreeMapLayout[] => {
    if (items.length === 0) return [];

    // Simplified squarified treemap algorithm approach
    const width = 100;
    const height = 100;
    const result: TreeMapLayout[] = [];

    // Sort items by size (largest first)
    const sortedItems = [...items].sort((a, b) => b.size - a.size);

    // Simple recursive subdivision approach
    const subdivide = (
      items: TreeMapItem[],
      x: number,
      y: number,
      w: number,
      h: number
    ) => {
      if (items.length === 0) return;
      if (items.length === 1) {
        result.push({
          item: items[0],
          x,
          y,
          width: w,
          height: h,
        });
        return;
      }

      // Determine split direction (horizontal or vertical)
      const isHorizontal = w > h;

      // Find pivot point for subdivision
      const totalSize = items.reduce((sum, item) => sum + item.size, 0);
      let currentSize = 0;
      let pivotIndex = 0;

      // Find the pivot that gets closest to half the total size
      for (let i = 0; i < items.length; i++) {
        currentSize += items[i].size;
        if (currentSize >= totalSize / 2) {
          pivotIndex = i;
          break;
        }
      }

      // Split items
      const group1 = items.slice(0, pivotIndex + 1);
      const group2 = items.slice(pivotIndex + 1);

      // Calculate sizes proportionally
      const group1Size = group1.reduce((sum, item) => sum + item.size, 0);
      const group1Ratio = group1Size / totalSize;

      // Subdivide space
      if (isHorizontal) {
        // Split horizontally
        const width1 = w * group1Ratio;
        subdivide(group1, x, y, width1, h);
        subdivide(group2, x + width1, y, w - width1, h);
      } else {
        // Split vertically
        const height1 = h * group1Ratio;
        subdivide(group1, x, y, w, height1);
        subdivide(group2, x, y + height1, w, h - height1);
      }
    };

    // Start subdivision
    subdivide(sortedItems, 0, 0, width, height);
    return result;
  };

  // Generate layout
  const layout = createTreemapLayout();

  // Handle clicking a legend item
  const handleLegendItemClick = (
    extension: string,
    color: string,
    event: React.MouseEvent
  ) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setExtensionPopoverInfo({
      extension,
      color,
      x: event.clientX - rect.left, // Relative to container
      y: event.clientY - rect.top, // Relative to container
    });
    // Prevent triggering other click handlers (like handleClickOutside immediately)
    event.stopPropagation();
  };

  // Handle deselecting all files with a specific extension
  const handleDeselectExtension = (extensionToDeselect: string) => {
    setSelectedFiles(
      selectedFiles.filter(
        (file) => !file.name.toLowerCase().endsWith(extensionToDeselect)
      )
    );
    setExtensionPopoverInfo(null); // Close the popover
  };

  return (
    <div
      className={classNames("w-full flex flex-col p-4", className)}
      style={containerStyle}
    >
      <div className="flex items-center gap-4 mb-2">
        <h3 className="m-0 text-sm font-medium text-white">
          Token Size Treemap
        </h3>
        <FileTokenSummaryLabel
          selectedFiles={selectedFiles}
          totalTokens={totalTokens}
        />
      </div>
      <div
        ref={containerRef}
        className="bg-gray-800 rounded-md p-1 relative flex-grow flex items-center justify-center overflow-hidden"
      >
        {items.length === 0 ? (
          <div className="w-full flex items-center justify-center text-gray-400">
            No files selected or token data available
          </div>
        ) : (
          <div className="h-full aspect-square relative">
            {layout.map(({ item, x, y, width, height }) => (
              <div
                key={item.path}
                className={`absolute overflow-hidden rounded-xs cursor-pointer hover:opacity-90 ${item.color}`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                  transition: "all 0.2s",
                  border: "2px solid rgba(0,0,0,0.1)",
                }}
                onMouseOver={(e) => handleMouseOver(item, e)}
                onMouseOut={handleMouseOut}
                onClick={(e) => handleClick(item, e)}
              ></div>
            ))}
          </div>
        )}

        {/* Tooltip */}
        {tooltipInfo && !popoverInfo && (
          <div
            className="absolute z-100 bg-gray-900 text-white p-2 rounded-md shadow-lg text-xs border border-gray-700 pointer-events-none"
            style={{
              top: containerRef.current
                ? tooltipInfo.y -
                  containerRef.current.getBoundingClientRect().top +
                  10
                : 0,
              left: containerRef.current
                ? tooltipInfo.x -
                  containerRef.current.getBoundingClientRect().left +
                  10
                : 0,
              maxWidth: "220px",
            }}
          >
            <div className="font-bold text-sm">{tooltipInfo.file.name}</div>
            <div>Tokens: {formatTokens(tooltipInfo.file.tokenCount)}</div>
            <div>
              % of Total: {(tooltipInfo.file.percentage * 100).toFixed(1)}%
            </div>
            <div className="text-gray-400 truncate">
              {tooltipInfo.file.path}
            </div>
          </div>
        )}

        {/* File Popover Menu */}
        {popoverInfo && (
          <div
            ref={popoverRef}
            className="absolute z-110 bg-gray-800 border border-gray-600 text-white rounded-md shadow-lg text-sm"
            style={{
              top: containerRef.current
                ? popoverInfo.y -
                  containerRef.current.getBoundingClientRect().top
                : 0,
              left: containerRef.current
                ? popoverInfo.x -
                  containerRef.current.getBoundingClientRect().left
                : 0,
            }}
          >
            <div className="p-2 border-b border-gray-700">
              <div className="font-bold">{popoverInfo.item.name}</div>
              <div className="text-xs text-gray-400">
                {formatTokens(popoverInfo.item.tokenCount)} tokens
              </div>
            </div>
            <button
              onClick={() => handleDeselect(popoverInfo.item)}
              className="block w-full text-left px-3 py-1.5 hover:bg-gray-700 rounded-b-md"
            >
              Deselect
            </button>
            {/* Add more options here if needed */}
          </div>
        )}

        {/* Extension Popover Menu */}
        {extensionPopoverInfo && (
          <div
            ref={extensionPopoverRef}
            className="absolute z-110 bg-gray-800 border border-gray-600 text-white rounded-md shadow-lg text-sm"
            style={{
              // Position relative to the containerRef
              top: `${extensionPopoverInfo.y + 5}px`, // Add small offset
              left: `${extensionPopoverInfo.x + 5}px`, // Add small offset
            }}
          >
            <div className="p-2 border-b border-gray-700 flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-sm ${extensionPopoverInfo.color}`}
              />
              <span className="font-bold">
                {extensionPopoverInfo.extension} files
              </span>
            </div>
            <button
              onClick={() =>
                handleDeselectExtension(extensionPopoverInfo.extension)
              }
              className="block w-full text-left px-3 py-1.5 hover:bg-gray-700 rounded-b-md"
            >
              Deselect all ({extensionPopoverInfo.extension})
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        <div className="text-gray-400 text-sm flex flex-wrap gap-x-3 gap-y-1 items-center">
          Legend:
          {(() => {
            const extensionMap = new Map<string, string>();
            items.forEach((f) => {
              const extension = `.${f.name.split(".").pop()?.toLowerCase()}`;
              if (extension !== ".") {
                extensionMap.set(extension, f.color);
              }
            });
            return Array.from(extensionMap.entries()).map(
              ([extension, color]) => (
                <button // Changed span to button for clickability
                  key={extension}
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-700 p-0.5 rounded"
                  onClick={(e) => handleLegendItemClick(extension, color, e)}
                >
                  <div
                    className={`w-3 h-3 rounded-sm ${color} flex-shrink-0`}
                  />
                  <span className="text-gray-300 text-xs">{extension}</span>
                </button>
              )
            );
          })()}
        </div>
      </div>
    </div>
  );
};
