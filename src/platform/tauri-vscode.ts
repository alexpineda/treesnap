// This module is imported by React code that already lives in the webview.
// Heavy lifting happens in the extension-host via a trivial RPC wrapper.

import type {
  TreeOption,
  FileTreeNode,
  RecentWorkspace,
  LocalLicenseState,
  ApplicationSettings,
  WorkspaceLimitStatus,
} from "../types";
import { TauriApiError, RepoSizeCapError } from "./shared/errors";
import { __WEB_DEMO__, __VSCODE__ } from "./shared/constants";
export { TauriApiError, __WEB_DEMO__, __VSCODE__, RepoSizeCapError };
// @ts-ignore
const vscode = acquireVsCodeApi();

/* ---------- generic promise-based RPC bridge ---------- */
let _rpcId = 0;
type RpcPayload = Record<string, unknown>;

type Pending = {
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
  timer?: ReturnType<typeof setTimeout>;
};
const pending = new Map<number, Pending>();

// one global listener – never removed
window.addEventListener("message", (ev: MessageEvent<any>) => {
  const { id, result, error } = ev.data ?? {};
  console.log("DATA", ev.data);
  console.log("PENDING", pending.keys());
  if (!pending.has(id)) return; // unknown / late reply
  const { resolve, reject, timer } = pending.get(id)!;
  if (timer) clearTimeout(timer);
  pending.delete(id);
  error ? reject(error) : resolve(result);
});

export function rpc<T = void>(
  cmd: string,
  payload: RpcPayload = {},
  {
    timeout = 30_000, // ms – set 0 to disable
    signal,
  }: { timeout?: number; signal?: AbortSignal } = {}
): Promise<T> {
  const id = ++_rpcId;
  vscode.postMessage({ id, cmd, payload });

  return new Promise<T>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (timeout)
      timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`RPC '${cmd}' timed out after ${timeout} ms`));
      }, timeout);

    pending.set(id, {
      resolve: resolve as (v: unknown) => void,
      reject,
      timer,
    });
    if (signal)
      signal.addEventListener("abort", () => {
        if (timer) clearTimeout(timer);
        pending.delete(id);
        reject(new Error(`RPC '${cmd}' aborted`));
      });
  });
}

/* ---------------------------------------------------------------------- */

export const listen = () =>
  Promise.resolve(() => {
    /*no-op*/
  });
export const relaunch = () => rpc<void>("relaunch");
export const check = () => rpc("check");
export const confirm = (m: string) => rpc<boolean>("confirm", { m });
export const getVersion = () => rpc<string>("getVersion");

export const calculateFileTokens = (filePath: string) =>
  rpc<number>("calculateFileTokens", { filePath });
export const calculateTokensForFiles = (filePaths: string[]) =>
  rpc<Record<string, number>>("calculateTokensForFiles", { filePaths });
export const getFileTree = (dirPath: string, withTokensSync = false) =>
  rpc<FileTreeNode[]>("getFileTree", { dirPath, withTokensSync });
export const openWorkspace = async (
  dirPath: string
): Promise<{
  tree: FileTreeNode[] | null;
  // For VS Code, error will be simpler initially, can be expanded
  error: { code: string; message: string } | string | null;
}> => {
  console.log(`[tauri-vscode.ts] openWorkspace called for path: ${dirPath}`);
  try {
    const tree = await rpc<FileTreeNode[]>("openWorkspace", { dirPath });
    console.log("[tauri-vscode.ts] rpc call successful, tree received:", tree);
    const returnValue = { tree, error: null };
    console.log("[tauri-vscode.ts] Returning from openWorkspace (success):", returnValue);
    return returnValue;
  } catch (e: any) {
    const errorMessage = e?.message || String(e);
    console.error("[tauri-vscode.ts] rpc call failed:", errorMessage, e);
    const errorValue = { code: "vscode_rpc_error", message: errorMessage };
    const returnValue = { tree: null, error: errorValue };
    console.log("[tauri-vscode.ts] Returning from openWorkspace (error):", returnValue);
    return returnValue;
  }
};
export const closeWorkspace = () => rpc<void>("closeWorkspace");
export const copyFilesWithTreeToClipboard = (
  dirPath: string,
  selectedFilePaths: string[],
  treeOption: TreeOption
): Promise<void> => // Ensure void return type to match others
  rpc<void>("copyFilesWithTreeToClipboard", { // Expect void from rpc layer
    dirPath,
    selectedFilePaths,
    treeOption,
  });

export const loadRecentWorkspaces = () =>
  rpc<RecentWorkspace[]>("loadRecentWorkspaces");
export const saveRecentWorkspaces = (w: RecentWorkspace[]) =>
  rpc("saveRecentWorkspaces", { w });
export const openDirectoryDialog = () =>
  rpc<string | null>("openDirectoryDialog");

export const activateLicense = (licenseKey: string) =>
  rpc("activateLicense", { licenseKey });
export const getLocalLicenseState = () =>
  rpc<LocalLicenseState>("getLocalLicenseState");
export const checkWorkspaceLimit = () =>
  rpc<WorkspaceLimitStatus>("checkWorkspaceLimit");
export const clearCache = () => rpc<void>("clearCache");

export const getApplicationSettings = async (): Promise<
  | { settings: ApplicationSettings; error: null }
  | { settings: null; error: { code: string; message: string } | string } // Match desktop error structure loosely
> => {
  try {
    // rpc.ts currently returns { settings: ApplicationSettings } without an error field
    // So, we access result.settings
    const result = await rpc<{ settings: ApplicationSettings }>("getApplicationSettings");
    return { settings: result.settings, error: null };
  } catch (e: any) {
    const errorMessage = e?.message || String(e);
    return { settings: null, error: { code: "vscode_rpc_error", message: errorMessage } };
  }
};

export const updateApplicationSettings = (s: ApplicationSettings) =>
  rpc<void>("updateApplicationSettings", { s });

/* debug helpers are forwarded unchanged */
export const debugSetLicenseState = (p: any) =>
  rpc("debugSetLicenseState", { p });
export const debugClearLicenseState = () => rpc("debugClearLicenseState");
export const debugAddUsageEntries = (c: number) =>
  rpc("debugAddUsageEntries", { c });

export const openLink = async (url: string) => {
  window.open(url, "_blank");
};
export const dismissUpgradeLicenseBanner = async () => {};

export const isUpgradeLicenseBannerDismissed = async () => {
  return true;
};
