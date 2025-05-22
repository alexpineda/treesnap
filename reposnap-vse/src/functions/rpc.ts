import * as vscode from "vscode";
import * as fs from "node:fs/promises";
import path from "node:path";

// lazy-import to avoid blocking the extension host
let encode: typeof import("gpt-tokenizer").encode | null = null;
async function getEncode() {
  if (!encode) encode = (await import("gpt-tokenizer")).encode;
  return encode;
}

import type {
  ApplicationSettings,
  LocalLicenseState,
  FileTreeNode,
  RecentWorkspace,
  WorkspaceLimitStatus,
} from "@/shared/types";
import { debugChannel } from "../elements/output-channel";
import { buildIgnoreMatcher } from "./ignore";
import { renderAsciiTree } from "./render-ascii-tree";
import { detectBinary } from "./bin-utils";
import { listAllFiles } from "./file-utils";

/* ---------------------------------------------------------------------------
   GLOBAL STATE
--------------------------------------------------------------------------- */
const watcherMap = new Map<string, vscode.FileSystemWatcher>();
const recentKey = "treesnap.recentWorkspaces"; // ← globalState key

/* util: start / stop VS Code watcher ------------------------------------- */
function startWatcher(root: string, panel: vscode.WebviewPanel) {
  const pat = new vscode.RelativePattern(root, "**/*");
  const fsw = vscode.workspace.createFileSystemWatcher(
    pat,
    false,
    false,
    false
  );

  const push = (kind: string, uri: vscode.Uri) =>
    panel.webview.postMessage({
      // 0 = broadcast notification (not tied to an RPC id)
      id: 0,
      event: "files-changed-event",
      payload: [{ path: uri.fsPath, kind }],
    });

  fsw.onDidCreate((u) => push("create", u));
  fsw.onDidChange((u) => push("modify", u));
  fsw.onDidDelete((u) => push("remove", u));

  watcherMap.set(root, fsw);
}

function stopWatcher(root?: string) {
  if (root) {
    watcherMap.get(root)?.dispose();
    watcherMap.delete(root);
  } else {
    // nuke all
    watcherMap.forEach((w) => w.dispose());
    watcherMap.clear();
  }
}

function resolveDir(dirPath: string): string {
  if (dirPath !== "workspace") return dirPath;
  const ws = vscode.workspace.workspaceFolders?.[0];
  if (!ws) throw new Error("No folder workspace is open in VS Code.");
  return ws.uri.fsPath;
}

async function getRecent(ctx: vscode.ExtensionContext): Promise<string[]> {
  // Filter out paths that no longer exist
  const recentPaths = ctx.globalState.get<string[]>(recentKey) ?? [];
  const existingPaths: string[] = [];
  for (const p of recentPaths) {
    try {
      // Use workspace.fs for consistent async operations and URI handling
      await vscode.workspace.fs.stat(vscode.Uri.file(p));
      existingPaths.push(p);
    } catch {
      // Ignore paths that don't exist anymore
      debugChannel(`Recent workspace path not found, removing: ${p}`);
    }
  }
  // Update the global state only if paths were actually removed
  if (existingPaths.length < recentPaths.length) {
    await ctx.globalState.update(recentKey, existingPaths);
  }
  return existingPaths;
}

async function saveRecent(ctx: vscode.ExtensionContext, list: string[]) {
  await ctx.globalState.update(recentKey, list.slice(0, 10)); // keep 10
}

