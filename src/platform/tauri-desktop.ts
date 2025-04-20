import { invoke } from "@tauri-apps/api/core";
import { getVersion as tauriGetVersion } from "@tauri-apps/api/app";
import {
  TreeOption,
  FileTreeNode,
  RecentWorkspace,
  LocalLicenseState,
} from "../types";
import { Store, load } from "@tauri-apps/plugin-store";
import {
  type ConfirmDialogOptions,
  open,
  confirm as tauriConfirm,
} from "@tauri-apps/plugin-dialog";
import {
  CheckOptions,
  check as tauriCheck,
  type Update,
} from "@tauri-apps/plugin-updater";
import { relaunch as tauriRelaunch } from "@tauri-apps/plugin-process";
import {
  listen as tauriListen,
  type Event,
  type UnlistenFn,
} from "@tauri-apps/api/event";

export const listen = <T>(
  event: string,
  handler: (event: Event<T>) => void
): Promise<UnlistenFn> => {
  return tauriListen<T>(event, handler);
};

export const relaunch = (): Promise<void> => {
  return tauriRelaunch();
};

export const check = (options?: CheckOptions): Promise<Update | null> => {
  return tauriCheck(options);
};

export const confirm = (
  message: string,
  options?: string | ConfirmDialogOptions
): Promise<boolean> => {
  return tauriConfirm(message, options);
};

export const getVersion = (): Promise<string> => {
  return tauriGetVersion();
};

export const calculateFileTokens = async (filePath: string) => {
  const tokens = await invoke<number>("calculate_file_tokens", { filePath });
  return tokens;
};

export const calculateTokensForFiles = async (filePaths: string[]) => {
  const tokenMap = await invoke<Record<string, number>>(
    "calculate_tokens_for_files",
    { file_paths: filePaths }
  );
  return tokenMap;
};

export const getFileTree = async (dirPath: string, withTokensSync = false) => {
  const tree = await invoke<FileTreeNode[]>("get_file_tree", {
    dirPath,
    withTokensSync,
  });
  return tree;
};

export const openWorkspace = async (
  dirPath: string
): Promise<{
  tree: FileTreeNode[] | null;
  error: TauriApiErrorInternal | null;
}> => {
  try {
    const tree = await invoke<FileTreeNode[]>("open_workspace", {
      dirPath,
    });
    return { tree: tree, error: null };
  } catch (error) {
    const { error: apiError } = createErrorResponse(error);
    return { tree: null, error: apiError };
  }
};

export const closeWorkspace = async () => {
  await invoke("close_workspace");
};

export const copyFilesWithTreeToClipboard = (
  dirPath: string,
  selectedFilePaths: string[],
  treeOption: TreeOption
) => {
  return invoke("copy_files_with_tree_to_clipboard", {
    dirPath,
    selectedFilePaths,
    treeOption,
  });
};

let _recentWorkspacesStore: Store | null = null;

// Helper function to lazily load the store
const getRecentWorkspacesStore = async (): Promise<Store> => {
  if (!_recentWorkspacesStore) {
    _recentWorkspacesStore = await load("workspaces.json");
  }
  return _recentWorkspacesStore;
};

export const loadRecentWorkspaces = async () => {
  const store = await getRecentWorkspacesStore();
  const saved = await store.get<RecentWorkspace[]>("recent");
  return saved;
};

export const saveRecentWorkspaces = async (workspaces: RecentWorkspace[]) => {
  const store = await getRecentWorkspacesStore();
  await store.set("recent", workspaces);
};

export const openDirectoryDialog = async () => {
  return await open({ directory: true });
};

// --- License Service Functions ---
type TauriApiErrorInternal = {
  code: string;
  message: string;
};

type LicenseStateResponse = {
  state: LocalLicenseState | null;
  error: TauriApiError | null;
};

export class TauriApiError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
  static fromInternal(error: TauriApiErrorInternal): TauriApiError {
    return new TauriApiError(error.message, error.code);
  }
}

