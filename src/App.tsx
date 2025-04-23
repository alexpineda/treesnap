import { useState, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "./resizable.css";
import { SelectionSummary } from "./components/selection-summary";
import { FileTreeNode } from "./types";
import { TreeMap } from "./components/tree-map";
import "react-tooltip/dist/react-tooltip.css";
import { basename, toggleSelect } from "./utils";
import { WorkspaceSelector } from "./components/workspace-selector";
import { SidebarSummary, FileTree } from "./components/sidebar";
import { TopBar } from "./components/top-bar";
import { useRecentWorkspaces } from "./hooks/use-recent-workspaces";
import { useWorkspace } from "./hooks/use-workspace";
import { Settings } from "./components/settings";
import { calculateTokensForFiles, openDirectoryDialog } from "@/platform";
import { LicenseArea } from "./components/license/license-area";
import { DebugLicenseControls } from "./components/debug";
import { useLicense } from "./hooks/use-license";
import { useApplicationSettings } from "./hooks/use-application-settings";

function App() {
  const [totalTokens, setTotalTokens] = useState(0);
  const [isShowingSettings, setIsShowingSettings] = useState(false);
  const { recentWorkspaces, addToRecentWorkspaces } = useRecentWorkspaces();
  const workspace = useWorkspace(addToRecentWorkspaces);
  const { workspaceLimitError, localLicenseState } = useLicense();
  const { settings, saveSettings } = useApplicationSettings();

  useEffect(() => {
    calculateTotalTokens();
  }, [workspace.selectedFiles]);

  const resetStates = () => {
    setTotalTokens(0);
  };

  useEffect(() => {
    resetStates();
  }, [workspace.workspacePath]);

  const handleFileSelect = async (node: FileTreeNode) => {
    try {
      const newSelection = toggleSelect(
        node,
        workspace.fileTree.data,
        workspace.selectedFiles
      );
      if (newSelection) {
        workspace.setSelectedFiles(newSelection);
      }
    } catch (err) {
      //TODO toast error
    }
  };

  const calculateTotalTokens = async () => {
    if (workspace.selectedFiles.length === 0) {
      setTotalTokens(0);
      return;
    }

    // 1) sum whatever we already have
    let running = workspace.selectedFiles.reduce(
      (sum, f) => (!f.is_directory && f.tokenCount ? sum + f.tokenCount : sum),
      0
    );

    // 2) collect files still missing counts
    const pending = workspace.selectedFiles.filter(
      (f) => !f.is_directory && (f.tokenCount === undefined || f.isLoading)
    );

    const BATCH = 25; // any size you like
    for (let i = 0; i < pending.length; i += BATCH) {
      const slice = pending.slice(i, i + BATCH);
      const paths = slice.map((f) => f.path);

      const tokenMap = await calculateTokensForFiles(paths); // ONE IPC per batch

      // update selection → clears per‑file spinners
      workspace.setSelectedFiles((prev) =>
        prev.map((f) =>
          tokenMap[f.path] !== undefined
            ? { ...f, tokenCount: tokenMap[f.path], isLoading: false }
            : f
        )
      );

      running += Object.values(tokenMap).reduce((s, n) => s + n, 0);
      setTotalTokens(running); // progressive total
    }
  };

  const handleClose = () => {
    workspace.close();
  };

  const handleOpenDirectory = async () => {
    try {
      const selected = await openDirectoryDialog();
      if (selected) {
        await workspace.loadWorkspace(selected as string);
        resetStates();
      }
    } catch (err) {
      //TODO toast error
      console.error("Error opening directory:", err);
    }
  };

  const handleRefresh = () => {
    resetStates();
    const selected = structuredClone(workspace.selectedFiles);
    const expandedFolders = structuredClone(workspace.expandedFolders);
    workspace.loadWorkspace(workspace.workspacePath);
    workspace.setSelectedFiles(selected);
    workspace.setExpandedFolders(expandedFolders);
  };

  const numExpandedFolders = Array.from(workspace.expandedFolders).length;

  // Calculate if the quick open button should be shown
  const showQuickOpenButton = !(
    localLicenseState?.status === "inactive" && workspaceLimitError
  );

  if (!settings) {
    return (
      <div className="flex h-screen flex-col bg-gray-900">
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col h-full space-y-2">
            <div className="py-4 border-b border-gray-600 pl-6 pr-4 space-y-1">
              <h3>Loading settings...</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              {workspace.status === "not-loaded" ? (
                <WorkspaceSelector
                  handleChooseDirectory={handleOpenDirectory}
                  recentWorkspaces={recentWorkspaces}
                  setDir={workspace.loadWorkspace}
                />
              ) : (
                <div className="flex flex-col h-full space-y-2">
                  {/* Fixed Header */}
                  <div className="py-4 border-b border-gray-600 pl-6 pr-4 space-y-1">
                    <h3>{basename(workspace.workspacePath)}</h3>
                  </div>

                  <div className="px-2 pb-2 border-b border-gray-600">
                    {/* Filter */}
                    {/* <SidebarFilter /> */}

                    {/* Short Summary and Collapse/Expand All */}
                    <SidebarSummary
                      selectedFiles={workspace.selectedFiles}
                      numExpandedFolders={numExpandedFolders}
                      totalTokens={totalTokens}
                      setExpandedFolders={workspace.setExpandedFolders}
                      fileTree={workspace.fileTree.data}
                      onRefresh={handleRefresh}
                    />
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden pl-2 mt-2">
                    {workspace.fileTree.data.length > 0 ? (
                      <FileTree
                        nodes={workspace.fileTree.data}
                        level={0}
                        expandedFolders={workspace.expandedFolders}
                        selectedFiles={workspace.selectedFiles}
                        handleFileSelect={handleFileSelect}
                        onFoldersExpandedOrCollapsed={
                          workspace.setExpandedFolders
                        }
                      />
                    ) : workspace.error ? (
                      <p>{workspace.error}</p>
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
            <div className="h-full w-full flex flex-col bg-gray-900">
              {workspace.status === "loaded" && (
                <>
                  {/* Git-like top bar */}
                  <TopBar
                    settings={settings}
                    selectedFiles={workspace.selectedFiles}
                    workspacePath={workspace.workspacePath}
                    handleClose={handleClose}
                    onSettingsClick={() => {
                      if (import.meta.env.MODE === "web-demo") {
                        alert("Settings are not available in demo mode");
                        return;
                      }

                      setIsShowingSettings(true);
                    }}
                    onQuickOpenClick={handleOpenDirectory}
                    showQuickOpenButton={showQuickOpenButton}
                  />
                  {/* <div className="flex border-b border-gray-700 text-xs">
                    <div className="flex items-center px-3 py-1 bg-gray-700 text-gray-400 border-r border-gray-600">
                      <span>Tab 1</span>
                      <button className="p-1 hover:bg-gray-600 rounded">
                        <X size={12} />
                      </button>
                    </div>
                    <div className="flex items-center px-3 bg-gray-800 text-gray-400 border-r border-gray-600">
                      <span>Tab 2</span>
                      <button className="p-1 hover:bg-gray-700 rounded">
                        <X size={12} />
                      </button>
                    </div>
                    <div className="flex items-center px-3 bg-gray-800 text-gray-400 border-r border-gray-600">
                      <span>Tab 3</span>
                      <button className="p-1 hover:bg-gray-700 rounded">
                        <X size={12} />
                      </button>
                    </div>
                  </div> */}

                  {isShowingSettings ? (
                    <Settings
                      settings={settings}
                      onClose={() => setIsShowingSettings(!isShowingSettings)}
                      onSave={saveSettings}
                    />
                  ) : (
                    <div className="flex-1 overflow-y-auto px-4">
                      <div className="flex flex-col gap-4 h-full">
                        <PanelGroup direction="vertical" className="flex-1">
                          <Panel defaultSize={25} className="overflow-y-auto">
                            <SelectionSummary
                              selectedFiles={workspace.selectedFiles}
                              dir={workspace.workspacePath}
                              totalTokens={totalTokens}
                              groupByDirectory={true}
                              onSorted={(files) => {
                                workspace.setSelectedFiles(files);
                              }}
                              onDeselect={(file) => {
                                if (file.is_directory) {
                                  // If it's a directory header, deselect all files in that directory
                                  const dirPath = file.path.replace(
                                    "_header",
                                    ""
                                  );
                                  const normalizedDirPath = dirPath.startsWith(
                                    "/"
                                  )
                                    ? dirPath
                                    : `/${dirPath}`;
                                  workspace.setSelectedFiles((prev) =>
                                    prev.filter((f) => {
                                      // Skip directory headers
                                      if (f.is_directory) return true;
                                      // Check if file is in the directory
                                      const fileDir = f.path.substring(
                                        0,
                                        f.path.lastIndexOf("/")
                                      );
                                      return !fileDir.startsWith(
                                        normalizedDirPath
                                      );
                                    })
                                  );
                                } else {
                                  // If it's a file, just deselect that file
                                  workspace.setSelectedFiles((prev) =>
                                    prev.filter((f) => f.path !== file.path)
                                  );
                                }
                              }}
                            />
                          </Panel>
                          <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-700 transition-colors" />
                          <Panel defaultSize={75}>
                            <TreeMap
                              selectedFiles={workspace.selectedFiles}
                              totalTokens={totalTokens}
                              className="flex-1"
                            />
                          </Panel>
                        </PanelGroup>
                      </div>
                    </div>
                  )}
                </>
              )}
              {workspace.status === "not-loaded" && (
                <div className="flex flex-1 w-full items-center justify-center">
                  {import.meta.env.MODE === "web-demo" ? (
                    <div className="flex flex-col items-center justify-center">
                      <div>
                        <p className="font-bold text-gray-300">
                          This is a limited web demo version.
                        </p>{" "}
                        <a
                          href="https://www.reposnap.io/download"
                          target="_blank"
                          className="text-blue-500 underline"
                        >
                          Click here to download the full desktop version for
                          full functionality.
                        </a>
                      </div>
                    </div>
                  ) : (
                    <>
                      <LicenseArea />
                      <DebugLicenseControls />
                    </>
                  )}
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;
