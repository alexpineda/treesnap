import {
  TreeOption,
  FileTreeNode,
  RecentWorkspace,
  LocalLicenseState,
  ApplicationSettings,
  WorkspaceLimitStatus,
} from "../types"; // Assuming types are here
import { type Event, type UnlistenFn } from "@tauri-apps/api/event"; // Keep type imports if needed
import { type Update } from "@tauri-apps/plugin-updater";
import { type ConfirmDialogOptions } from "@tauri-apps/plugin-dialog";
import {
  DEMO_WORKSPACE_PATH,
  createDemoFileTree,
  getDemoFileTokens,
} from "./demo/demo-repo";
import {
  renderAsciiTree,
  detectBinary,
  buildDemoExportText,
} from "./demo/render-ascii-tree";
import {
  TauriApiError,
  LicenseStateResponse,
  TauriApiErrorInternal,
  __WEB_DEMO__,
  RepoSizeCapError,
} from "./shared";
import {
  registerWorkspace,
  get as getVfs,
  isVfsPath,
  unregister,
  getDisplayName,
  VFS_PREFIX,
} from "./demo/virtual-fs";

export { TauriApiError, __WEB_DEMO__, RepoSizeCapError };

// --- Basic App Info & Control ---

// Simple no-op listener returning a no-op unlistener
export const listen = <T>(
  event: string,
  handler: (event: Event<T>) => void
): Promise<UnlistenFn> => {
  void handler;

  console.warn(`WEB SHIM: listen('${event}') called, but no events will fire.`);
  return Promise.resolve(() => {
    /* no-op unlisten */
  });
};

// Relaunch is not possible in the browser
export const relaunch = (): Promise<void> => {
  console.warn("WEB SHIM: relaunch() called, reloading page instead.");
  window.location.reload();
  return Promise.resolve();
};

// Update checks are not applicable in the web version
export const check = (): Promise<Update | null> => {
  console.warn("WEB SHIM: check() called, updates not supported.");
  return Promise.resolve(null);
};

// Use browser confirm
export const confirm = (
  message: string,
  options?: string | ConfirmDialogOptions
): Promise<boolean> => {
  const title = typeof options === "string" ? options : options?.title;
  return Promise.resolve(
    window.confirm(title ? `${title}\n\n${message}` : message)
  );
};

// Return a fixed version string for the web demo
export const getVersion = (): Promise<string> => {
  return Promise.resolve(import.meta.env.VITE_APP_VERSION);
};

// --- File & Token Operations (Now with Demo Data & VFS) ---

// Return demo token count or 0, VFS file content access is implicit via getFileTree
export const calculateFileTokens = async (
  filePath: string
): Promise<number> => {
  console.log(`WEB SHIM: calculateFileTokens('${filePath}')`);

  if (isVfsPath(filePath)) {
    // Token calculation for VFS happens during registration or when getFileTree is called
    // For individual file calls post-registration, we'd need a way to look up pre-calculated tokens
    // This depends on how calculateTokensForFiles is structured. Let's assume it handles VFS.
    console.warn(
      `WEB SHIM: calculateFileTokens for VFS path '${filePath}' - relying on batch calculation.`
    );
    // We could potentially look it up if needed, but often batch calc is sufficient
    const [id] = filePath.split("/").slice(0, 1);
    const ws = getVfs(id);
    const relativePath = filePath.replace(id + "/", "");
    return Promise.resolve(ws?.tokens[relativePath] ?? 0);
  }

  // Fallback for demo data
  await new Promise((resolve) => setTimeout(resolve, 20)); // Faster delay
  return Promise.resolve(getDemoFileTokens()[filePath] ?? 0);
};

// Return demo token counts or VFS token counts
export const calculateTokensForFiles = async (
  filePaths: string[]
): Promise<Record<string, number>> => {
  console.log(`WEB SHIM: calculateTokensForFiles called.`);
  // assume all paths share same prefix if VFS
  if (filePaths.length && isVfsPath(filePaths[0])) {
    const id = filePaths[0].substring(
      0,
      filePaths[0].indexOf("/", VFS_PREFIX.length)
    ); // Extract "fs://<uuid>"
    const ws = getVfs(id);
    if (!ws) return {};
    return Object.fromEntries(
      filePaths.map((p) => {
        const relativePath = p.replace(id + "/", "");
        return [p, ws.tokens[relativePath] ?? 0];
      })
    );
  }
  // demo fallback
  await new Promise((resolve) => setTimeout(resolve, 50)); // Faster delay
  const tokenMap: Record<string, number> = {};
  filePaths.forEach((p) => (tokenMap[p] = getDemoFileTokens()[p] ?? 0));
  return Promise.resolve(tokenMap);
};

