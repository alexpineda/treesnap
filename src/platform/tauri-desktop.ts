import { invoke } from "@tauri-apps/api/core";
import { getVersion as tauriGetVersion } from "@tauri-apps/api/app";
import {
  TreeOption,
  FileTreeNode,
  RecentWorkspace,
  LocalLicenseState,
  ApplicationSettings,
  WorkspaceLimitStatus,
} from "../types";
import { Store, load } from "@tauri-apps/plugin-store";
import {
  type ConfirmDialogOptions,
  open,
  confirm as tauriConfirm,
} from "@tauri-apps/plugin-dialog";
import {
  type CheckOptions,
  check as tauriCheck,
  type Update,
} from "@tauri-apps/plugin-updater";
import { relaunch as tauriRelaunch } from "@tauri-apps/plugin-process";
import {
  listen as tauriListen,
  type Event,
  type UnlistenFn,
} from "@tauri-apps/api/event";
import {
  isTauriApiError,
  LicenseStateResponse,
  TauriApiErrorInternal,
  TauriApiError,
  __WEB_DEMO__,
  RepoSizeCapError,
} from "./shared";
import { openUrl } from "@tauri-apps/plugin-opener";
import { addDays, isAfter } from "date-fns";

export { TauriApiError, __WEB_DEMO__, RepoSizeCapError };

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
    { filePaths: filePaths }
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

export const dismissUpgradeLicenseBanner = async () => {
  const store = await getRecentWorkspacesStore();
  await store.set("dismissed_upgrade_license_banner", new Date().toISOString());
};

export const isUpgradeLicenseBannerDismissed = async () => {
  const store = await getRecentWorkspacesStore();
  const dismissed = await store.get<string>("dismissed_upgrade_license_banner");
  if (!dismissed) {
    return false; // Not dismissed if no record exists
  }
  const dismissedDate = new Date(dismissed);
  const fourteenDaysAfterDismissal = addDays(dismissedDate, 14);
  // Return true (considered dismissed) if the current date is *before or equal* to 14 days after dismissal
  return !isAfter(new Date(), fourteenDaysAfterDismissal);
};

// --- License Service Functions ---

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

export const checkWorkspaceLimit = async (): Promise<WorkspaceLimitStatus> => {
  try {
    // Rust returns Ok(()) which serializes to null on success
    const status = await invoke<WorkspaceLimitStatus>("check_workspace_limit");
    return status;
  } catch (error) {
    // On Err(ApiError), the promise rejects with the ApiError object
    const { error: apiError } = createErrorResponse(error);
    return {
      allowed: false,
      used: 0,
      limit: 0,
      error: apiError,
    };
  }
};

export const clearCache = async () => {
  await invoke<void>("clear_cache");
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
  expireRefCodeAtOffsetDays?: number;
  refCode?: string;
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

// --- Settings Service Functions ---

export const getApplicationSettings = async (): Promise<
  | { settings: ApplicationSettings; error: null }
  | { settings: null; error: TauriApiError }
> => {
  try {
    const settings = await invoke<ApplicationSettings>(
      "get_application_settings"
    );
    return { settings, error: null };
  } catch (error) {
    const { error: apiError } = createErrorResponse(error);
    if (!apiError) {
      return {
        settings: null,
        error: new TauriApiError(
          "Unknown error occurred while fetching settings.",
          "unknown_settings_error"
        ),
      };
    }
    return { settings: null, error: apiError };
  }
};

export const updateApplicationSettings = async (
  settings: ApplicationSettings
): Promise<{ error: TauriApiError | null }> => {
  try {
    await invoke<void>("update_application_settings", { settings });
    return { error: null };
  } catch (error) {
    const { error: apiError } = createErrorResponse(error);
    return { error: apiError };
  }
};

export const openLink = async (url: string) => {
  await openUrl(url);
};

// --- End Settings Service Functions ---
