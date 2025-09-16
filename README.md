# Tree Snap

## Flatten repos. Prompt faster.

> One click → one GPT-ready file

TreeSnap is a GUI for quickly concatenating your code files for inputting into your favorite LLM. Useful for when you need analysis or design help on existing code files across a codebase. Cross-platform, web, and VS Code extensions available.

<a href="www.treesnap.app" target="_blank"><img src="https://littlehtmxbook.com/ad1-300x250.png"/></a>


[Visit the website](www.treesnap.app)

# Development
Tauri app with additional web and vscode backends. Rust installation is required.

Tauri:
`bun run tauri dev`

Web:
`bun run dev:web-demo`

For VSCode, build the front end
`bun run build:vscode`

this will place the front end app in `./reposnap-vse/webview`
and then run the extension from `./reposnap-vse` sub repository