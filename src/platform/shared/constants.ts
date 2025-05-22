export const __WEB_DEMO__ =
  import.meta.env.MODE === "web-demo" || import.meta.env.MODE === "vscode";
export const __DEV__ = import.meta.env.MODE === "development";
export const __VSCODE__ = import.meta.env.MODE === "vscode";