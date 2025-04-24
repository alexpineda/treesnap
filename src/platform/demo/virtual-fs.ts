import type { FileTreeNode } from "../../types";
import { RepoSizeCapError } from "../shared";
import { encode } from "gpt-tokenizer";
import ignore, { type Ignore } from "ignore";

export const VFS_PREFIX = "fs://"; // string surface
export const FILE_CAP = 200;
export const BYTE_CAP = 2 * 1024 * 1024; // 2 MiB

// keep the Rust defaults in-sync (trim as you like)
const DEFAULT_IGNORE_PATTERNS = `
# repo internals
.git
.git/**        # sub-dirs
.gitattributes
# noise
node_modules
dist
build
.DS_Store
`;

type WebWorkspace = {
  id: string; // "fs://<uuid>"
  handle: FileSystemDirectoryHandle;
  files: File[];
  tokens: Record<string, number>;
  tree: FileTreeNode[];
};
const workspaces = new Map<string, WebWorkspace>();
const names = new Map<string, string>(); // id → folder name

/* walk DirHandle → File[] ------------------ */
/* ---- ignore helper --------------------------------------------------- */
async function buildIgnoreMatcher(
  root: FileSystemDirectoryHandle
): Promise<Ignore> {
  const ig = ignore().add(DEFAULT_IGNORE_PATTERNS);
  try {
    const giHandle = await root.getFileHandle(".gitignore");
    const giText = await (await giHandle.getFile()).text();
    ig.add(giText);
  } catch (_) {
    /* no root .gitignore — fine */
  }
  return ig;
}

/* walk DirHandle respecting ignore → [{rel, file}] --------------------- */
type WalkEntry = { rel: string; file: File };

export const getFileTree = async (
  root: FileSystemDirectoryHandle
): Promise<WalkEntry[]> => {
  const ig = await buildIgnoreMatcher(root);
  let bytes = 0;
  const out: WalkEntry[] = [];

  const walk = async (
    dir: FileSystemDirectoryHandle,
    relDir = ""
  ): Promise<void> => {
    for await (const [name, handle] of dir.entries()) {
      const relPath = relDir ? `${relDir}/${name}` : name;
      if (ig.ignores(relPath)) continue; //  ←✔ respects .gitignore

      if (handle.kind === "directory") {
        await walk(handle, relPath);
      } else {
        const f = await handle.getFile();
        bytes += f.size;
        if (out.length + 1 > FILE_CAP || bytes > BYTE_CAP)
          throw new RepoSizeCapError(out.length + 1, bytes);
        out.push({ rel: relPath, file: f });
      }
    }
  };

  await walk(root);
  return out;
};

/* tokenise -------------------------------- */
/* tokenise (we already have rel path) ---------------------------------- */
export const calculateTokensForEntries = async (
  entries: WalkEntry[]
): Promise<Record<string, number>> => {
  const out: Record<string, number> = {};
  for (const { rel, file } of entries) {
    out[rel] = encode(await file.text()).length;
  }
  return out;
};

/** turns a DirHandle into a registered virtual workspace and returns its id  */
export const registerWorkspace = async (handle: FileSystemDirectoryHandle) => {
  const id = `${VFS_PREFIX}${crypto.randomUUID()}`;

  names.set(id, handle.name); // << NEW

  const entries = await getFileTree(handle); // ignores now
  const tokens = await calculateTokensForEntries(entries);

  // adapt existing helper → paths prefixed w/ id so UI sees unique strings
  const fileData = await Promise.all(
    entries.map(
      async ({ rel, file }): Promise<[string, string]> => [
        `${id}/${rel}`,
        await file.text(),
      ]
    )
  );
  const tree = buildFileTree(
    id, // root path
    fileData
  );

  const rootNode: FileTreeNode = {
    name: handle.name || "root",
    path: id, // matches workspacePath you pass around
    is_directory: true,
    children: tree,
  };

  workspaces.set(id, {
    id,
    handle,
    files: entries.map((e) => e.file),
    tokens,
    tree: [rootNode],
  });
  return id;
};

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
/** crude "token" count = number of whitespace-separated words */
const countTokens = (text: string) => text.trim().split(/\s+/).length;

export const getDisplayName = (id: string) => names.get(id); // << NEW

export const get = (id: string) => workspaces.get(id);
export const unregister = (id: string) => workspaces.delete(id);
export const isVfsPath = (path: string) => path.startsWith(VFS_PREFIX);
