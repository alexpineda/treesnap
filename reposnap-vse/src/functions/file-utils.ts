import * as fs from "node:fs/promises";
import * as path from "node:path";
import { buildIgnoreMatcher } from "./ignore";
import { debugChannel } from "../elements/output-channel"; // Assuming debugChannel is accessible

/**
 * Recursively lists all files in a directory, respecting .gitignore.
 */
export async function listAllFiles(dirPath: string): Promise<string[]> {
  const allFiles: string[] = [];
  let ignorePatterns: string | undefined;
  try {
    ignorePatterns = await fs.readFile(
      path.join(dirPath, ".gitignore"),
      "utf8"
    );
  } catch (e) {
    // Ignore if .gitignore doesn't exist
    debugChannel(`Could not read .gitignore in ${dirPath}: ${e}`);
  }
  const ig = await buildIgnoreMatcher(ignorePatterns);

  async function walk(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        // Check relative path against ignore rules
        const relativePath = path.relative(dirPath, fullPath);
        // Skip the root gitignore file itself if present
        if (relativePath === ".gitignore") {
            continue;
        }
        if (ig.ignores(relativePath)) {
          continue;
        }
        if (entry.isDirectory()) {
          // Also skip ignored directories explicitly
          if (!ig.ignores(relativePath + "/")) {
            await walk(fullPath);
          }
        } else if (entry.isFile()) {
          allFiles.push(fullPath);
        }
      }
    } catch (err: any) {
        debugChannel(`Error walking directory ${currentDir}: ${err.message}`);
        // Decide if you want to stop or continue
    }
  }

  await walk(dirPath);
  // debugChannel(`Listed files for ${dirPath}: ${allFiles.length}`);
  return allFiles;
} 