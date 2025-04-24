import type { FileTreeNode } from "../../types";
import { RepoSizeCapError } from "../shared";
import { buildFileTree } from "./demo-repo"; // already does path→tree
import { encode } from "gpt-tokenizer";

export const VFS_PREFIX = "fs://"; // string surface
export const FILE_CAP = 5_000;
export const BYTE_CAP = 5 * 1024 * 1024; // 5 MiB

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
export const getFileTree = async (
  root: FileSystemDirectoryHandle
): Promise<File[]> => {
  let bytes = 0;
  const files: File[] = [];
  const walk = async (h: FileSystemDirectoryHandle) => {
    for await (const [, handle] of h.entries()) {
      if (handle.kind === "directory") await walk(handle);
      else {
        const f = await handle.getFile();
        bytes += f.size;
        files.push(f);
        if (files.length > FILE_CAP || bytes > BYTE_CAP)
          throw new RepoSizeCapError(files.length, bytes);
      }
    }
  };
  await walk(root);
  return files;
};

/* tokenise -------------------------------- */
export const calculateTokensForFiles = async (
  files: File[]
): Promise<Record<string, number>> => {
  const out: Record<string, number> = {};
  for (const f of files) {
    out[f.webkitRelativePath || f.name] = encode(await f.text()).length;
  }
  return out;
};

/** turns a DirHandle into a registered virtual workspace and returns its id  */
export const registerWorkspace = async (handle: FileSystemDirectoryHandle) => {
  const id = `${VFS_PREFIX}${crypto.randomUUID()}`;

  names.set(id, handle.name); // << NEW

  const files = await getFileTree(handle); // throws RepoSizeCapError
  const tokens = await calculateTokensForFiles(files);

  // adapt existing helper → paths prefixed w/ id so UI sees unique strings
  const fileData = await Promise.all(
    files.map(
      async (f: File): Promise<[string, string]> => [
        id + "/" + (f.webkitRelativePath || f.name),
        await f.text(),
      ]
    )
  );
  const tree = buildFileTree(
    id, // root path
    fileData
  );

  workspaces.set(id, { id, handle, files, tokens, tree });
  return id;
};

export const getDisplayName = (id: string) => names.get(id); // << NEW

export const get = (id: string) => workspaces.get(id);
export const unregister = (id: string) => workspaces.delete(id);
export const isVfsPath = (path: string) => path.startsWith(VFS_PREFIX);
