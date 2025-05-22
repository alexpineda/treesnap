import { getEntries } from "./demo-repo";
import { renderAsciiTree } from "../shared/render-ascii-tree";
import { getExtension, detectBinary } from "../shared/bin-utils";

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