// Return demo tree, VFS tree, or empty
export const getFileTree = async (
  dirPath: string,
  withTokensSync = false // This flag is ignored in web shim
): Promise<FileTreeNode[]> => {
  void withTokensSync;
  console.log(`WEB SHIM: getFileTree('${dirPath}') called.`);

  if (isVfsPath(dirPath)) {
    const ws = getVfs(dirPath);
    return Promise.resolve(ws?.tree ?? []);
  } else if (dirPath === DEMO_WORKSPACE_PATH) {
    return Promise.resolve(createDemoFileTree(dirPath));
  }

  console.warn(
    `WEB SHIM: getFileTree called with unknown path ('${dirPath}'), returning empty tree.`
  );
  return Promise.resolve([]);
};

// Open the demo workspace or VFS workspace
export const openWorkspace = async (
  dirPath: string
): Promise<{
  tree: FileTreeNode[] | null;
  error: TauriApiErrorInternal | null;
}> => {
  console.log(`WEB SHIM: openWorkspace('${dirPath}') called.`);

  if (isVfsPath(dirPath)) {
    const ws = getVfs(dirPath);
    if (ws) {
      return Promise.resolve({ tree: ws.tree, error: null });
    } else {
      console.error(`WEB SHIM: VFS workspace '${dirPath}' not found.`);
      return Promise.resolve({
        tree: null,
        error: { code: "vfs_missing", message: "Workspace not found." },
      });
    }
  } else if (dirPath === DEMO_WORKSPACE_PATH) {
    return Promise.resolve({
      tree: createDemoFileTree(dirPath),
      error: null,
    });
  }

  console.warn(
    `WEB SHIM: openWorkspace called with non-demo/non-VFS path ('${dirPath}'), returning error.`
  );
  return Promise.resolve({
    tree: null,
    error: {
      code: "web_unsupported",
      message: `Opening unsupported path (${dirPath}). Only the demo project or selected local folders are available.`,
    },
  });
};

// Close workspace - unregister if VFS
export const closeWorkspace = async (workspacePath: string): Promise<void> => {
  console.log(`WEB SHIM: closeWorkspace('${workspacePath}') called.`);
  if (isVfsPath(workspacePath)) {
    unregister(workspacePath);
    console.log(`WEB SHIM: Unregistered VFS workspace '${workspacePath}'.`);
  }
  return Promise.resolve();
};

// Cannot access local filesystem to copy
export const copyFilesWithTreeToClipboard = async (
  dirPath: string,
  selectedFilePaths: string[],
  treeOption: TreeOption
): Promise<void> => {
  void treeOption; // Acknowledge unused parameter

  let exportText = "";

  console.log("isVfsPath", isVfsPath(dirPath));

  if (isVfsPath(dirPath)) {
    const ws = getVfs(dirPath);
    if (!ws) {
      console.error(
        `WEB SHIM: Cannot copy, VFS workspace '${dirPath}' not found.`
      );
      alert("Error: Could not find workspace data to copy.");
      return;
    }
    /* ---------- reuse demo helpers so format is identical ---------- */
    const rootLabel =
      getDisplayName(dirPath) ?? dirPath.replace(VFS_PREFIX, "");

    // 1) tree data
    const treeInput = selectedFilePaths.map((p) => {
      const rel = p.replace(dirPath + "/", "");
      return { path: `${rootLabel}/${rel}`, tokenCount: ws.tokens[rel] };
    });
    const asciiTree = renderAsciiTree(treeInput, rootLabel);

    // 2) file blocks
    const fileBlocks = await Promise.all(
      selectedFilePaths.map(async (fullPath) => {
        const rel = fullPath.replace(dirPath + "/", "");
        const pretty = `${rootLabel}/${rel}`;
        const ext = rel.split(".").pop() ?? "";

        const fileObj = ws.files.find(
          (f) => `${dirPath}/${f.webkitRelativePath || f.name}` === fullPath
        );

        if (!fileObj || detectBinary(rel)) {
          return `File: ${pretty}\n\`\`\`${ext}\n[Binary file]\n\`\`\``;
        }

        return `File: ${pretty}\n\`\`\`${ext}\n${await fileObj.text()}\n\`\`\``;
      })
    );

    // 3) final blob   —   do **NOT** stringify; raw new-lines keep formatting
    exportText =
      `<file_map>\n${asciiTree}\n\n</file_map>\n\n` +
      `<file_contents>\n${fileBlocks.join("\n\n")}\n</file_contents>`;
    /* --------- end changes --------- */
  } else if (dirPath === DEMO_WORKSPACE_PATH) {
    const filesForTree = selectedFilePaths.map((path) => ({
      path,
      tokenCount: getDemoFileTokens()[path] ?? 0, // Get demo tokens
    }));
    exportText = buildDemoExportText(dirPath, filesForTree);
  } else {
    console.error(`WEB SHIM: Cannot copy, unsupported path type '${dirPath}'.`);
    alert("Error: Cannot copy data for this workspace type.");
    return;
  }

  // Running standalone (new tab): Use navigator.clipboard directly
  console.log("Attempting direct clipboard write");
  try {
    await navigator.clipboard.writeText(exportText);
  } catch (err) {
    console.error("Failed to write directly to clipboard:", err);
    // Provide feedback in the demo UI
    alert("Copy is not supported in this browser.");
  }
};

