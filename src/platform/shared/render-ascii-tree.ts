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
  const tokenSuffix = "";
  //TODO add as setting option
  // node.tokens !== undefined ? `  (${node.tokens} tokens)` : "";

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
