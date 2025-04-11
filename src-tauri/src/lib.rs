#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod constants;

use anyhow::{Context, Result};
use arboard::Clipboard;
use chrono::{DateTime, Utc};
use futures::future::join_all;
use futures::future::FutureExt;
use ignore::{DirEntry, WalkBuilder};
use regex::Regex;
use reqwest::blocking::get;
use serde::Deserialize;
use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
    sync::Arc,
};
use tauri::Runtime;
use tauri_plugin_dialog;
use tauri_plugin_fs;
use tauri_plugin_store;
use tauri_plugin_updater::UpdaterExt;
use tiktoken_rs::CoreBPE; // For GPT-like token counting // Add this import // Add this line

use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

use constants::DEFAULT_IGNORE_PATTERNS;

/// Calculate tokens for a specific file.
#[tauri::command]
async fn calculate_file_tokens(file_path: String) -> Result<usize, String> {
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

#[derive(Debug, Serialize, Clone)]
pub struct FileTreeNode {
    name: String,
    path: String,
    children: Option<Vec<FileTreeNode>>,
    is_directory: bool,
    token_count: Option<usize>,
}

// Synchronous recursive function to build the file tree structure
fn build_tree_sync(
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

// Asynchronous function to fill token counts into an existing tree structure
async fn fill_tokens_in_tree(nodes: &mut [FileTreeNode], bpe: Arc<CoreBPE>) -> Result<(), String> {
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

// Helper function to build ignore list for a directory
fn build_ignore_list(dir: &Path) -> Result<ignore::gitignore::Gitignore, String> {
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
fn build_file_content_string(selected_file_paths: &[String]) -> String {
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

// Update get_file_tree_with_tokens to use the helper
#[tauri::command]
async fn get_file_tree_with_tokens(dir_path: String) -> Result<Vec<FileTreeNode>, String> {
    let dir = PathBuf::from(&dir_path);
    if !dir.exists() || !dir.is_dir() {
        return Err(format!(
            "Directory does not exist or is not a directory: {:?}",
            dir
        ));
    }

    let ig = build_ignore_list(&dir)?;
    let mut tree = build_tree_sync(&dir, &dir, &ig)?;

    let bpe = Arc::new(
        tiktoken_rs::get_bpe_from_model("gpt-4o")
            .map_err(|e| format!("Failed to initialize tokenizer: {}", e))?,
    );

    fill_tokens_in_tree(&mut tree, bpe).await?;

    Ok(tree)
}

// Update get_file_tree to use the helper
#[tauri::command]
async fn get_file_tree(dir_path: String) -> Result<Vec<FileTreeNode>, String> {
    let dir = PathBuf::from(&dir_path);
    if !dir.exists() || !dir.is_dir() {
        return Err(format!(
            "Directory does not exist or is not a directory: {:?}",
            dir
        ));
    }

    let ig = build_ignore_list(&dir)?;

    // Build the tree structure only
    let tree = build_tree_sync(&dir, &dir, &ig)?;

    Ok(tree)
}

// Function to render a file tree as a string in ASCII format
fn render_tree_as_ascii(nodes: &[FileTreeNode], prefix: &str, is_last: bool) -> String {
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
            result.push_str(&render_tree_as_ascii(
                children,
                &new_prefix,
                is_current_last,
            ));
        }
    }

    result
}

// Function to generate a file tree representation for a given root directory
fn generate_file_tree_text(root_path: &str, tree: &[FileTreeNode]) -> String {
    let mut result = format!("{}\n", root_path);
    result.push_str(&render_tree_as_ascii(tree, "", true));
    result
}

// Update concatenate_files_with_tree to use the helpers
#[tauri::command]
async fn concatenate_files_with_tree(
    dir_path: String,
    selected_file_paths: Vec<String>,
) -> Result<String, String> {
    // Get the file tree
    let dir = PathBuf::from(&dir_path);
    if !dir.exists() || !dir.is_dir() {
        return Err(format!(
            "Directory does not exist or is not a directory: {:?}",
            dir
        ));
    }

    // Build ignore list using helper
    let ig = build_ignore_list(&dir)?;

    // Build tree structure
    let tree = build_tree_sync(&dir, &dir, &ig)?;

    // Generate the tree text representation
    let tree_text = generate_file_tree_text(&dir_path, &tree);

    // Start building the output with file map section
    let mut output = format!("<file_map>\n{}</file_map>\n\n", tree_text);

    // Add file contents using helper
    output.push_str(&build_file_content_string(&selected_file_paths));

    Ok(output)
}

// Update copy_files_with_tree_to_clipboard to use the helpers
#[tauri::command]
async fn copy_files_with_tree_to_clipboard(
    dir_path: String,
    selected_file_paths: Vec<String>,
    tree_option: String,
) -> Result<(), String> {
    // First get the content using our existing function
    let content = match tree_option.as_str() {
        "include" => {
            // Get full tree
            let tree = get_file_tree(dir_path.clone()).await?;
            let tree_text = generate_file_tree_text(&dir_path, &tree);
            format!("<file_map>\n{}</file_map>\n\n", tree_text)
        }
        "include-only-selected" => {
            // Get tree with only selected files
            let mut tree = get_file_tree(dir_path.clone()).await?;
            filter_tree_to_selected(&mut tree, &selected_file_paths);
            let tree_text = generate_file_tree_text(&dir_path, &tree);
            format!("<file_map>\n{}</file_map>\n\n", tree_text)
        }
        "do-not-include" => String::new(),
        _ => return Err("Invalid tree option".to_string()),
    };

    // Add file contents using helper
    let mut output = content;
    output.push_str(&build_file_content_string(&selected_file_paths));

    // Copy to clipboard
    match Clipboard::new() {
        Ok(mut clipboard) => {
            clipboard
                .set_text(output)
                .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;
            Ok(())
        }
        Err(e) => Err(format!("Failed to access clipboard: {}", e)),
    }
}

// Helper function to filter tree to only include selected files
fn filter_tree_to_selected(tree: &mut Vec<FileTreeNode>, selected_paths: &[String]) {
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

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match handle.updater()?.check().await {
                    Ok(Some(update)) => {
                        // The check found an update
                        println!(
                            "Update available: version {}, released on {:?}",
                            update.version, update.date
                        );
                        // Download and install the update
                        update
                            .download_and_install(
                                |_chunk_len, _content_len| {
                                    // You can add download progress feedback here
                                },
                                || {
                                    // Callback when download is finished
                                    println!("Download finished");
                                },
                            )
                            .await
                            .unwrap_or_else(|e| {
                                eprintln!("Failed to download/install update: {}", e);
                            });
                        // Restart the app after update
                        println!("Restarting app...");
                        handle.restart(); // Use handle to restart
                    }
                    Ok(None) => {
                        // No update available
                        println!("No update available.");
                    }
                    Err(e) => {
                        // Error during check
                        eprintln!("Failed to check updates: {}", e);
                    }
                }
                // Add a type annotation here if the compiler complains about the future's return type
                Ok::<(), tauri_plugin_updater::Error>(())
            });
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            calculate_file_tokens,
            get_file_tree_with_tokens,
            get_file_tree,
            concatenate_files_with_tree,
            copy_files_with_tree_to_clipboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