export function wireRpc(
  panel: vscode.WebviewPanel,
  ctx: vscode.ExtensionContext
) {
  panel.webview.onDidReceiveMessage(async (msg) => {
    const { id, cmd, payload } = msg as {
      id: number;
      cmd: string;
      payload: any;
    };
    let result: unknown, error: unknown;
    console.log("msg", msg);
    try {
      switch (cmd) {
        case "getVersion":
          result = vscode.extensions.getExtension("yourPublisher.yourId")!
            .packageJSON.version as string;
          break;

        case "openDirectoryDialog": {
          const uris = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
          });
          result = (uris?.[0]?.fsPath ?? null) as string | null;
          break;
        }

        case "openWorkspace": {
          const dirPath = resolveDir((payload as { dirPath: string }).dirPath)

          // 1) build tree
          result = await walkDir(dirPath, false, getEncode) as FileTreeNode[];

          // 2) start watcher (idempotent – we replace if exists)
          stopWatcher(dirPath); // Stop existing watcher for this path if any
          startWatcher(dirPath, panel);

          // 3) persist in "recent"
          const rec = await getRecent(ctx);
          // Add the new path to the beginning and remove duplicates
          const updatedRecent = [dirPath, ...rec.filter((p) => p !== dirPath)];
          await saveRecent(ctx, updatedRecent);
          break;
        }

        case "closeWorkspace": {
          // Expecting { dirPath: string } in payload potentially
          const dirPathToClose = payload?.dirPath;
          if (dirPathToClose && typeof dirPathToClose === "string") {
            stopWatcher(dirPathToClose);
          } else {
            // Optionally log an error or handle case where dirPath is missing/invalid
            debugChannel(
              `closeWorkspace called without a valid dirPath: ${payload?.dirPath}`
            );
          }
          result = null; // Indicate success or simply no return value needed
          break;
        }

        case "getFileTree": {
          const dirPath = resolveDir(payload.dirPath)
          result = await walkDir(
            dirPath,
            payload.withTokensSync,
            getEncode
          ) as FileTreeNode[];
          break;
        }

        case "calculateFileTokens": {
          const txt = await fs.readFile(payload.filePath, "utf8");
          const tokenizer = await getEncode();
          result = tokenizer(txt).length as number;
          break;
        }

        case "calculateTokensForFiles": {
          const tokenizer = await getEncode();
          result = Object.fromEntries(
            await Promise.all(
              (payload.filePaths as string[]).map(async (p) => {
                const txt = await fs.readFile(p, "utf8");
                return [p, tokenizer(txt).length];
              })
            )
          ) as Record<string, number>;
          break;
        }

        case "getApplicationSettings": {
          const defaultSettings: ApplicationSettings = {
            schemaVersion: 1,
            appVersion: "treesnap",
            treeOption: "include",
          };
          result = { settings: defaultSettings } as { settings: ApplicationSettings };
          break;
        }

        case "getLocalLicenseState": {
          const defaultState: LocalLicenseState = {
            status: "inactive",
            licenseType: undefined,
            expiresAt: null,
          };
          result = defaultState as LocalLicenseState;
          break;
        }

        case "loadRecentWorkspaces": {
          // Map the paths to the expected format for the frontend
          result = (await getRecent(ctx)).map((p) => ({ path: p })) as RecentWorkspace[];
          break;
        }

        case "saveRecentWorkspaces": {
          result = null; // No return value expected by tauri-vscode.ts (void)
          break;
        }

        case "checkWorkspaceLimit": {
          result = { allowed: true, used: 0, limit: 0, error: null } as WorkspaceLimitStatus;
          break;
        }

        case "copyFilesWithTreeToClipboard": {
          const { dirPath, selectedFilePaths, treeOption } = payload as {
            dirPath: string;
            selectedFilePaths: string[];
            treeOption: "include" | "include-only-selected" | "do-not-include";
          };

          const root = resolveDir(dirPath);

          // 1. Determine which files to include in the tree
          let filesForTree: string[] = [];
          if (treeOption === "include") {
            filesForTree = await listAllFiles(root);
          } else if (treeOption === "include-only-selected") {
            filesForTree = selectedFilePaths;
          }

          // 2. Generate ASCII tree (if needed)
          const ascii = treeOption === "do-not-include"
            ? ""
            : renderAsciiTree(
                filesForTree.map((p) => ({ path: p })), // No token count needed here
                root
              );

          // 3. Read selected file contents
          const blocks = await Promise.all(
            selectedFilePaths.map(async (file) => {
              const relativeFilePath = path.relative(root, file);
              const ext = path.extname(file).slice(1);
              if (detectBinary(file)) {
                return `File: ${relativeFilePath}\n\n\`\`\`${ext}\n[Binary file]\n\`\`\``;
              }
              try {
                const body = await fs.readFile(file, "utf8");
                return `File: ${relativeFilePath}\n\n\`\`\`${ext}\n${body}\n\`\`\``;
              } catch (readError: any) {
                debugChannel(`Error reading file ${file}: ${readError.message}`);
                return `File: ${relativeFilePath}\n\n\`\`\`${ext}\n[Error reading file: ${readError.message}]\n\`\`\``;
              }
            })
          );

          // 4. Construct the final blob
          const blob =
            ascii
              ? `<repo_map>\n${ascii}\n</repo_map>\n\n`
              : "";
          const finalBlob = `${blob}<selected_files>\n${blocks.join("\n\n---\n\n")}\n</selected_files>`;

          // 5. Copy to clipboard
          await vscode.env.clipboard.writeText(finalBlob);
          result = { success: true } as { success: boolean }; // Indicate success
          break;
        }

        default:
          debugChannel(`unknown rpc cmd ${cmd}`);
          result = null;
          error = `unknown rpc cmd ${cmd}`;
          break;
      }
    } catch (e: any) {
      error = e?.message ?? String(e);
    }

    panel.webview.postMessage({ id, result, error });
  });

  // Clean up all watchers when the panel is disposed
  panel.onDidDispose(
    () => {
      stopWatcher(); // Stop all watchers associated with this panel/webview
    },
    null,
    ctx.subscriptions
  );
}

/* -------- helper: recursively build FileTreeNode[] -------- */
async function walkDir(
  root: string,
  withTokens: boolean,
  getEncoder: () => Promise<typeof import("gpt-tokenizer").encode>
): Promise<FileTreeNode[]> {
  let ignorePatterns: string | undefined;
  try {
    ignorePatterns = await fs.readFile(path.join(root, ".gitignore"), "utf8");
  } catch (e) {
    debugChannel(`Error reading .gitignore: ${e}`);
  }
  const ig = await buildIgnoreMatcher(ignorePatterns);
  const entries = await fs.readdir(root, { withFileTypes: true });
  const out: FileTreeNode[] = [];
  for (const d of entries) {
    const full = path.join(root, d.name);

    if (ig.ignores(path.relative(root, full))) {
      continue;
    }

    try {
      // Add try-catch for individual file/dir operations
      if (d.isDirectory()) {
        out.push({
          name: d.name,
          path: full,
          is_directory: true,
          children: await walkDir(full, withTokens, getEncoder),
          token_count: undefined, // Explicitly undefined for dirs
        });
      } else if (d.isFile()) {
        // Ensure it's a file before processing
        let toks = undefined;
        if (withTokens) {
          const content = await fs.readFile(full, "utf8");
          const tokenizer = await getEncoder();
          toks = tokenizer(content).length;
        }
        out.push({
          name: d.name,
          path: full,
          is_directory: false,
          children: undefined, // Explicitly undefined for files
          token_count: toks,
        });
      }
      // Symlinks and other types are ignored by default now
    } catch (err: any) {
      // Log errors for specific entries but continue walking the directory
      debugChannel(`Error processing ${full}: ${err.message}`);
      // Optionally add an error node to the tree:
      // out.push({ name: d.name, path: full, error: err.message });
    }
  }
  return out;
}