function isTauriApiError(error: any): error is TauriApiErrorInternal {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    "message" in error &&
    typeof error.message === "string"
  );
}

function createErrorResponse(error: unknown): LicenseStateResponse {
  console.error(error);
  if (isTauriApiError(error)) {
    return {
      state: null,
      error: TauriApiError.fromInternal(error),
    };
  }
  if (error instanceof Error) {
    return {
      state: null,
      error: TauriApiError.fromInternal({
        code: "unknown_error",
        message: error.message,
      }),
    };
  }
  return {
    state: null,
    error: TauriApiError.fromInternal({
      code: "unknown_error",
      message: "Unknown error",
    }),
  };
}

/**
 * Attempts to activate the application with the provided license key.
 * Corresponds to `activate_license_cmd` in Rust.
 */
export const activateLicense = async (
  licenseKey: string
): Promise<LicenseStateResponse> => {
  try {
    const status = await invoke<LocalLicenseState>("activate_license", {
      licenseKey,
    });
    return { state: status, error: null };
  } catch (error) {
    return createErrorResponse(error);
  }
};

/**
 * Gets the locally stored license status.
 * Corresponds to `get_license_status_cmd` in Rust.
 */
export const getLocalLicenseState = async (): Promise<LicenseStateResponse> => {
  try {
    const status = await invoke<LocalLicenseState>("get_local_license_state");
    return { state: status, error: null };
  } catch (error) {
    return createErrorResponse(error);
  }
};

export const checkWorkspaceLimit = async (): Promise<{
  error: TauriApiErrorInternal | null;
}> => {
  try {
    // Rust returns Ok(()) which serializes to null on success
    await invoke<void>("check_workspace_limit");
    return { error: null };
  } catch (error) {
    // On Err(ApiError), the promise rejects with the ApiError object
    const { error: apiError } = createErrorResponse(error);
    return { error: apiError };
  }
};

// --- Debug License Commands (DEV ONLY) ---

/**
 * Parameters for setting the debug license state.
 * Matches `DebugLicenseParams` in Rust.
 */
export interface DebugLicenseParams {
  status?: LocalLicenseState["status"];
  licenseType?: LocalLicenseState["licenseType"];
  expiresAtOffsetDays?: number;
}

/**
 * DEV ONLY: Sets the local license state for debugging.
 * Corresponds to `debug_set_license_state` in Rust.
 */
export const debugSetLicenseState = async (
  params: DebugLicenseParams
): Promise<{ error: TauriApiError | null }> => {
  try {
    await invoke<void>("debug_set_license_state", { params });
    console.warn("DEBUG: License state set:", params);
    return { error: null };
  } catch (error) {
    console.error("DEBUG: Failed to set license state:", error);
    const { error: apiError } = createErrorResponse(error);
    return { error: apiError };
  }
};

/**
 * DEV ONLY: Clears the local license state and usage stats.
 * Corresponds to `debug_clear_license_state` in Rust.
 */
export const debugClearLicenseState = async (): Promise<{
  error: TauriApiError | null;
}> => {
  try {
    await invoke<void>("debug_clear_license_state");
    console.warn("DEBUG: License state cleared.");
    return { error: null };
  } catch (error) {
    console.error("DEBUG: Failed to clear license state:", error);
    const { error: apiError } = createErrorResponse(error);
    return { error: apiError };
  }
};

/**
 * DEV ONLY: Adds dummy workspace entries to usage stats.
 * Corresponds to `debug_add_usage_entries` in Rust.
 */
export const debugAddUsageEntries = async (
  count: number
): Promise<{ error: TauriApiError | null }> => {
  try {
    await invoke<void>("debug_add_usage_entries", { count: count });
    console.warn(`DEBUG: Added ${count} dummy usage entries.`);
    return { error: null };
  } catch (error) {
    console.error("DEBUG: Failed to add usage entries:", error);
    const { error: apiError } = createErrorResponse(error);
    return { error: apiError };
  }
};
