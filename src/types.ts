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

export interface RecentWorkspace {
  path: string;
}

export type TreeOption = "include" | "include-only-selected" | "do-not-include";
