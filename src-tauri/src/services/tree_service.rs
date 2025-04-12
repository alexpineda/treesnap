use crate::domain::file_tree_node::FileTreeNode;
use std::{
    fs::{self, Metadata},
    path::{Path, PathBuf},
    sync::Arc,
};

use super::{file_service::build_ignore_list, token_service::fill_tokens_in_tree};

// Helper function to get last modified time in seconds since UNIX_EPOCH
fn get_last_modified_secs(metadata: Result<Metadata, std::io::Error>) -> Result<u64, String> {
    metadata
        .map_err(|e| format!("Failed to get metadata: {}", e))?
        .modified()
        .map_err(|e| format!("Failed to get modified time: {}", e))?
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .map_err(|e| format!("System time is before UNIX EPOCH: {}", e))
}

// Synchronous recursive function to build the file tree structure
pub fn build_tree_sync(
    path: &Path,
    base_dir: &Path,
    ig: &ignore::gitignore::Gitignore,
) -> Result<Vec<FileTreeNode>, String> {
    let mut nodes = Vec::new();

    let entries = fs::read_dir(path)
        .map_err(|e| format!("Failed to read directory: {}: {}", path.display(), e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        let rel_path = path.strip_prefix(base_dir).unwrap_or(&path);

        // Skip if path is ignored
        // Use is_dir() hint for matching
        if ig.matched(rel_path, path.is_dir()).is_ignore() {
            continue;
        }

        let metadata_result = entry.metadata();
        let is_dir = metadata_result
            .as_ref()
            .map(|m| m.is_dir())
            .unwrap_or(false);

        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        let last_modified = get_last_modified_secs(metadata_result).ok();

        if is_dir {
            // Recurse synchronously
            match build_tree_sync(&path, base_dir, ig) {
                Ok(children) if !children.is_empty() => {
                    // Only add dir if it has non-ignored children
                    nodes.push(FileTreeNode {
                        name: file_name,
                        path: path.to_string_lossy().to_string(),
                        children: Some(children),
                        is_directory: true,
                        token_count: None, // Will be filled later if needed (though usually None for dirs)
                        last_modified,
                    });
                }
                Ok(_) => {}              // Skip empty directories
                Err(e) => return Err(e), // Propagate errors
            }
        } else {
            // Just record a file node for now
            nodes.push(FileTreeNode {
                name: file_name,
                path: path.to_string_lossy().to_string(),
                children: None,
                is_directory: false,
                token_count: None, // Will be filled later
                last_modified,
            });
        }
    }

    // Sort directories first, then files
    nodes.sort_by(|a, b| match (a.is_directory, b.is_directory) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.cmp(&b.name),
    });

    Ok(nodes)
}

// Helper function to filter tree to only include selected files
pub fn filter_tree_to_selected(tree: &mut Vec<FileTreeNode>, selected_paths: &[String]) {
    let selected_paths: std::collections::HashSet<_> = selected_paths.iter().collect();

    // Helper function to recursively filter the tree
    fn filter_node(
        node: &mut FileTreeNode,
        selected_paths: &std::collections::HashSet<&String>,
    ) -> bool {
        if !node.is_directory {
            return selected_paths.contains(&node.path);
        }

        if let Some(children) = &mut node.children {
            let mut new_children = Vec::new();
            for mut child in children.drain(..) {
                if filter_node(&mut child, selected_paths) {
                    new_children.push(child);
                }
            }
            node.children = if new_children.is_empty() {
                None
            } else {
                Some(new_children)
            };
        }

        node.children.is_some()
    }

    // Filter the tree
    tree.retain_mut(|node| filter_node(node, &selected_paths));
}

pub async fn get_file_tree(
    dir_path: String,
    with_tokens_sync: bool,
) -> Result<Vec<FileTreeNode>, String> {
    let dir = PathBuf::from(&dir_path);
    if !dir.exists() || !dir.is_dir() {
        return Err(format!(
            "Directory does not exist or is not a directory: {:?}",
            dir
        ));
    }

    let ig = build_ignore_list(&dir)?;
    // Build the tree for the children first
    let mut children_nodes = build_tree_sync(&dir, &dir, &ig)?;

    // Get root directory metadata and name
    let root_metadata = fs::metadata(&dir);
    let root_last_modified = get_last_modified_secs(root_metadata)?;
    let root_name = dir
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(&dir_path)
        .to_string(); // Fallback to full path if name fails
    let root_path = dir.to_string_lossy().to_string();

    if with_tokens_sync {
        let bpe = Arc::new(
            tiktoken_rs::get_bpe_from_model("gpt-4o")
                .map_err(|e| format!("Failed to initialize tokenizer: {}", e))?,
        );

        // Fill tokens for the children
        fill_tokens_in_tree(&mut children_nodes, bpe).await?;
    }

    // Calculate root token count if tokens were calculated
    let root_token_count = if with_tokens_sync {
        // Sum tokens from all children nodes. unwrap_or(0) handles potential None for child directories without countable files.
        Some(
            children_nodes
                .iter()
                .map(|node| node.token_count.unwrap_or(0))
                .sum(),
        )
    } else {
        None
    };

    // Create the root node
    let root_node = FileTreeNode {
        name: root_name,
        path: root_path,
        // Only assign children if the vector is not empty
        children: if children_nodes.is_empty() {
            None
        } else {
            Some(children_nodes)
        },
        is_directory: true,
        token_count: root_token_count,
        last_modified: Some(root_last_modified),
    };

    Ok(vec![root_node]) // Return the single root node wrapped in a Vec
}
