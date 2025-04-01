import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Folder, FolderOpen, FileText, ChevronRight } from "lucide-react";
import { load, Store } from "@tauri-apps/plugin-store";

let store: Store;

interface FileTreeNode {
  name: string;
  path: string;
  children?: FileTreeNode[];
  is_directory: boolean;
  selected?: boolean;
  tokenCount?: number;
  parent?: string;
  dirPercentage?: number;
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
      const tree = await invoke<FileTreeNode[]>("get_file_tree", { dirPath });
      setFileTree(tree);
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

    // Helper function to calculate tokens for a file
    const calculateTokensForFile = async (file: FileTreeNode) => {
      if (!file.is_directory && !file.tokenCount) {
        try {
          const count = await invoke<number>("calculate_file_tokens", {
            filePath: file.path,
          });
          return { ...file, tokenCount: count };
        } catch (err) {
          console.error(`Error calculating tokens for ${file.path}:`, err);
          return file;
        }
      }
      return file;
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
      } else {
        // Add self and all descendants that aren't already selected
        const newItems = allDescendants.filter(
          (f) => !prevSelected.some((p) => p.path === f.path)
        );

        // First update UI with files without token counts
        newSelection = [...prevSelected, ...newItems];
        setSelectedFiles(newSelection);

        // Then calculate tokens in the background
        setProcessingTokens(true);
        try {
          const itemsWithTokens = await Promise.all(
            newItems.map((item) => calculateTokensForFile(item))
          );
          // Update the selection with calculated tokens
          setSelectedFiles((prev) => {
            const withoutNewItems = prev.filter(
              (f) => !newItems.some((n) => n.path === f.path)
            );
            return [...withoutNewItems, ...itemsWithTokens];
          });
        } finally {
          setProcessingTokens(false);
        }
        return; // Early return since we're handling updates separately
      }
    } else {
      // Handle single file selection/deselection
      if (isCurrentlySelected) {
        newSelection = prevSelected.filter((f) => f.path !== node.path);
      } else {
        setProcessingTokens(true);
        try {
          const nodeWithTokens = await calculateTokensForFile(node);
          newSelection = [...prevSelected, nodeWithTokens];
        } finally {
          setProcessingTokens(false);
        }
      }
    }

    setSelectedFiles(newSelection);
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
      let total = 0;
      for (const file of selectedFiles) {
        if (!file.is_directory) {
          // Only calculate for files that don't have a token count yet
          if (!file.tokenCount) {
            const count = await invoke<number>("calculate_file_tokens", {
              filePath: file.path,
            });
            file.tokenCount = count;
          }
          total += file.tokenCount || 0;
        }
      }
      setTotalTokens(total);
    } catch (err) {
      console.error("Error calculating tokens:", err);
    }
  };

  const renderFileTree = (nodes: FileTreeNode[], level = 0) => {
    return nodes.map((node) => {
      const isFolder = node.is_directory;
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedFiles.some((f) => f.path === node.path);

      return (
        <div key={node.path} style={{ marginLeft: `${level * 16}px` }}>
          <div className="flex items-center py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleFileSelect(node)}
              onClick={(e) => e.stopPropagation()}
              className={`mr-1 w-4 h-4 border border-gray-600 rounded bg-${
                isSelected ? "blue-500" : "gray-700"
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
            {!isFolder && node.tokenCount !== undefined && (
              <span className="ml-2 text-sm text-gray-500">
                {node.tokenCount} tokens
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

  const handleChooseDirectory = async () => {
    try {
      const selected = await open({ directory: true });
      if (selected) {
        setDir(selected as string);
        setSelectedFiles([]);
        setExpandedFolders(new Set());
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
                  onClick={() => setDir(workspace.path)}
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
        {/* File Navigation Sidebar */}
        <div className="w-75 border-r border-gray-600 overflow-y-auto bg-gray-800 text-white h-full">
          {!dir ? (
            renderWorkspaceSelector()
          ) : (
            <div className="p-2.5 h-full">
              <div className="mb-2.5 flex items-center gap-2">
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
                {dir && <p className="text-sm break-all mt-2">{dir}</p>}
              </div>

              {fileTree.length > 0 ? (
                <div>
                  <h3>Files</h3>
                  {renderFileTree(fileTree)}
                </div>
              ) : (
                <p>Loading files...</p>
              )}

              {selectedFiles.length > 0 && (
                <div className="mt-5">
                  <h3>Selected Files ({selectedFiles.length})</h3>
                  <div className="flex items-center">
                    <span className="mr-2.5">{selectedFiles.length} files</span>
                    <span>
                      {totalTokens < 0 ? "" : "-"}
                      {Math.abs(totalTokens / 1000).toFixed(2)}k Tokens
                    </span>
                    {processingTokens && (
                      <span className="ml-2 text-blue-500 text-sm animate-pulse">
                        Calculating...
                      </span>
                    )}
                  </div>
                  <div className="max-h-50 overflow-y-auto">
                    {selectedFiles.map((file) => (
                      <div key={file.path} className="flex justify-between">
                        <span>{file.name}</span>
                        <span>{file.tokenCount || "..."}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-5 overflow-y-auto bg-gray-900 h-full">
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
                    <span className="mr-2.5">{selectedFiles.length} files</span>
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
                            isDirectoryHeader ? "bg-gray-800" : "bg-gray-700"
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
                              {isDirectoryHeader ? `${file.name}/` : file.name}
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

              {loading && <p className="text-white">Generating report...</p>}

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
      </div>
    </div>
  );
}

export default App;
