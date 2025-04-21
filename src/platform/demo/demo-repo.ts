// src/platform/demo‑repo.ts ­– runs only in the web build
import type { FileTreeNode } from "../../types";

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

/** crude “token” count = number of whitespace‑separated words */
const countTokens = (text: string) => text.trim().split(/\s+/).length;

/** Convert flat path list → FileTreeNode[] (dirs first, alpha sort) */
export function buildFileTree(
  root: string,
  entries: [path: string, source: string][]
): FileTreeNode[] {
  // helper to insert a path into a nested tree
  const insert = (
    parts: string[],
    idx: number,
    list: FileTreeNode[],
    fullPath: string,
    tokens: number
  ) => {
    const name = parts[idx];
    const isDir = idx < parts.length - 1;

    let node = list.find((n) => n.name === name);
    if (!node) {
      node = {
        name,
        path: root + "/" + parts.slice(0, idx + 1).join("/"),
        is_directory: isDir,
        children: isDir ? [] : undefined,
      } as FileTreeNode;
      list.push(node);
    }
    if (isDir) insert(parts, idx + 1, node.children!, fullPath, tokens);
  };

  const tree: FileTreeNode[] = [];
  for (const [p, src] of entries) {
    const rel = p.replace(root + "/", "");
    insert(rel.split("/"), 0, tree, p, countTokens(src));
  }

  // sort dirs first then alpha
  const sortRecursive = (nodes: FileTreeNode[]): FileTreeNode[] =>
    nodes
      .sort((a, b) =>
        a.is_directory === b.is_directory
          ? a.name.localeCompare(b.name)
          : a.is_directory
          ? -1
          : 1
      )
      .map((n) =>
        n.children ? { ...n, children: sortRecursive(n.children) } : n
      );
  return sortRecursive(tree);
}

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
