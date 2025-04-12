use crate::domain::file_tree_node::FileTreeNode;
use std::{
    fs,
    path::{Path, PathBuf},
    sync::Arc,
};

use super::{file_service::build_ignore_list, token_service::fill_tokens_in_tree};

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

        let is_dir = path.is_dir();
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        let last_modified = entry
            .metadata()
            .unwrap()
            .modified()
            .unwrap()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

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
                        last_modified: Some(last_modified),
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
                last_modified: Some(last_modified),
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
    let mut tree = build_tree_sync(&dir, &dir, &ig)?;

    if with_tokens_sync {
        let bpe = Arc::new(
            tiktoken_rs::get_bpe_from_model("gpt-4o")
                .map_err(|e| format!("Failed to initialize tokenizer: {}", e))?,
        );

        fill_tokens_in_tree(&mut tree, bpe).await?;
    }

    Ok(tree)
}
