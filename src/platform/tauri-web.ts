import {
  TreeOption,
  FileTreeNode,
  RecentWorkspace,
  LocalLicenseState,
} from "../types"; // Assuming types are here
import { type Event, type UnlistenFn } from "@tauri-apps/api/event"; // Keep type imports if needed
import { type Update } from "@tauri-apps/plugin-updater";
import { type ConfirmDialogOptions } from "@tauri-apps/plugin-dialog";
import {
  DEMO_WORKSPACE_PATH,
  createDemoFileTree,
  getDemoFileTokens,
} from "./demo/demo-repo";
import { buildDemoExportText } from "./demo/render-ascii-tree";

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
  return Promise.resolve("web-demo");
};

// --- File & Token Operations (Now with Demo Data) ---

// Return demo token count or 0
export const calculateFileTokens = async (
  filePath: string
): Promise<number> => {
  console.log(`WEB SHIM: calculateFileTokens('${filePath}')`);
  // Simulate async operation with a delay
  await new Promise((resolve) => setTimeout(resolve, 20)); // Faster delay
  return Promise.resolve(getDemoFileTokens()[filePath] ?? 0);
};

// Return demo token counts for requested files
export const calculateTokensForFiles = async (
  filePaths: string[]
): Promise<Record<string, number>> => {
  console.log(`WEB SHIM: calculateTokensForFiles called.`);
  // Simulate async operation with a delay
  await new Promise((resolve) => setTimeout(resolve, 50)); // Faster delay
  const tokenMap: Record<string, number> = {};
  filePaths.forEach((p) => (tokenMap[p] = getDemoFileTokens()[p] ?? 0));
  return Promise.resolve(tokenMap);
};

// Return demo tree if path matches, else empty
export const getFileTree = async (
  dirPath: string,
  withTokensSync = false // This flag is ignored in web shim
): Promise<FileTreeNode[]> => {
  void withTokensSync;
  console.log(`WEB SHIM: getFileTree('${dirPath}') called.`);
  if (dirPath === DEMO_WORKSPACE_PATH) {
    return Promise.resolve(createDemoFileTree(dirPath));
  }
  console.warn(
    `WEB SHIM: getFileTree called with non-demo path ('${dirPath}'), returning empty tree.`
  );
  return Promise.resolve([]);
};

// Open the demo workspace or return error
export const openWorkspace = async (
  dirPath: string
): Promise<{
  tree: FileTreeNode[] | null;
  error: TauriApiErrorInternal | null;
}> => {
  console.log(`WEB SHIM: openWorkspace('${dirPath}') called.`);
  if (dirPath === DEMO_WORKSPACE_PATH) {
    return Promise.resolve({
      tree: createDemoFileTree(dirPath),
      error: null,
    });
  }
  console.warn(
    `WEB SHIM: openWorkspace called with non-demo path ('${dirPath}'), returning error.`
  );
  return Promise.resolve({
    tree: null,
    error: {
      code: "web_unsupported",
      message: `Opening local directories (${dirPath}) is not supported in the web demo. Only the demo project is available.`,
    },
  });
};

// No-op for closing workspace
export const closeWorkspace = async (): Promise<void> => {
  console.log("WEB SHIM: closeWorkspace() called (no-op).");
  return Promise.resolve();
};

// Cannot access local filesystem to copy
export const copyFilesWithTreeToClipboard = async (
  dirPath: string,
  selectedFilePaths: string[],
  treeOption: TreeOption
): Promise<void> => {
  void treeOption; // Acknowledge unused parameter

  const filesForTree = selectedFilePaths.map((path) => ({
    path,
    // tokenCount: undefined, // Or fetch actual counts if available
  }));

  const tree = buildDemoExportText(dirPath, filesForTree);

  // Check if running inside an iframe
  const isInsideIframe = window.self !== window.top;

  if (isInsideIframe) {
    // Running in iframe: Send message to the parent window (your main site)
    console.log("Attempting postMessage to parent");
    const targetOrigin = "https://www.reposnap.io";
    try {
      // Make sure the parent window exists and has postMessage
      if (window.parent && typeof window.parent.postMessage === "function") {
        window.parent.postMessage(
          { type: "copyToClipboard", text: tree },
          targetOrigin
        );
        // Optional: Show success message in the demo UI
        console.log("Message posted to parent for clipboard write.");
      } else {
        console.error("Cannot access parent window or postMessage function.");
        // Fallback or error message if parent communication isn't possible
        alert("Copy is not supported in this browser.");
      }
    } catch (error) {
      console.error("Error posting message to parent:", error);
      // Provide feedback in the demo UI
      alert("Copy is not supported in this browser.");
    }
  } else {
    // Running standalone (new tab): Use navigator.clipboard directly
    console.log("Attempting direct clipboard write");
    try {
      await navigator.clipboard.writeText(tree);
      // Provide feedback in the demo UI
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to write directly to clipboard:", err);
      // Provide feedback in the demo UI
      alert("Copy is not supported in this browser.");
    }
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

// Cannot open native directory dialog
export const openDirectoryDialog = async (): Promise<string | null> => {
  console.warn("WEB SHIM: openDirectoryDialog called, not supported.");
  alert(
    "Opening local directories directly is not supported in this demo. Please use the provided 'Demo Project'."
  );
  return Promise.resolve(null);
};

// --- License Service Stubs ---

// Replicate error structure for consistency
type TauriApiErrorInternal = {
  code: string;
  message: string;
};

type LicenseStateResponse = {
  state: LocalLicenseState | null;
  error: TauriApiError | null;
};

// Keep the custom error class
export class TauriApiError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "TauriApiError"; // Helpful for debugging
  }
  static fromInternal(error: TauriApiErrorInternal): TauriApiError {
    return new TauriApiError(error.message, error.code);
  }
}

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
export const checkWorkspaceLimit = async (): Promise<{
  error: TauriApiErrorInternal | null;
}> => {
  return Promise.resolve({ error: null });
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
