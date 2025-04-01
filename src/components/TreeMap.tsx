import { useState, useEffect, useRef } from "react";
import { FileTreeNode } from "../types";

interface TreeMapProps {
  selectedFiles: FileTreeNode[];
  totalTokens: number;
  onFileClick?: (file: FileTreeNode) => void;
  maxDepth?: number;
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

export const TreeMap = ({
  selectedFiles,
  totalTokens,
  onFileClick,
  maxDepth = 1,
}: TreeMapProps) => {
  const [items, setItems] = useState<TreeMapItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipInfo, setTooltipInfo] = useState<{
    file: TreeMapItem;
    x: number;
    y: number;
  } | null>(null);

  // Generate color based on file extension
  const getColorForFile = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const colorMap: Record<string, string> = {
      js: "bg-yellow-400", // JavaScript - yellow
      jsx: "bg-cyan-400", // React - light blue
      ts: "bg-blue-600", // TypeScript - blue
      tsx: "bg-cyan-500", // React TypeScript - light blue
      css: "bg-blue-700", // CSS - blue
      scss: "bg-pink-500", // SCSS - pink
      html: "bg-orange-600", // HTML - orange
      json: "bg-gray-800", // JSON - dark gray
      md: "bg-blue-800", // Markdown - dark blue
      py: "bg-blue-600", // Python - blue
      rs: "bg-orange-400", // Rust - orange
      go: "bg-blue-500", // Go - blue
      java: "bg-amber-700", // Java - brown
      rb: "bg-red-600", // Ruby - red
      php: "bg-purple-600", // PHP - purple
      c: "bg-gray-600", // C - gray
      cpp: "bg-pink-600", // C++ - pink
      h: "bg-gray-600", // Header - gray
      swift: "bg-orange-400", // Swift - orange
      kt: "bg-purple-400", // Kotlin - purple
    };

    return colorMap[ext] || "bg-gray-500"; // Default gray for unknown extensions
  };

  // Format tokens
  const formatTokens = (tokens: number): string => {
    if (tokens < 1000) return `${tokens}`;
    return `${(tokens / 1000).toFixed(1)}k`;
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

  const handleClick = (item: TreeMapItem) => {
    if (onFileClick) {
      onFileClick(item.file);
    }
  };

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

  return (
    <div className="w-full h-full flex flex-col" style={containerStyle}>
      <div className="text-sm font-medium mb-2 text-white">TreeMap View</div>
      <div
        ref={containerRef}
        className="bg-gray-800 rounded-md p-1 relative flex-grow flex items-center justify-center overflow-hidden"
      >
        {items.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No files selected or token data available
          </div>
        ) : (
          <div className="h-full aspect-square relative">
            {layout.map(({ item, x, y, width, height }) => (
              <div
                key={item.path}
                className={`absolute overflow-hidden rounded-sm cursor-pointer hover:opacity-90 ${item.color}`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                  transition: "all 0.2s",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
                onMouseOver={(e) => handleMouseOver(item, e)}
                onMouseOut={handleMouseOut}
                onClick={() => handleClick(item)}
              ></div>
            ))}
          </div>
        )}

        {/* Tooltip */}
        {tooltipInfo && (
          <div
            className="absolute z-10 bg-gray-900 text-white p-2 rounded-md shadow-lg text-xs border border-gray-700"
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
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-2">
        {items.slice(0, 5).map((item) => (
          <div
            key={`legend-${item.path}`}
            className="flex items-center text-xs"
          >
            <div className={`w-3 h-3 mr-1 rounded-sm ${item.color}`} />
            <span className="text-gray-300">{item.name}</span>
          </div>
        ))}
        {items.length > 5 && (
          <div className="text-xs text-gray-400">+{items.length - 5} more</div>
        )}
      </div>
    </div>
  );
};
