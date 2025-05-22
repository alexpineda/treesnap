// Helper function to get file extension
export function getExtension(filePath: string): string {
  // Extract the part after the last dot
  const lastDotIndex = filePath.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === filePath.length - 1) {
    // No extension or ends with a dot
    return "";
  }
  return filePath.substring(lastDotIndex + 1);
}

// Simple binary detection based on extension
const BIN_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "bmp",
  "ico",
  "webp",
  "pdf",
  "zip",
  "gz",
  "tar",
  "7z",
  "rar",
  "exe",
  "dll",
  "so",
  "class",
  "wasm",
  "jar",
  "ttf",
  "otf",
  "woff",
  "woff2",
]);

export function detectBinary(filePath: string): boolean {
  return BIN_EXT.has(getExtension(filePath).toLowerCase());
}
