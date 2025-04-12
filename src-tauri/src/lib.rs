#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod constants;
mod domain;
mod services;

use domain::file_tree_node::FileTreeNode;
use services::file_service;
use services::token_service;
use services::tree_service;
use services::watcher_service;
use std::collections::HashMap;

use tauri_plugin_dialog;
use tauri_plugin_fs;
use tauri_plugin_store;
use tauri_plugin_updater::UpdaterExt;

use std::sync::Mutex;
use tauri::{Manager, State, Window};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

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
            let tree = tree_service::get_file_tree(dir_path.clone(), false).await?;
            let tree_text = file_service::generate_file_tree_text(&dir_path, &tree);
            format!("<file_map>\n{}</file_map>\n\n", tree_text)
        }
        "include-only-selected" => {
            // Get tree with only selected files
            let mut tree = get_file_tree(dir_path.clone(), false).await?;
            tree_service::filter_tree_to_selected(&mut tree, &selected_file_paths);
            let tree_text = file_service::generate_file_tree_text(&dir_path, &tree);
            format!("<file_map>\n{}</file_map>\n\n", tree_text)
        }
        "do-not-include" => String::new(),
        _ => return Err("Invalid tree option".to_string()),
    };

    // Add file contents using helper
    let mut output = content;
    output.push_str(&file_service::build_file_content_string(
        &selected_file_paths,
    ));

    // Copy to clipboard
    file_service::copy_to_clipboard(&output)
}

#[tauri::command]
async fn get_file_tree(dir_path: String, with_tokens: bool) -> Result<Vec<FileTreeNode>, String> {
    return tree_service::get_file_tree(dir_path, with_tokens).await;
}

/// Calculate tokens for a specific file.
#[tauri::command]
async fn calculate_file_tokens(file_path: String) -> Result<usize, String> {
    return token_service::calculate_file_tokens(file_path).await;
}

// Calculate tokens for specific files
#[tauri::command]
async fn calculate_tokens_for_files(
    file_paths: Vec<String>,
) -> Result<HashMap<String, usize>, String> {
    return token_service::calculate_tokens_for_files(file_paths).await;
}

#[tauri::command]
async fn open_workspace(
    window: Window,
    dir_path: String,
    watcher_state: State<'_, watcher_service::WatcherState>,
) -> Result<Vec<FileTreeNode>, String> {
    // First, get the file tree
    let tree = tree_service::get_file_tree(dir_path.clone(), false).await?;

    // Then, start the watcher for this directory
    watcher_service::start_watcher_internal(window, dir_path, &watcher_state.0)?;

    Ok(tree)
}

#[tauri::command]
async fn close_workspace(
    watcher_state: State<'_, watcher_service::WatcherState>,
) -> Result<(), String> {
    // Stop the current watcher
    watcher_service::stop_watcher_internal(&watcher_state.0)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(watcher_service::WatcherState(Mutex::new(None)))
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
            copy_files_with_tree_to_clipboard,
            calculate_file_tokens,
            calculate_tokens_for_files,
            get_file_tree,
            open_workspace,
            close_workspace,
            watcher_service::start_watching_command,
            watcher_service::stop_watching_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
