use arboard::Clipboard;

use crate::constants::DEFAULT_IGNORE_PATTERNS;
use crate::domain::file_tree_node::FileTreeNode;
use std::{fs, path::Path, path::PathBuf};

// Helper function to build ignore list for a directory
pub fn build_ignore_list(dir: &Path) -> Result<ignore::gitignore::Gitignore, String> {
    let mut ignore_builder = ignore::gitignore::GitignoreBuilder::new(dir.clone());
    let gitignore = dir.join(".gitignore");
    if gitignore.exists() {
        if let Some(e) = ignore_builder.add(&gitignore) {
            eprintln!("Warning: Failed to parse .gitignore: {}", e);
        }
    }
    for line in DEFAULT_IGNORE_PATTERNS.lines() {
        ignore_builder
            .add_line(None, line.trim())
            .map_err(|e| e.to_string())?;
    }

    ignore_builder.build().map_err(|e| e.to_string())
}

// Helper function to build file content string for selected files
pub fn build_file_content_string(selected_file_paths: &[String]) -> String {
    let mut output = String::from("<file_contents>\n");

    for file_path in selected_file_paths {
        let path = PathBuf::from(file_path);
        if !path.exists() || !path.is_file() {
            eprintln!("Warning: File does not exist: {:?}", path);
            continue;
        }

        // Determine file extension for code block formatting
        let extension = path.extension().and_then(|e| e.to_str()).unwrap_or("");

        // Add file header first
        output.push_str(&format!("File: {}\n", file_path));

        // Check if likely binary *before* attempting to read as string
        if is_likely_binary_file(&path) {
            output.push_str("```");
            output.push_str(extension);
            output.push_str("\n[Binary file]\n```\n\n");
        } else {
            // Try reading as UTF-8 string
            match fs::read_to_string(&path) {
                Ok(content) => {
                    output.push_str("```");
                    output.push_str(extension);
                    output.push_str("\n");
                    output.push_str(&content);

                    // Ensure content ends with newline
                    if !content.ends_with('\n') {
                        output.push('\n');
                    }

                    output.push_str("```\n\n");
                }
                Err(e) => {
                    // If reading as string fails (e.g., unexpected encoding), log and add placeholder
                    eprintln!("Warning: Failed to read file {} as UTF-8: {}", file_path, e);
                    output.push_str("```");
                    output.push_str(extension);
                    // Use a generic placeholder
                    output.push_str("\n[Could not read content]\n```\n\n");
                }
            };
        }
    }

    output.push_str("</file_contents>");
    output
}

// Function to render a file tree as a string in ASCII format
pub fn render_tree_as_ascii(nodes: &[FileTreeNode], prefix: &str) -> String {
    let mut result = String::new();

    if nodes.is_empty() {
        return result;
    }

    for (i, node) in nodes.iter().enumerate() {
        let is_current_last = i == nodes.len() - 1;

        // Use is_current_last for the current node's prefix
        let node_prefix = if is_current_last {
            "└── "
        } else {
            "├── "
        };
        result.push_str(&format!("{}{}{}\n", prefix, node_prefix, node.name));

        if let Some(children) = &node.children {
            // Use is_current_last to determine the prefix for child connections
            let child_prefix = if is_current_last { "    " } else { "│   " };
            let new_prefix = format!("{}{}", prefix, child_prefix);
            // Pass the correct is_current_last down to the recursive call
            result.push_str(&render_tree_as_ascii(children, &new_prefix));
        }
    }

    result
}

pub fn generate_file_tree_text(root_path: &str, tree: &[FileTreeNode]) -> String {
    let mut result = format!("{}\n", root_path);
    result.push_str(&render_tree_as_ascii(tree, ""));
    result
}

pub fn copy_to_clipboard(text: &str) -> Result<(), String> {
    // Copy to clipboard
    match Clipboard::new() {
        Ok(mut clipboard) => {
            clipboard
                .set_text(text)
                .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;
            Ok(())
        }
        Err(e) => Err(format!("Failed to access clipboard: {}", e)),
    }
}

// Decide if a file is “likely” binary by scanning a partial chunk.
pub fn is_likely_binary_file(path: &Path) -> bool {
    // Limit how many bytes to inspect
    const MAX_BYTES: usize = 2048;
    let bytes = match fs::read(path) {
        Ok(b) => b,
        Err(_) => return true, // If we can't read at all, treat as "binary" skip.
    };
    let check_len = bytes.len().min(MAX_BYTES);

    // If there's a lot of control chars or null bytes, consider it binary
    let mut control_count = 0;
    for &b in bytes[..check_len].iter() {
        if b == 0 {
            // immediate giveaway
            return true;
        }
        // ASCII 7 and below or 14 and below, etc. Tweak as you wish
        if b < 32 && b != b'\n' && b != b'\r' && b != b'\t' {
            control_count += 1;
        }
    }
    // e.g. if > 10% control chars => treat as binary
    control_count as f64 / check_len as f64 > 0.10
}
