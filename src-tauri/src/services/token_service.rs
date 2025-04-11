use futures::future::join_all;
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    sync::Arc,
};
use tiktoken_rs::{self, CoreBPE};

use crate::domain::file_tree_node::FileTreeNode;

/// Calculate tokens for a specific file.
pub async fn calculate_file_tokens(file_path: String) -> Result<usize, String> {
    let path = PathBuf::from(file_path);
    if !path.exists() || !path.is_file() {
        return Err(format!("File does not exist: {:?}", path));
    }

    let content = match fs::read_to_string(&path) {
        Ok(content) => content,
        Err(e) => return Err(format!("Failed to read file: {}", e)),
    };

    // Use GPT-4o tokenizer for consistent counting
    let bpe = match tiktoken_rs::get_bpe_from_model("gpt-4o") {
        Ok(bpe) => bpe,
        Err(e) => return Err(format!("Failed to initialize tokenizer: {}", e)),
    };

    let encoded = bpe.encode_with_special_tokens(&content);
    Ok(encoded.len())
}

// Calculate tokens for specific files
pub async fn calculate_tokens_for_files(
    file_paths: Vec<String>,
) -> Result<HashMap<String, usize>, String> {
    let bpe = Arc::new(
        tiktoken_rs::get_bpe_from_model("gpt-4o")
            .map_err(|e| format!("Failed to initialize tokenizer: {}", e))?,
    );

    // Debug: log the paths we received
    println!("Received {} paths for token calculation", file_paths.len());
    for (i, path) in file_paths.iter().enumerate().take(3) {
        println!("  Path {}: {}", i, path);
    }
    if file_paths.len() > 3 {
        println!("  ... and {} more", file_paths.len() - 3);
    }

    // Simple approach with direct task spawning
    let mut tasks = Vec::new();
    for path_str in file_paths {
        let path = PathBuf::from(&path_str);
        let bpe_clone = bpe.clone();

        tasks.push(tokio::spawn(async move {
            // Use the original path_str for the result to ensure exact matching
            let result_path = path_str.clone();

            let content = match fs::read_to_string(&path) {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("Warning: Failed to read file {}: {}", path.display(), e);
                    return (result_path, 0);
                }
            };
            let encoded = bpe_clone.encode_with_special_tokens(&content);
            (result_path, encoded.len())
        }));
    }

    let results = join_all(tasks).await;
    let mut token_map = HashMap::new();
    for result in results {
        match result {
            Ok((path_str, count)) => {
                token_map.insert(path_str, count);
            }
            Err(e) => {
                eprintln!("Warning: Token calculation task failed: {}", e);
            }
        }
    }

    // Debug: log what we're returning
    println!("Returning token map with {} entries", token_map.len());

    Ok(token_map)
}

// Asynchronous function to fill token counts into an existing tree structure
pub async fn fill_tokens_in_tree(
    nodes: &mut [FileTreeNode],
    bpe: Arc<CoreBPE>,
) -> Result<(), String> {
    let mut file_nodes: Vec<&mut FileTreeNode> = Vec::new();

    // Collect mutable references to all file nodes first (non-recursive)
    fn collect_file_nodes<'a>(
        nodes: &'a mut [FileTreeNode],
        file_nodes: &mut Vec<&'a mut FileTreeNode>,
    ) {
        for node in nodes.iter_mut() {
            if node.is_directory {
                if let Some(children) = node.children.as_mut() {
                    collect_file_nodes(children, file_nodes);
                }
            } else {
                file_nodes.push(node);
            }
        }
    }
    collect_file_nodes(nodes, &mut file_nodes);

    // Create tasks for each file node
    let mut tasks = Vec::new();
    for node in file_nodes.iter() {
        // Iterate over immutable refs first to create tasks
        let path = node.path.clone(); // Clone path for the task
        let bpe_clone = bpe.clone();
        tasks.push(tokio::spawn(async move {
            let content = match fs::read_to_string(&path) {
                Ok(c) => c,
                // If read fails, return 0 tokens for this file
                Err(e) => {
                    eprintln!("Warning: Failed to read file {}: {}", path, e);
                    return (path, 0); // Return 0 tokens on error
                }
            };
            let encoded = bpe_clone.encode_with_special_tokens(&content);
            (path, encoded.len())
        }));
    }

    // Await all tasks and collect results
    let results = join_all(tasks).await;

    // Create a map for efficient lookup
    let mut token_map = std::collections::HashMap::new();
    for result in results {
        match result {
            Ok((path, count)) => {
                token_map.insert(path, count);
            }
            Err(e) => eprintln!("Warning: Token calculation task failed: {}", e), // Log join errors
        }
    }

    // Update the nodes using the map (iterate mutably again)
    for node in file_nodes {
        // Now iterate over mutable refs to update
        if let Some(count) = token_map.get(&node.path) {
            node.token_count = Some(*count);
        }
    }

    Ok(())
}
