import { LocalLicenseState } from "../types";

export const __WEB_DEMO__ =
  import.meta.env.MODE === "web-demo" || import.meta.env.MODE === "vscode";
export const __DEV__ = import.meta.env.MODE === "development";

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
