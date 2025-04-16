import type { Workspace } from "./hooks/use-workspace";

export type { Workspace };
export interface FileTreeNode {
  name: string;
  path: string;
  children?: FileTreeNode[];
  is_directory: boolean;
  selected?: boolean;
  tokenCount?: number;
  token_count?: number;
  parent?: string;
  dirPercentage?: number;
  isLoading?: boolean;
  selectionState?: "none" | "partial" | "all";
}

export interface FileChangeEvent {
  path: string;
  kind: "create" | "modify" | "remove";
}

export interface RecentWorkspace {
  path: string;
}

export type TreeOption = "include" | "include-only-selected" | "do-not-include";

export interface LocalLicenseState {
  status: "inactive" | "activated" | "expired";
  licenseType?: "basic" | "standard" | "team";
  expiresAt?: string | null;
}

export interface ApiError {
  code: string;
  message: string;
}
