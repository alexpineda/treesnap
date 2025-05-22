import * as vscode from "vscode";

const isDebug = true;

export const outputChannel = vscode.window.createOutputChannel("Treesnap");

export const debugChannel = (msg: string) => {
  if (isDebug) {
    outputChannel.appendLine(msg);
  }
};