// --- Recent Workspaces (Now includes Demo) ---

// Always return the demo workspace
export const loadRecentWorkspaces = async (): Promise<
  RecentWorkspace[] | null
> => {
  const demoWorkspace: RecentWorkspace = {
    path: DEMO_WORKSPACE_PATH,
  };
  console.log("WEB SHIM: loadRecentWorkspaces called, returning demo only.");
  return Promise.resolve([demoWorkspace]);
};

// Saving is a no-op in the demo as we always load the fixed one
export const saveRecentWorkspaces = async (
  workspaces: RecentWorkspace[]
): Promise<void> => {
  void workspaces; // Parameter is unused now
  console.log("WEB SHIM: saveRecentWorkspaces called (no-op for web demo).");
  return Promise.resolve();
};

// Use File System Access API for directory dialog
export const openDirectoryDialog = async (): Promise<string | null> => {
  if (!window.showDirectoryPicker) {
    alert(
      "Opening local folders requires a browser that supports the File System Access API (like Chrome, Edge, or Opera)."
    );
    return Promise.resolve(null);
  }
  try {
    const handle = await window.showDirectoryPicker();
    // Register the handle and get the VFS ID
    const workspaceId = await registerWorkspace(handle); // This now returns "fs://<uuid>"
    return Promise.resolve(workspaceId);
  } catch (err: any) {
    // Handle user cancellation gracefully
    if (err?.name === "AbortError") {
      console.log("WEB SHIM: Directory picker cancelled by user.");
      return Promise.resolve(null);
    }

    if (err instanceof RepoSizeCapError) {
      throw err;
    }

    // Handle potential errors from registerWorkspace (e.g., size limits)
    if (err.message?.includes("exceeded")) {
      // Basic check for size errors
      alert(`Error opening directory: ${err.message}`);
      return Promise.resolve(null);
    }
    console.error("WEB SHIM: Error using showDirectoryPicker:", err);
    alert(
      `An unexpected error occurred while trying to open the directory: ${
        err.message || err
      }`
    );
    return Promise.resolve(null); // Return null on other errors too
  }
};

// --- License Service Stubs ---

// Replicate error structure for consistency

// Always return "not_activated" state for demo
export const activateLicense = async (
  licenseKey: string
): Promise<LicenseStateResponse> => {
  void licenseKey;
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return Promise.resolve({
    state: null,
    error: TauriApiError.fromInternal({
      code: "web_unsupported",
      message: "License activation is not available in the web demo.",
    }),
  });
};

// Always return "inactive" state
export const getLocalLicenseState = async (): Promise<LicenseStateResponse> => {
  const defaultState: LocalLicenseState = {
    status: "inactive",
    licenseType: undefined,
    expiresAt: null,
  };
  console.log(
    "WEB SHIM: getLocalLicenseState called, returning default state."
  );
  return Promise.resolve({ state: defaultState, error: null });
};

// Workspace limit check always passes in web demo (as opening is blocked anyway)
export const checkWorkspaceLimit = async (): Promise<WorkspaceLimitStatus> => {
  return Promise.resolve({ allowed: true, used: 0, limit: 0, error: null });
};

export const clearCache = async () => {
  console.log("no-op clear cache");
};
// --- Debug License Stubs (No-op) ---

export interface DebugLicenseParams {
  status?: LocalLicenseState["status"];
  licenseType?: LocalLicenseState["licenseType"];
  expiresAtOffsetDays?: number;
  expireRefCodeAtOffsetDays?: number;
  refCode?: string;
}

export const debugSetLicenseState = async (
  params: DebugLicenseParams
): Promise<{ error: TauriApiError | null }> => {
  void params;
  return Promise.resolve({ error: null });
};

export const debugClearLicenseState = async (): Promise<{
  error: TauriApiError | null;
}> => {
  return Promise.resolve({ error: null });
};

export const debugAddUsageEntries = async (
  count: number
): Promise<{ error: TauriApiError | null }> => {
  void count;
  return Promise.resolve({ error: null });
};

// --- Settings Service Stubs ---

// Return default settings for the web demo
export const getApplicationSettings = async (): Promise<{
  settings: ApplicationSettings;
  error: null;
}> => {
  console.log("WEB SHIM: getApplicationSettings called.");
  // Matches the Rust Default implementation
  const defaultSettings: ApplicationSettings = {
    schemaVersion: 1,
    appVersion: "web-demo",
    treeOption: "include",
  };
  return Promise.resolve({ settings: defaultSettings, error: null });
};

// Settings update is a no-op in the web demo
export const updateApplicationSettings = async (
  settings: ApplicationSettings
): Promise<{ error: TauriApiError | null }> => {
  void settings; // Mark as unused
  console.log("WEB SHIM: updateApplicationSettings called (no-op).");
  return Promise.resolve({ error: null });
};

// --- End Settings Service Stubs ---
