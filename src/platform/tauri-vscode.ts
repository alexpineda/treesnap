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
import { TauriApiError, __WEB_DEMO__, RepoSizeCapError } from "./shared";

export { TauriApiError, __WEB_DEMO__, RepoSizeCapError };
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

// @ts-ignore
window.__origConsole = console;

["log", "warn", "error"].forEach((fn) => {
  // capture the real method *before* we overwrite it
  const orig = (console as any)[fn].bind(console);

  // @ts-ignore – patch console
  console[fn] = (...a) => {
    rpc("console", { fn, a }, { timeout: 0 }) // fire-and-forget (0 = no timer)
      .catch(() => {}); // ignore if panel already closed
    orig(...a); // still print in DevTools
  };
});
/* ---------------------------------------------------------------------- */

export const listen = <T>() =>
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
export const openWorkspace = (dirPath: string) =>
  rpc("openWorkspace", { dirPath });
export const closeWorkspace = () => rpc("closeWorkspace");
export const copyFilesWithTreeToClipboard = (
  dirPath: string,
  selectedFilePaths: string[],
  treeOption: TreeOption
) =>
  rpc("copyFilesWithTreeToClipboard", {
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
export const clearCache = () => rpc("clearCache");

export const getApplicationSettings = () =>
  rpc<{ settings: ApplicationSettings }>("getApplicationSettings");
export const updateApplicationSettings = (s: ApplicationSettings) =>
  rpc("updateApplicationSettings", { s });

/* debug helpers are forwarded unchanged */
export const debugSetLicenseState = (p: any) =>
  rpc("debugSetLicenseState", { p });
export const debugClearLicenseState = () => rpc("debugClearLicenseState");
export const debugAddUsageEntries = (c: number) =>
  rpc("debugAddUsageEntries", { c });
