import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  X,
  Copy,
  Download,
} from "lucide-react";
import { load, Store } from "@tauri-apps/plugin-store";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "./resizable.css";
import { TruncatedPath } from "./components/truncated-path";

let store: Store;

interface FileTreeNode {
  name: string;
  path: string;
  children?: FileTreeNode[];
  is_directory: boolean;
  selected?: boolean;
  tokenCount?: number;
  token_count?: number;
  parent?: string;
  dirPercentage?: number;
  isLoading?: boolean;
  selectionState?: "none" | "partial" | "all";
}

function App() {
  const [dir, setDir] = useState("");
  const [disableLineNumbers, setDisableLineNumbers] = useState(false);
  const [maxTokens, setMaxTokens] = useState("10000");
  const [verbose, setVerbose] = useState(true);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileTreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [totalTokens, setTotalTokens] = useState(0);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [groupByDirectory, setGroupByDirectory] = useState(true);
  const [processingTokens, setProcessingTokens] = useState(false);
  const [isPathExpanded, setIsPathExpanded] = useState(false);

  const [recentWorkspaces, setRecentWorkspaces] = useState<
    { name: string; path: string }[]
  >([]);

  // Initialize store and load recent workspaces on mount
  useEffect(() => {
    const initStore = async () => {
      store = await load("recent-workspaces.json");
      try {
        const saved = await store.get<{ name: string; path: string }[]>(
          "recent"
        );
        if (saved) {
          setRecentWorkspaces(saved);
        }
      } catch (err) {
        console.error("Error loading recent workspaces:", err);
      }
    };
    initStore();
  }, []);

  useEffect(() => {
    if (dir) {
      loadFileTree(dir);
      // Add to recent workspaces if not already there
      setRecentWorkspaces((prev) => {
        const workspaceName = dir.split("/").pop() || dir;
        if (!prev.some((workspace) => workspace.path === dir)) {
          const newWorkspaces = [
            { name: workspaceName, path: dir },
            ...prev,
          ].slice(0, 5); // Keep only last 5
          // Save to store if it's initialized
          if (store) {
            store.set("recent", newWorkspaces);
          }
          return newWorkspaces;
        }
        return prev;
      });
    }
  }, [dir]);

  useEffect(() => {
    calculateTotalTokens();
  }, [selectedFiles]);

  const loadFileTree = async (dirPath: string) => {
    try {
      setLoading(true);
      // Use the function without tokens for the initial load
      const tree = await invoke<FileTreeNode[]>("get_file_tree", {
        dirPath,
      });
      setFileTree(tree); // Use the tree directly, no mapping needed
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get all descendant files and directories from a node
  const getAllDescendants = (node: FileTreeNode): FileTreeNode[] => {
    let items: FileTreeNode[] = [node];
    if (node.children) {
      node.children.forEach((child) => {
        items = items.concat(getAllDescendants(child));
      });
    }
    return items;
  };

  // Helper function to find a node by path in the tree
  const findNodeByPath = (
    nodes: FileTreeNode[],
    path: string
  ): FileTreeNode | null => {
    for (const node of nodes) {
      if (node.path === path) {
        return node;
      }
      if (node.children) {
        const found = findNodeByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const handleFileSelect = async (node: FileTreeNode) => {
    setProcessingTokens(true); // Indicate loading
    try {
      if (node.is_directory) {
        // --- Directory Selection Logic ---

        // Find the corresponding node in the main fileTree to get its current children for path checking
        const displayNode = findNodeByPath(fileTree, node.path);
        if (!displayNode) {
          console.error(
            "Could not find directory node in display tree:",
            node.path
          );
          return;
        }

        const allDescendantPaths = getAllDescendants(displayNode).map(
          (d) => d.path
        );

        // Determine if we are selecting or deselecting based on current selection state
        const isSelecting = !selectedFiles.some(
          (sf) => allDescendantPaths.includes(sf.path) && !sf.is_directory
        );

        if (isSelecting) {
          // Fetch the subtree with tokens
          const subtreeWithTokens = await invoke<FileTreeNode[]>(
            "get_file_tree_with_tokens",
            { dirPath: node.path }
          );

          // Need to reconstruct the root node for getAllDescendants to work correctly on the result
          const rootSubtreeNode: FileTreeNode = {
            ...node,
            children: subtreeWithTokens,
          };
          const filesToAdd = getAllDescendants(rootSubtreeNode)
            .filter((n) => !n.is_directory)
            .map((n) => ({ ...n, tokenCount: n.token_count })); // Map token_count

          // Add new files, avoiding duplicates
          setSelectedFiles((prev) => {
            const existingPaths = new Set(prev.map((f) => f.path));
            const uniqueNewFiles = filesToAdd.filter(
              (f) => !existingPaths.has(f.path)
            );
            return [...prev, ...uniqueNewFiles];
          });
        } else {
          // Deselecting: remove all descendants found in the display tree
          setSelectedFiles((prev) =>
            prev.filter((sf) => !allDescendantPaths.includes(sf.path))
          );
        }
      } else {
        // --- File Selection Logic ---
        const isCurrentlySelected = selectedFiles.some(
          (f) => f.path === node.path
        );

        if (isCurrentlySelected) {
          // Remove file
          setSelectedFiles((prev) => prev.filter((f) => f.path !== node.path));
        } else {
          // Add file (calculateTotalTokens useEffect will handle fetching tokens if needed)
          setSelectedFiles((prev) => [...prev, node]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessingTokens(false);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const calculateTotalTokens = async () => {
    if (selectedFiles.length === 0) {
      setTotalTokens(0);
      return;
    }

    try {
      // First sum up all files that already have token counts
      let total = selectedFiles.reduce((sum, file) => {
        if (!file.is_directory && file.tokenCount !== undefined) {
          return sum + file.tokenCount;
        }
        return sum;
      }, 0);

      // Then calculate tokens for files that don't have them yet
      const filesNeedingCalculation = selectedFiles.filter(
        (file) =>
          !file.is_directory && file.tokenCount === undefined && !file.isLoading
      );

      if (filesNeedingCalculation.length > 0) {
        // Calculate tokens in batches of 5
        const batchSize = 5;
        for (let i = 0; i < filesNeedingCalculation.length; i += batchSize) {
          const batch = filesNeedingCalculation.slice(i, i + batchSize);
          const counts = await Promise.all(
            batch.map((file) =>
              invoke<number>("calculate_file_tokens", { filePath: file.path })
            )
          );

          // Update the selected files with new token counts
          setSelectedFiles((prev) =>
            prev.map((file) => {
              const batchIndex = batch.findIndex((f) => f.path === file.path);
              if (batchIndex !== -1) {
                return { ...file, tokenCount: counts[batchIndex] };
              }
              return file;
            })
          );

          // Add to total
          total += counts.reduce((sum, count) => sum + count, 0);
        }
      }

      setTotalTokens(total);
    } catch (err) {
      console.error("Error calculating tokens:", err);
    }
  };

  const calculateDirectorySelectionState = (
    node: FileTreeNode
  ): "none" | "partial" | "all" => {
    if (!node.is_directory || !node.children) return "none";

    // Get all descendants (including nested directories)
    const getAllDescendants = (node: FileTreeNode): FileTreeNode[] => {
      let items: FileTreeNode[] = [node];
      if (node.children) {
        node.children.forEach((child) => {
          items = items.concat(getAllDescendants(child));
        });
      }
      return items;
    };

    const allDescendants = getAllDescendants(node);

    // Count selected files (not directories) among all descendants
    const selectedDescendants = allDescendants.filter(
      (f) =>
        !f.is_directory &&
        selectedFiles.some((s: FileTreeNode) => s.path === f.path)
    );
    const totalFiles = allDescendants.filter((f) => !f.is_directory);

    if (selectedDescendants.length === 0) return "none";
    if (selectedDescendants.length === totalFiles.length) return "all";
    return "partial";
  };

  const renderFileTree = (nodes: FileTreeNode[], level = 0) => {
    return nodes.map((node) => {
      const isFolder = node.is_directory;
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedFiles.some((f) => f.path === node.path);
      const selectedFile = selectedFiles.find((f) => f.path === node.path);
      const isLoading = selectedFile?.isLoading;
      const selectionState = isFolder
        ? calculateDirectorySelectionState(node)
        : undefined;

      return (
        <div key={node.path} style={{ marginLeft: `${level * 16}px` }}>
          <div className="flex items-center py-1 pl-2 cursor-pointer text-sm gap-2">
            {isFolder && (
              <div
                onClick={() => toggleFolder(node.path)}
                className="cursor-pointer"
              >
                <ChevronRight
                  size={16}
                  className={`transition-transform duration-200 ${
                    isExpanded ? "transform rotate-90" : ""
                  }`}
                />
              </div>
            )}
            {!isFolder && <div className="w-4" />}
            <input
              type="checkbox"
              checked={isFolder ? selectionState === "all" : isSelected}
              ref={(el) => {
                if (el && isFolder) {
                  el.indeterminate = selectionState === "partial";
                }
              }}
              onChange={() => handleFileSelect(node)}
              onClick={(e) => e.stopPropagation()}
              className={`w-4 h-4 border border-gray-600 rounded bg-${
                isSelected || selectionState === "all" ? "blue-500" : "gray-700"
              } inline-block align-middle relative cursor-pointer`}
            />
            <div
              onClick={() => {
                if (isFolder) toggleFolder(node.path);
              }}
              className={`flex items-center ${
                isFolder ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <span className="mr-1 w-4 inline-block text-center">
                {isFolder ? (
                  isExpanded ? (
                    <FolderOpen size={16} />
                  ) : (
                    <Folder size={16} />
                  )
                ) : (
                  <FileText size={16} />
                )}
              </span>
              <span>{node.name}</span>
            </div>
            {!isFolder && (
              <span className="ml-2 text-sm text-gray-500">
                {isLoading ? (
                  <span className="animate-pulse">Calculating...</span>
                ) : node.tokenCount !== undefined ? (
                  `${node.tokenCount} tokens`
                ) : null}
              </span>
            )}
          </div>

          {isFolder &&
            isExpanded &&
            node.children &&
            renderFileTree(node.children, level + 1)}
        </div>
      );
    });
  };

  const resetStates = () => {
    setSelectedFiles([]);
    setExpandedFolders(new Set());
    setFileTree([]);
    setTotalTokens(0);
    setError(null);
    setDir("");
  };

  const handleChooseDirectory = async () => {
    try {
      const selected = await open({ directory: true });
      if (selected) {
        resetStates();
        setDir(selected as string);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCopySelectedFiles = async () => {
    try {
      const fileData = selectedFiles
        .map(
          (file) =>
            `${file.path}: ${
              file.tokenCount !== undefined
                ? (file.tokenCount / 1000).toFixed(2) + "k"
                : "unknown"
            } tokens`
        )
        .join("\n");

      const data = `Selected Files (${selectedFiles.length})
Total Tokens: ${(totalTokens / 1000).toFixed(2)}k
${fileData}`;

      await navigator.clipboard.writeText(data);
    } catch (err) {
      console.error("Failed to copy:", err);
      setError("Failed to copy to clipboard");
    }
  };

  const handleSort = () => {
    setSelectedFiles((prev) => {
      const newDirection = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(newDirection);

      return [...prev].sort((a, b) => {
        const tokenA = a.tokenCount || 0;
        const tokenB = b.tokenCount || 0;

        return newDirection === "asc" ? tokenA - tokenB : tokenB - tokenA;
      });
    });
  };

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

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = {
        dir,
        max_tokens: maxTokens ? Number(maxTokens) : null,
        disable_line_numbers: disableLineNumbers,
        verbose,
      };
      if (!dir) {
        throw new Error("Directory path cannot be empty.");
      }
      const result = await invoke<string>("run_codefetch", { cfg: config });

      // Create and download the markdown file
      const blob = new Blob([result], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "codebase-report.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDir("");
    setSelectedFiles([]);
    setExpandedFolders(new Set());
    setFileTree([]);
    setTotalTokens(0);
    setError(null);
  };

  // Render workspace selector view when no directory is selected
  const renderWorkspaceSelector = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-800 text-white p-5 text-center">
        <h2>Codebases</h2>
        <p className="text-sm my-2.5 mb-5">
          Open a folder to start analyzing your codebase.
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleChooseDirectory}
            className="flex items-center gap-2 bg-gray-700 text-white border border-gray-600 p-2 rounded cursor-pointer"
          >
            <span>📁</span> Open Folder
          </button>
        </div>

        {recentWorkspaces.length > 0 && (
          <div className="mt-10 w-full">
            <h3 className="text-sm text-gray-400 text-left">
              Recent workspaces
            </h3>
            <div className="mt-2.5">
              {recentWorkspaces.map((workspace, index) => (
                <div
                  key={index}
                  className="py-2 text-blue-500 cursor-pointer text-left"
                  onClick={() => {
                    resetStates();
                    setDir(workspace.path);
                  }}
                >
                  {workspace.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      <div className="flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="flex-1">
          {/* File Navigation Sidebar */}
          <Panel
            defaultSize={25}
            minSize={15}
            maxSize={50}
            className="overflow-hidden"
          >
            <div className="h-full border-r border-gray-600 overflow-y-auto bg-gray-800 text-white">
              {!dir ? (
                renderWorkspaceSelector()
              ) : (
                <div className="flex flex-col h-full">
                  {/* Fixed Header */}
                  <div className="p-2.5 border-b border-gray-600">
                    <div className="flex items-center gap-2">
                      <h3>Files</h3>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-2.5">
                    {fileTree.length > 0 ? (
                      <div>{renderFileTree(fileTree)}</div>
                    ) : (
                      <p>Loading files...</p>
                    )}
                  </div>

                  {/* Fixed Footer */}
                  <div className="p-2.5 border-t border-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        {selectedFiles.filter((f) => !f.is_directory).length}{" "}
                        files selected
                      </span>
                      <span className="text-sm text-gray-400">
                        {totalTokens < 0 ? "" : "-"}
                        {Math.abs(totalTokens / 1000).toFixed(2)}k Tokens
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />

          {/* Main Content */}
          <Panel
            defaultSize={75}
            minSize={50}
            maxSize={85}
            className="overflow-hidden"
          >
            <div className="h-full flex flex-col bg-gray-900">
              {dir && (
                <>
                  <div className="flex items-center justify-center gap-2 text-gray-400 py-2">
                    <div className="flex items-center gap-2">
                      <TruncatedPath path={dir} />
                      <button
                        onClick={handleClose}
                        className="p-1 rounded cursor-pointer bg-gray-700 hover:bg-gray-600"
                        title="Close directory"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4">
                    <div className="bg-gray-800 text-white rounded-lg p-4 shadow-lg">
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
                          <span className="mr-2.5">
                            {selectedFiles.length} files
                          </span>
                          <span>
                            {totalTokens < 0 ? "" : "-"}
                            {Math.abs(totalTokens / 1000).toFixed(2)}k Tokens
                          </span>
                        </div>
                      </div>

                      <div className="mb-5">
                        {getGroupedFiles().map((file, index, files) => {
                          const isDirectoryHeader =
                            file.is_directory &&
                            file.dirPercentage !== undefined;
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
                                  isDirectoryHeader
                                    ? "bg-gray-800"
                                    : "bg-gray-700"
                                } rounded ${
                                  isDirectoryHeader
                                    ? "border-l-4 border-blue-500"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center text-sm">
                                  <span
                                    className={`mr-2 ${
                                      isDirectoryHeader
                                        ? "text-blue-500"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    {isDirectoryHeader ? "📁" : "📄"}
                                  </span>
                                  <span>
                                    {isDirectoryHeader
                                      ? `${file.name}/`
                                      : file.name}
                                  </span>
                                </div>
                                <div>
                                  {file.tokenCount !== undefined && (
                                    <span
                                      className={`${
                                        isDirectoryHeader
                                          ? "text-blue-500"
                                          : "text-gray-300"
                                      }`}
                                    >
                                      -{(file.tokenCount / 1000).toFixed(2)}k
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

                    {error && (
                      <div className="text-red-500 mt-2.5">
                        <strong>Error:</strong> {error}
                      </div>
                    )}

                    {loading && (
                      <p className="text-white">Generating report...</p>
                    )}
                  </div>

                  <div className="p-2.5 border-t border-gray-600 text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleCopySelectedFiles}
                        className="flex items-center bg-transparent border border-gray-600 rounded text-white p-1.5 cursor-pointer gap-2"
                      >
                        <Copy size={16} />
                        Copy to clipboard
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={handleExport}
                          disabled={loading}
                          className="flex items-center bg-transparent border border-gray-600 rounded text-white p-1.5 cursor-pointer gap-2"
                        >
                          <Download size={16} />
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;
