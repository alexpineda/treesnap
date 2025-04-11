use crate::constants::DEFAULT_IGNORE_PATTERNS;
use crate::FileTreeNode;
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
    let codefetchignore = dir.join(".codefetchignore");
    if codefetchignore.exists() {
        if let Some(e) = ignore_builder.add(&codefetchignore) {
            eprintln!("Warning: Failed to parse .codefetchignore: {}", e);
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
            // Skip non-existent files
            eprintln!("Warning: File does not exist: {:?}", path);
            continue;
        }

        // Determine file extension for code block formatting
        let extension = path.extension().and_then(|e| e.to_str()).unwrap_or("");

        // Read file content
        let content = match fs::read_to_string(&path) {
            Ok(content) => content,
            Err(e) => {
                eprintln!("Warning: Failed to read file {}: {}", file_path, e);
                format!("[Error reading file: {}]", e)
            }
        };

        // Check if binary by looking for null bytes
        let is_likely_binary = content.contains('\0');

        // Add file header and content
        output.push_str(&format!("File: {}\n", file_path));

        if is_likely_binary {
            output.push_str("```");
            output.push_str(extension);
            output.push_str("\n[Binary file]\n```\n\n");
        } else {
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
