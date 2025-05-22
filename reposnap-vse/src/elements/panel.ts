// src/extension/panel.ts
import * as vscode from "vscode";
import { wireRpc } from "../functions/rpc";

export const webViewOptions = (ctx: vscode.ExtensionContext) =>
  ({
    enableScripts: true,
    retainContextWhenHidden: true,
    localResourceRoots: [vscode.Uri.joinPath(ctx.extensionUri, "webview")], // whitelist /dist/**
  } satisfies vscode.WebviewPanelOptions & vscode.WebviewOptions);

/** createPanel(ctx)
 *  – builds the webview HTML *at runtime* (no work at module-load)
 *  – auto-detects the Vite-hashed JS & CSS in /dist/assets
 *  – drops in tight CSP + nonce + <base> so all other relative
 *    URLs (png, webmanifest, …) “just work”
 */
export const createPanel = (ctx: vscode.ExtensionContext) => {
  const panel = vscode.window.createWebviewPanel(
    "treesnapView",
    "TreeSnap",
    vscode.ViewColumn.Two,
    webViewOptions(ctx)
  );

  return panel;
};

export const loadPanel = async (
  panel: vscode.WebviewPanel,
  ctx: vscode.ExtensionContext
) => {
  // ⇢ locate the hashed files produced by Vite
  const dist = vscode.Uri.joinPath(ctx.extensionUri, "webview");
  console.log("dist", dist);
  const assets = vscode.Uri.joinPath(dist, "assets");
  const entries = await vscode.workspace.fs.readDirectory(assets);
  const jsFile = entries.find(
    ([n]) => n.startsWith("index-") && n.endsWith(".js")
  )?.[0];
  const cssFile = entries.find(
    ([n]) => n.startsWith("index-") && n.endsWith(".css")
  )?.[0];
  if (!jsFile || !cssFile) {
    console.error("build assets missing – run `bun build` first");
    throw new Error("build assets missing – run `bun build` first");
  }

  // ⇢ helpers
  const webUri = (u: vscode.Uri) => panel.webview.asWebviewUri(u).toString();
  const nonce = [...Array(16)]
    .map(() => Math.random().toString(36)[2])
    .join("");

  wireRpc(panel, ctx);

  // ⇢ final HTML
  panel.webview.html = /*html*/ `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base href="${webUri(dist)}/">             <!-- let relative URLs resolve -->
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none';
                 img-src ${panel.webview.cspSource} https:;
                 style-src ${panel.webview.cspSource} 'unsafe-inline';
                 script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${webUri(vscode.Uri.joinPath(assets, cssFile))}">
  <title>TreeSnap</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" nonce="${nonce}" src="${webUri(
    vscode.Uri.joinPath(assets, jsFile)
  )}"></script>
</body>
</html>`;
  return panel;
};
