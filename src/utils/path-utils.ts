import { isVfsPath, getDisplayName } from "../platform/shared/virtual-fs";

export const basename = (path: string) => {
  if (isVfsPath(path)) {
    return getDisplayName(path) ?? "unknown";
  }
  return path.split(/[/\\]/).pop() ?? "unknown";
};
