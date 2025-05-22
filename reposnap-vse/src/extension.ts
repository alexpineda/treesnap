import * as vscode from "vscode";
import * as cmds from "./commands";
import * as elements from "./elements/statusbar";
import * as config from "./config";
import { outputChannel } from "./elements/output-channel";
import { createPanel, loadPanel, webViewOptions } from "./elements/panel";

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {

  const openPanelCommand = cmds.openPanelCommand(async () => {
    if (panel) {
      // Check if panel is properly loaded
      try {
        panel.reveal(vscode.ViewColumn.Two);
        // Verify if HTML content is loaded, if not, reload it
        if (!panel.webview.html || panel.webview.html.trim() === "") {
          await loadPanel(panel, context);
        }
        return panel;
      } catch (error) {
        // If revealing fails, panel might be disposed but reference still exists
        console.error("Error revealing panel:", error);
        panel = undefined; // Reset panel reference
      }
    }
    
    // Create new panel if it doesn't exist or was disposed
    panel = createPanel(context);
    panel.onDidDispose(
      () => {
        panel = undefined;
      },
      null,
      context.subscriptions
    );
    await loadPanel(panel, context);
    panel.reveal();
  });

  /* optional: restore panel after VS Code reload */
  vscode.window.registerWebviewPanelSerializer("treesnapView", {
    async deserializeWebviewPanel(webviewPanel) {
      panel = webviewPanel; // re-attach singleton
      panel.webview.options = webViewOptions(context);
      panel.onDidDispose(
        () => {
          panel = undefined;
        },
        null,
        context.subscriptions
      );
      await loadPanel(panel, context);
      // if you rely on setState/getState restore here
    },
  });

  const statusIndicator = elements.createStatusIndicator();

  context.subscriptions.push(openPanelCommand, statusIndicator);
}

export function deactivate() {
  // Clean up panel reference on deactivation
  panel = undefined;
}
