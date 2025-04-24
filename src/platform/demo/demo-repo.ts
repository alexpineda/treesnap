// src/platform/demo‑repo.ts ­– runs only in the web build
import { countTokens } from "gpt-tokenizer";
import { buildFileTree } from "./virtual-fs";

/*
 * Vite pulls every file in the demo repo into the bundle and gives you a map:
 *   { "/demo-repos/nanoid/README.md": () => "file contents …", … }
 *
 * `eager:true` makes the contents available synchronously so we can
 * synchronously compute token counts / file tree.
 *
 * Put your OSS repo under ./demo-repos/<name>  (any folder inside src or public)
 */

const ROOT_PATH = "./repos";
export const DEMO_WORKSPACE_PATH = "./repos/nanoid";
const workspaces: Record<string, Record<string, string>> = {
  "./repos/nanoid": import.meta.glob("./repos/nanoid/**", {
    as: "raw",
    eager: true,
  }) as Record<string, string>,
};
// const modules = import.meta.glob("./repos/nanoid/**", {
//   as: "raw",
//   eager: true,
// }) as Record<string, string>;

/* ---------- PUBLIC API USED BY THE APP ---------- */
let _workspace: Record<string, string> | null = null;
let _fileTokens: Record<string, number> | null = null;

export const getEntries = () => {
  return Object.entries(_workspace!);
};

const calcDemoFileTokens = (): Record<string, number> =>
  Object.fromEntries(getEntries().map(([p, src]) => [p, countTokens(src)]));

export const getDemoFileTokens = () => {
  if (!_fileTokens) {
    _fileTokens = calcDemoFileTokens();
  }
  return _fileTokens;
};

export const createDemoFileTree = (workspacePath: string) => {
  const workspace = workspaces[workspacePath];
  if (!workspace) {
    alert(`Workspace ${workspacePath} not found`);
    return [];
  }
  _workspace = workspace;
  _fileTokens = getDemoFileTokens();
  return buildFileTree(ROOT_PATH, getEntries());
};
