import * as vscode from "vscode";

export const openPanelCommand = (cb: () => void) =>
  vscode.commands.registerCommand("treesnap.openPanel", cb);
