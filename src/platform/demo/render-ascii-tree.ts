// utils/demo-export.ts -------------------------------------------------

/**
 * Render a minimal ASCII tree for the subset of files we’re exporting.
 *      .
 *      ├── src
 *      │   └── index.ts  (123 tokens)
 *      └── package.json  (17 tokens)
 */
export function renderAsciiTree(
  files: { path: string; tokenCount?: number }[],
  rootDir: string
): string {
  // normalise → relative paths
  const rels = files.map((f) => ({
    parts: f.path
      .replace(rootDir, "")
      .replace(/^[/\\]/, "")
      .split(/[/\\]/),
    path: f.path,
    tokens: f.tokenCount ?? 0,
  }));

  // build a nested object tree
  type Node = {
    name: string;
    children?: Record<string, Node>;
    tokens?: number;
  };
  const root: Node = { name: "." };

  for (const { parts, tokens } of rels) {
    let cur = root;
    parts.forEach((seg, i) => {
      cur.children ??= {};
      cur = cur.children[seg] ??= { name: seg };
      if (i === parts.length - 1) cur.tokens = tokens;
    });
  }

  // DFS printer
  const lines: string[] = [];
  const walk = (node: Node, prefix = "", isLast = true) => {
    if (node !== root) {
      const connector = isLast ? "└── " : "├── ";
      const tokenSuffix =
        node.tokens !== undefined ? `  (${node.tokens} tokens)` : "";
      lines.push(prefix + connector + node.name + tokenSuffix);
      prefix += isLast ? "    " : "│   ";
    }
    if (node.children) {
      const entries = Object.values(node.children);
      entries.forEach((child, idx) =>
        walk(child, prefix, idx === entries.length - 1)
      );
    }
  };
  walk(root);
  return lines.join("\n");
}

/** produces the final blob we put on the clipboard */
export async function buildDemoExportText(
  workspace: string,
  selected: { path: string; tokenCount?: number }[],
  separator = "\n\n---\n\n"
): Promise<string> {
  const tree = renderAsciiTree(selected, workspace);

  // naïve fetch – in real demo you might embed a truncated placeholder instead
  const fileTexts = await Promise.all(
    selected.map(async (f) => {
      const text = await fetch(
        `/demo-workspace${f.path.replace(workspace, "")}`
      )
        .then((r) => r.text())
        .catch(() => "// file omitted in demo");
      return `// ${f.path}\n${text}`;
    })
  );

  return tree + separator + fileTexts.join(separator);
}
