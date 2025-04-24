// utils/demo-export.ts -------------------------------------------------

/**
 * Render a minimal ASCII tree for the subset of files we're exporting.
 *      .
 *      ├── src
 *      │   └── index.ts  (123 tokens)
 *      └── package.json  (17 tokens)
 */

import { getEntries } from "./demo-repo"; // Assuming demo-repo.ts is in the same directory

// Define the Node structure used internally
type Node = {
  name: string;
  children?: Record<string, Node>;
  tokens?: number; // Keep token info if available
  isDir: boolean;
};

// Recursive helper function to render the tree
function renderNode(node: Node, prefix = "", isLast = true): string {
  const lines: string[] = [];
  const connector = isLast ? "└── " : "├── ";
  const tokenSuffix =
    node.tokens !== undefined ? `  (${node.tokens} tokens)` : "";

  lines.push(
    prefix + connector + node.name + (node.isDir ? "/" : "") + tokenSuffix
  );

  if (node.children) {
    const childPrefix = prefix + (isLast ? "    " : "│   ");
    const entries = Object.values(node.children).sort((a, b) =>
      a.name.localeCompare(b.name)
    ); // Sort children alphabetically

    entries.forEach((child, idx) => {
      lines.push(
        ...renderNode(child, childPrefix, idx === entries.length - 1).split(
          "\n"
        )
      );
    });
  }

  return lines.filter(Boolean).join("\n"); // Filter out potential empty lines
}

export function renderAsciiTree(
  files: { path: string; tokenCount?: number }[],
  rootDir: string
): string {
  // Build the nested object tree
  const root: Node = { name: ".", isDir: true };

  for (const file of files) {
    // Normalize path relative to rootDir
    let relativePath = file.path.replace(rootDir, "");
    // Remove leading slash (either / or \)
    if (relativePath.startsWith("/") || relativePath.startsWith("\\")) {
      relativePath = relativePath.substring(1);
    }
    if (!relativePath) continue; // Skip if it's the root directory itself

    const parts = relativePath.split(/[\\/]/); // Split by / or \
    let current = root;

    parts.forEach((part, i) => {
      current.children ??= {};
      const isLastPart = i === parts.length - 1;
      if (!current.children[part]) {
        current.children[part] = { name: part, isDir: !isLastPart };
      }
      // Update isDir flag if we encounter the same name as a directory later
      current.children[part].isDir =
        current.children[part].isDir || !isLastPart;

      current = current.children[part];
      if (isLastPart) {
        current.tokens = file.tokenCount; // Assign token count to the file node
      }
    });
  }

  // Render the tree starting from the root's children
  const rootEntries = Object.values(root.children ?? {}).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const treeLines = rootEntries.map((node, idx) =>
    renderNode(node, "", idx === rootEntries.length - 1)
  );

  return `${rootDir}\n${treeLines.join("\n")}`;
}

// Helper function to get file extension
function getExtension(filePath: string): string {
  return filePath.split(".").pop()?.toLowerCase() ?? "";
}

/** produces the final blob we put on the clipboard */
export function buildDemoExportText(
  workspace: string,
  selected: { path: string; tokenCount?: number }[]
): string {
  // 1. Generate the ASCII tree (includes root path)
  const tree = renderAsciiTree(selected, workspace);
  console.log("tree", tree);

  // 2. Get all file contents once
  const fileContentsMap = new Map(getEntries());

  console.log("fileContentsMap", fileContentsMap);
  // 3. Format each selected file according to the example
  const fileBlocks = selected.map((f) => {
    const extension = getExtension(f.path);

    // Check if the file is binary first
    if (detectBinary(f.path)) {
      // Match Rust output format for binary files
      return `File: ${f.path}\n\`\`\`${extension}\n[Binary file]\n\`\`\``;
    }

    const content = fileContentsMap.get(f.path) ?? "// file omitted in demo";

    // Use extension directly for the code fence, matching Rust behavior
    return `File: ${f.path}\n\`\`\`${extension}\n${content}\n\`\`\``;
  });

  console.log("fileBlocks", fileBlocks);

  // 4. Join the file blocks with TWO newlines between them (matching Rust)
  const allFileBlocks = fileBlocks.join("\n\n");
  console.log("allFileBlocks", allFileBlocks);

  // 5. Construct the final string
  return (
    `<file_map>\n` +
    `${tree}\n\n` + // Keep two newlines after the tree
    `</file_map>\n` +
    `<file_contents>\n` +
    `${allFileBlocks}\n` + // Content ends with ```, so one newline is enough before </file_contents>
    `</file_contents>`
  );
}

// Simple binary detection based on extension (only PNG for now)
export function detectBinary(filePath: string): boolean {
  return getExtension(filePath) === "png";
}
