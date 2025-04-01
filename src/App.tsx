import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Folder, FolderOpen, FileText, ChevronRight } from "lucide-react";
import { load, Store } from "@tauri-apps/plugin-store";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "./resizable.css";

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
  const [showChat, setShowChat] = useState(false);
  const [processingTokens, setProcessingTokens] = useState(false);

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
      const tree = await invoke<FileTreeNode[]>("get_file_tree_with_tokens", {
        dirPath,
      });
      // Map the token_count from Rust to tokenCount for the frontend
      const mappedTree = tree.map((node) => ({
        ...node,
        tokenCount: node.token_count,
      }));
      setFileTree(mappedTree);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (node: FileTreeNode) => {
    const prevSelected = [...selectedFiles];
    const isCurrentlySelected = prevSelected.some((f) => f.path === node.path);

    // Helper function to get all descendant files and directories
    const getAllDescendants = (node: FileTreeNode): FileTreeNode[] => {
      let items: FileTreeNode[] = [node];
      if (node.children) {
        node.children.forEach((child) => {
          items = items.concat(getAllDescendants(child));
        });
      }
      return items;
    };

    let newSelection: FileTreeNode[];

    // If directory is being selected/deselected
    if (node.is_directory) {
      const allDescendants = getAllDescendants(node);
      if (isCurrentlySelected) {
        // Remove self and all descendants
        newSelection = prevSelected.filter(
          (f) => !allDescendants.some((d) => d.path === f.path)
        );
        setSelectedFiles(newSelection);
        return;
      } else {
        // Add self and all descendants that aren't already selected
        const newItems = allDescendants.filter(
          (f) => !prevSelected.some((p) => p.path === f.path)
        );
        setSelectedFiles([...prevSelected, ...newItems]);
        return;
      }
    } else {
      // Handle single file selection/deselection
      if (isCurrentlySelected) {
        newSelection = prevSelected.filter((f) => f.path !== node.path);
        setSelectedFiles(newSelection);
        return;
      } else {
        setSelectedFiles([...prevSelected, node]);
      }
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
          <div className="flex items-center py-1 cursor-pointer">
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
              className={`mr-1 w-4 h-4 border border-gray-600 rounded bg-${
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
              {isFolder && (
                <ChevronRight
                  size={16}
                  className={`mr-1 transition-transform duration-200 ${
                    isExpanded ? "transform rotate-90" : ""
                  }`}
                />
              )}
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
    setShowChat(false);
    setProcessingTokens(false);
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
        const dirPath = file.path.substring(0, file.path.lastIndexOf("/"));
        const parentDir = dirPath.split("/").pop() || "";
        const groupKey = parentDir;

        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }

        groups[groupKey].push(file);
      });

    return Object.entries(groups).flatMap(([dir, files]) => {
      // Total tokens for this directory
      const dirTokens = files.reduce(
        (sum, file) => sum + (file.tokenCount || 0),
        0
      );
      const dirPercentage =
        totalTokens > 0 ? Math.round((dirTokens / totalTokens) * 100) : 0;

      // Create a "directory header" node
      const dirNode: FileTreeNode = {
        name: dir,
        path: `${dir}_header`,
        is_directory: true,
        tokenCount: dirTokens,
        dirPercentage,
        children: files,
      };

      return [dirNode, ...files];
    });
  };

  const handleChatToggle = () => {
    setShowChat(!showChat);
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
        <h2>Workspaces</h2>
        <p className="text-sm my-2.5 mb-5">
          Open or drag a folder to create a new workspace.
        </p>

        <div className="flex gap-2.5">
          <button
            onClick={handleChooseDirectory}
            className="flex items-center gap-2 bg-gray-700 text-white border border-gray-600 p-2 rounded cursor-pointer"
          >
            <span>📁</span> Open Folder
          </button>

          <button className="bg-gray-700 text-white border border-gray-600 p-2 rounded cursor-pointer">
            <span>🔄</span>
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
                      <button
                        onClick={handleChooseDirectory}
                        disabled={loading}
                        className="bg-gray-700 text-white border border-gray-600 p-2 rounded cursor-pointer"
                      >
                        Choose Directory
                      </button>
                      <button
                        onClick={handleClose}
                        className="bg-red-600 hover:bg-red-700 text-white border border-red-700 p-2 rounded cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                    {dir && <p className="text-sm break-all mt-2">{dir}</p>}
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-2.5">
                    {fileTree.length > 0 ? (
                      <div>
                        <h3>Files</h3>
                        {renderFileTree(fileTree)}
                      </div>
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
            <div className="h-full p-5 overflow-y-auto bg-gray-900">
              {dir && (
                <>
                  <div className="bg-gray-800 text-white rounded-lg p-2.5 shadow-lg">
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
                                isDirectoryHeader
                                  ? "bg-gray-800"
                                  : "bg-gray-700"
                              } rounded ${
                                isDirectoryHeader
                                  ? "border-l-4 border-blue-500"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center">
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

                    <div className="flex justify-between items-center border-t border-gray-600 pt-2.5">
                      <button
                        onClick={handleCopySelectedFiles}
                        className="flex items-center bg-transparent border border-gray-600 rounded text-white p-1.5 cursor-pointer"
                      >
                        <span className="mr-1">📋</span> Copy
                      </button>
                      <div>
                        Approx. Token Total: -{(totalTokens / 1000).toFixed(2)}k
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleExport}
                          disabled={loading}
                          className="flex items-center bg-transparent border border-gray-600 rounded text-white p-1.5 cursor-pointer"
                        >
                          <span className="mr-1">📥</span> Export
                        </button>
                        <button
                          onClick={handleChatToggle}
                          className={`flex items-center ${
                            showChat ? "bg-blue-500" : "bg-transparent"
                          } border border-gray-600 rounded text-white p-1.5 cursor-pointer`}
                        >
                          <span className="mr-1">💬</span> Chat
                        </button>
                      </div>
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

                  {showChat && (
                    <div className="mt-5 bg-gray-800 p-4 rounded-lg text-white">
                      <h3>Chat</h3>
                      <div className="bg-gray-700 rounded p-2.5 min-h-50">
                        <p>Chat with your codebase using the selected files.</p>
                      </div>
                      <div className="flex mt-2.5">
                        <input
                          type="text"
                          placeholder="Ask a question about your code..."
                          className="flex-1 p-2 rounded-l border-none bg-gray-600 text-white"
                        />
                        <button className="p-2 bg-blue-500 text-white border-none rounded-r cursor-pointer">
                          Send
                        </button>
                      </div>
                    </div>
                  )}
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
