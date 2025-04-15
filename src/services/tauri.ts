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

export const openWorkspace = async (dirPath: string) => {
  const tree = await invoke<FileTreeNode[]>("open_workspace", {
    dirPath,
  });
  return tree;
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

/**
 * Attempts to activate the application with the provided license key.
 * Corresponds to `activate_license_cmd` in Rust.
 */
export const activateLicense = async (licenseKey: string) => {
  const status = await invoke<LocalLicenseState>("activate_license", {
    licenseKey,
  });
  return status;
};

/**
 * Gets the locally stored license status.
 * Corresponds to `get_license_status_cmd` in Rust.
 */
export const getLocalLicenseState = async () => {
  const status = await invoke<LocalLicenseState>("get_local_license_state");
  return status;
};
