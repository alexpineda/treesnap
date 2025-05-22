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
  refCode?: string | null;
  refCodeExpiresAt?: string | null;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApplicationSettings {
  schemaVersion: number;
  appVersion: string;
  treeOption: TreeOption;
}

export type TauriApiErrorInternal = {
  code: string;
  message: string;
};

export type LicenseStateResponse = {
  state: LocalLicenseState | null;
  error: TauriApiError | null;
};

export class TauriApiError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
  static fromInternal(error: TauriApiErrorInternal): TauriApiError {
    return new TauriApiError(error.message, error.code);
  }
}

export function isTauriApiError(error: any): error is TauriApiErrorInternal {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    "message" in error &&
    typeof error.message === "string"
  );
}

export class RepoSizeCapError extends Error {
  constructor(public files: number, public bytes: number) {
    console.log("RepoSizeCapError", files, bytes);
    super("Repo too large for web version");
  }
}

export interface WorkspaceLimitStatus {
  allowed: boolean;
  used: number;
  limit: number;
  // client side only
  error: TauriApiError | null;
}
