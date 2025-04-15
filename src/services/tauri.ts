import { invoke } from "@tauri-apps/api/core";
import {
  TreeOption,
  FileTreeNode,
  RecentWorkspace,
  LocalLicenseState,
} from "../types";
import { load } from "@tauri-apps/plugin-store";
import { open } from "@tauri-apps/plugin-dialog";

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
): Promise<{ tree: FileTreeNode[] | null; error: LicenseError | null }> => {
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

const _recentWorkspacesStore = await load("workspaces.json");

export const loadRecentWorkspaces = async () => {
  const saved = await _recentWorkspacesStore.get<RecentWorkspace[]>("recent");
  return saved;
};

export const saveRecentWorkspaces = async (workspaces: RecentWorkspace[]) => {
  await _recentWorkspacesStore.set("recent", workspaces);
};

export const openDirectoryDialog = async () => {
  return await open({ directory: true });
};

// --- License Service Functions ---
type LicenseError = {
  code: string;
  message: string;
};

type LicenseStateResponse = {
  state: LocalLicenseState | null;
  error: LicenseError | null;
};

function isLicenseError(error: any): error is LicenseError {
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
  if (isLicenseError(error)) {
    return { state: null, error: error };
  }
  if (error instanceof Error) {
    return {
      state: null,
      error: { code: "unknown_error", message: error.message },
    };
  }
  return {
    state: null,
    error: { code: "unknown_error", message: "Unknown error" },
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
  error: LicenseError | null;
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
  status?: "activated" | "expired" | "unactivated";
  license_type?: string;
  expires_at_offset_days?: number;
}

/**
 * DEV ONLY: Sets the local license state for debugging.
 * Corresponds to `debug_set_license_state` in Rust.
 */
export const debugSetLicenseState = async (
  params: DebugLicenseParams
): Promise<{ error: LicenseError | null }> => {
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
  error: LicenseError | null;
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
): Promise<{ error: LicenseError | null }> => {
  try {
    await invoke<void>("debug_add_usage_entries", { count });
    console.warn(`DEBUG: Added ${count} dummy usage entries.`);
    return { error: null };
  } catch (error) {
    console.error("DEBUG: Failed to add usage entries:", error);
    const { error: apiError } = createErrorResponse(error);
    return { error: apiError };
  }
};
