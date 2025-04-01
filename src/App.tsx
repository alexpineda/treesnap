import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Folder, FolderOpen, FileText } from "lucide-react";

interface FileTreeNode {
  name: string;
  path: string;
  children?: FileTreeNode[];
  isDirectory: boolean;
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
  const [recentWorkspaces, setRecentWorkspaces] = useState<
    { name: string; path: string }[]
  >([]);

  useEffect(() => {
    if (dir) {
      loadFileTree(dir);
      // Add to recent workspaces if not already there
      setRecentWorkspaces((prev) => {
        const workspaceName = dir.split("/").pop() || dir;
        if (!prev.some((workspace) => workspace.path === dir)) {
          return [{ name: workspaceName, path: dir }, ...prev].slice(0, 5); // Keep only last 5
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

  const handleFileSelect = (node: FileTreeNode) => {
    setSelectedFiles((prevSelected) => {
      // If already selected, remove from selection
      if (prevSelected.some((f) => f.path === node.path)) {
        return prevSelected.filter((f) => f.path !== node.path);
      }
      // Add to selection regardless of file type
      return [...prevSelected, node];
    });
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
        if (!file.isDirectory) {
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
      const isFolder = node.isDirectory;
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedFiles.some((f) => f.path === node.path);

      return (
        <div key={node.path} style={{ marginLeft: `${level * 20}px` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "4px 0",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleFileSelect(node)}
              onClick={(e) => e.stopPropagation()}
              style={{
                marginRight: "5px",
                appearance: "none",
                width: "16px",
                height: "16px",
                border: "1px solid #555",
                borderRadius: "3px",
                backgroundColor: isSelected ? "#4a9eff" : "#333",
                display: "inline-block",
                verticalAlign: "middle",
                position: "relative",
                cursor: "pointer",
              }}
            />
            <div
              onClick={() => {
                if (isFolder) toggleFolder(node.path);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                cursor: isFolder ? "pointer" : "default",
              }}
            >
              <span
                style={{
                  marginRight: "5px",
                  width: "1em",
                  display: "inline-block",
                  textAlign: "center",
                }}
              >
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
              <span
                style={{ marginLeft: "10px", fontSize: "0.8em", color: "#666" }}
              >
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

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setOutput("");
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
      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
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
    if (!groupByDirectory) return selectedFiles;

    const groups: Record<string, FileTreeNode[]> = {};

    selectedFiles.forEach((file) => {
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
      const dirPercentage = totalTokens
        ? Math.round((dirTokens / totalTokens) * 100)
        : 0;

      // Create a "directory header" node
      const dirNode: FileTreeNode = {
        name: dir,
        path: `${dir}_header`,
        isDirectory: true,
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

  // Render workspace selector view when no directory is selected
  const renderWorkspaceSelector = () => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          backgroundColor: "#222",
          color: "white",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h2>Workspaces</h2>
        <p style={{ fontSize: "14px", margin: "10px 0 20px" }}>
          Open or drag a folder to create a new workspace.
        </p>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleChooseDirectory}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#333",
              color: "white",
              border: "1px solid #555",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            <span>📁</span> Open Folder
          </button>

          <button
            style={{
              backgroundColor: "#333",
              color: "white",
              border: "1px solid #555",
              padding: "8px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            <span>🔄</span>
          </button>
        </div>

        {recentWorkspaces.length > 0 && (
          <div style={{ marginTop: "40px", width: "100%" }}>
            <h3 style={{ fontSize: "14px", color: "#999", textAlign: "left" }}>
              Recent workspaces
            </h3>
            <div style={{ marginTop: "10px" }}>
              {recentWorkspaces.map((workspace, index) => (
                <div
                  key={index}
                  style={{
                    padding: "8px 0",
                    color: "#4a9eff",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
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
    <div style={{ display: "flex", height: "100vh", flexDirection: "column" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* File Navigation Sidebar */}
        <div
          style={{
            width: "300px",
            borderRight: "1px solid #444",
            overflowY: "auto",
            backgroundColor: "#222",
            color: "white",
          }}
        >
          {!dir ? (
            renderWorkspaceSelector()
          ) : (
            <div style={{ padding: "10px" }}>
              <div style={{ marginBottom: "10px" }}>
                <button
                  onClick={handleChooseDirectory}
                  disabled={loading}
                  style={{
                    backgroundColor: "#333",
                    color: "white",
                    border: "1px solid #555",
                    padding: "8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Choose Directory
                </button>
                {dir && (
                  <p style={{ fontSize: "0.8em", wordBreak: "break-all" }}>
                    {dir}
                  </p>
                )}
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
                <div style={{ marginTop: "20px" }}>
                  <h3>Selected Files ({selectedFiles.length})</h3>
                  <p>Total Tokens: {totalTokens}</p>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {selectedFiles.map((file) => (
                      <div
                        key={file.path}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
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
        <div
          style={{
            flex: 1,
            padding: 20,
            overflowY: "auto",
            backgroundColor: "#1e1e1e",
          }}
        >
          {dir && (
            <>
              <div
                style={{
                  backgroundColor: "#222",
                  color: "white",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Selected Files</h3>
                    <button
                      onClick={handleSort}
                      style={{
                        marginLeft: "8px",
                        background: "transparent",
                        border: "none",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ marginRight: "2px" }}>
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>{" "}
                      Sort
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ marginRight: "10px" }}>
                      {selectedFiles.length} files
                    </span>
                    <span>
                      {totalTokens < 0 ? "" : "-"}
                      {Math.abs(totalTokens / 1000).toFixed(2)}k Tokens
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  {getGroupedFiles().map((file, index, files) => {
                    const isDirectoryHeader =
                      file.isDirectory && file.dirPercentage !== undefined;
                    const isFirstFileInGroup =
                      isDirectoryHeader &&
                      index < files.length - 1 &&
                      !files[index + 1].isDirectory;

                    return (
                      <div key={file.path}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "10px",
                            margin: isDirectoryHeader ? "10px 0 0 0" : "2px 0",
                            backgroundColor: isDirectoryHeader
                              ? "#222"
                              : "#333",
                            borderRadius: "4px",
                            borderLeft: isDirectoryHeader
                              ? "4px solid #4a9eff"
                              : "none",
                          }}
                        >
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <span
                              style={{
                                marginRight: "8px",
                                color: isDirectoryHeader ? "#4a9eff" : "#ccc",
                              }}
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
                                style={{
                                  color: isDirectoryHeader ? "#4a9eff" : "#ccc",
                                }}
                              >
                                -{(file.tokenCount / 1000).toFixed(2)}k
                                {isDirectoryHeader &&
                                  file.dirPercentage !== undefined &&
                                  ` (${file.dirPercentage}%)`}
                                {!isDirectoryHeader &&
                                  ` (${Math.round(
                                    (file.tokenCount / totalTokens) * 100
                                  )}%)`}
                              </span>
                            )}
                          </div>
                        </div>
                        {isFirstFileInGroup && (
                          <div
                            style={{
                              height: "1px",
                              backgroundColor: "#333",
                              margin: "0 0 0 20px",
                            }}
                          ></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #444",
                    paddingTop: "10px",
                  }}
                >
                  <button
                    onClick={handleCopySelectedFiles}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "transparent",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      color: "white",
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ marginRight: "5px" }}>📋</span> Copy
                  </button>
                  <div>
                    Approx. Token Total: -{(totalTokens / 1000).toFixed(2)}k
                  </div>
                  <button
                    onClick={handleChatToggle}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: showChat ? "#4a9eff" : "transparent",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      color: "white",
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ marginRight: "5px" }}>💬</span> Chat
                  </button>
                </div>
              </div>

              <button onClick={handleRun} disabled={loading}>
                {loading ? "Running..." : "Run Codefetch"}
              </button>

              {error && (
                <div style={{ color: "red", marginTop: 10 }}>
                  <strong>Error:</strong> {error}
                </div>
              )}

              {loading && (
                <p style={{ color: "white" }}>Processing directory...</p>
              )}

              {showChat && (
                <div
                  style={{
                    marginTop: "20px",
                    backgroundColor: "#222",
                    padding: "15px",
                    borderRadius: "8px",
                    color: "white",
                  }}
                >
                  <h3>Chat</h3>
                  <div
                    style={{
                      backgroundColor: "#333",
                      borderRadius: "4px",
                      padding: "10px",
                      minHeight: "200px",
                    }}
                  >
                    <p>Chat with your codebase using the selected files.</p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      marginTop: "10px",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Ask a question about your code..."
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "4px 0 0 4px",
                        border: "none",
                        backgroundColor: "#444",
                        color: "white",
                      }}
                    />
                    <button
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#4a9eff",
                        color: "white",
                        border: "none",
                        borderRadius: "0 4px 4px 0",
                        cursor: "pointer",
                      }}
                    >
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
