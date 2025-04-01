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
  Search,
  Settings,
} from "lucide-react";
import { load, Store } from "@tauri-apps/plugin-store";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "./resizable.css";
import { FolderSummary } from "./components/FolderSummary";
import { SelectedFiles } from "./components/SelectedFiles";
import { FileTreeNode } from "./types";
import { TreeMap } from "./components/TreeMap";

let store: Store;

// Utility function to format token counts consistently
const formatTokens = (tokens: number, includeK = true): string => {
  const absTokens = Math.abs(tokens);
  const formatted = (absTokens / 1000).toFixed(2);
  return `~${formatted}${includeK ? "k" : ""}`;
};

const basename = (path: string) => {
  return path.split(/[/\\]/).pop();
};

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

  const [copying, setCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [activeView, setActiveView] = useState("file");

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
          <div className="flex items-center py-1 pl-2 cursor-pointer text-sm gap-2 overflow-hidden">
            {isFolder && (
              <div
                onClick={() => toggleFolder(node.path)}
                className="cursor-pointer flex-shrink-0"
              >
                <ChevronRight
                  size={16}
                  className={`transition-transform duration-200 ${
                    isExpanded ? "transform rotate-90" : ""
                  }`}
                />
              </div>
            )}
            {!isFolder && <div className="w-4 flex-shrink-0" />}
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
              className={`w-4 h-4 inline-block align-middle relative cursor-pointer flex-shrink-0 ${
                isSelected || selectionState === "all"
                  ? "bg-blue-500"
                  : "bg-gray-800"
              }`}
            />
            <div
              onClick={() => {
                if (isFolder) toggleFolder(node.path);
              }}
              className={`flex items-center ${
                isFolder ? "cursor-pointer" : "cursor-default"
              } min-w-0 flex-shrink overflow-hidden`}
            >
              <span className="mr-1 w-4 inline-block text-center flex-shrink-0">
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
              <span className="text-gray-300 truncate">{node.name}</span>
            </div>
            {!isFolder && (
              <span className="ml-2 text-sm text-gray-400 flex-shrink-0">
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

  // New function to handle the copy to clipboard with tree structure
  const handleCopyWithTree = async () => {
    setLoading(true);
    setCopying(true);
    setError(null);
    try {
      if (!dir) {
        throw new Error("Directory path cannot be empty.");
      }

      // Get the paths of all selected files
      const selectedFilePaths = selectedFiles
        .filter((file) => !file.is_directory)
        .map((file) => file.path);

      if (selectedFilePaths.length === 0) {
        throw new Error("No files selected to copy.");
      }

      // Call the Rust command to directly copy to clipboard
      await invoke("copy_files_with_tree_to_clipboard", {
        dirPath: dir,
        selectedFilePaths: selectedFilePaths,
      });

      // Show success feedback
      setCopySuccess(true);
      const originalError = error;
      setError("Copied to clipboard!");
      setTimeout(() => {
        setCopySuccess(false);
        setError(originalError);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setCopying(false);
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
            <div className="h-full overflow-y-auto bg-gray-800 text-white">
              {!dir ? (
                renderWorkspaceSelector()
              ) : (
                <div className="flex flex-col h-full space-y-2">
                  {/* Fixed Header */}
                  <div className="p-2.5 border-b border-gray-600 pl-6 space-y-1">
                    <h3>{basename(dir)}</h3>
                    <div className="pl-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          {selectedFiles.filter((f) => !f.is_directory).length}{" "}
                          files selected
                        </span>
                        <span className="text-sm text-orange-300">
                          {formatTokens(totalTokens)} Tokens
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="relative">
                      <input
                        placeholder="Filter"
                        className="w-full px-2 py-1 pr-8 rounded bg-gray-700 border border-gray-600 text-xs"
                      />
                      <Settings
                        size={14}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden pl-1 mt-1">
                    {fileTree.length > 0 ? (
                      <div>{renderFileTree(fileTree)}</div>
                    ) : (
                      <p>Loading files...</p>
                    )}
                  </div>

                  {/* Fixed Footer */}
                </div>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-900 hover:bg-gray-700 transition-colors" />

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
                  {/* Git-like top bar */}
                  <div className="flex relative border-b border-gray-700 bg-gray-800 text-xs text-gray-300 justify-between">
                    <div className="flex items-center h-full">
                      <div className="flex flex-col items-center justify-center px-3 py-2 border-r border-gray-700 cursor-pointer hover:bg-gray-700">
                        <span className="mb-1">
                          <FolderOpen size={16} />
                        </span>
                        <span>Quick Open</span>
                      </div>
                      <div
                        className={`flex flex-col items-center justify-center px-3 py-2 border-r border-gray-700 cursor-pointer hover:bg-gray-700 ${
                          copying ? "bg-gray-600" : ""
                        }`}
                        onClick={handleCopyWithTree}
                      >
                        <span className="mb-1">
                          {loading ? (
                            <span className="animate-spin block w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full" />
                          ) : copySuccess ? (
                            <div className="text-green-500">✓</div>
                          ) : (
                            <Copy size={16} />
                          )}
                        </span>
                        <span>Copy</span>
                      </div>
                      <div className="flex flex-col items-center justify-center px-3 py-2 border-r border-gray-700 cursor-pointer hover:bg-gray-700">
                        <span className="mb-1">
                          <Download size={16} />
                        </span>
                        <span>Export</span>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center py-2 absolute left-1/2 -translate-x-1/2 h-full">
                      <div className="flex items-center gap-2 text-gray-400">
                        <p>{basename(dir)}</p>
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
                      <div className="flex rounded overflow-hidden border border-gray-600 mx-2">
                        <button
                          className={`px-3 py-1 text-xs ${
                            activeView === "file"
                              ? "bg-gray-600 text-white"
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          }`}
                          onClick={() => setActiveView("file")}
                        >
                          File View
                        </button>
                        <button
                          className={`px-3 py-1 text-xs border-l border-gray-600 ${
                            activeView === "directory"
                              ? "bg-gray-600 text-white"
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          }`}
                          onClick={() => setActiveView("directory")}
                        >
                          Directory View
                        </button>
                        <button
                          className={`px-3 py-1 text-xs border-l border-gray-600 ${
                            activeView === "tree"
                              ? "bg-gray-600 text-white"
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          }`}
                          onClick={() => setActiveView("tree")}
                        >
                          Tree View
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4">
                    <div className="flex gap-4 h-full">
                      {activeView === "file" && (
                        <SelectedFiles
                          selectedFiles={selectedFiles}
                          dir={dir}
                          totalTokens={totalTokens}
                          handleSort={handleSort}
                          sortDirection={sortDirection}
                          groupByDirectory={groupByDirectory}
                        />
                      )}
                      {activeView === "directory" && (
                        <FolderSummary
                          selectedFiles={selectedFiles}
                          dir={dir}
                          totalTokens={totalTokens}
                        />
                      )}
                      {activeView === "tree" && (
                        <TreeMap
                          selectedFiles={selectedFiles}
                          totalTokens={totalTokens}
                        />
                      )}
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
