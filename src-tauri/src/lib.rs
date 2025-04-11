#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod constants;
mod file_util;
mod token_builder;
mod tree_builder;

use serde::Serialize;
use tauri_plugin_dialog;
use tauri_plugin_fs;
use tauri_plugin_store;
use tauri_plugin_updater::UpdaterExt;

use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use token_builder::{calculate_file_tokens, calculate_tokens_for_files};

#[derive(Debug, Serialize, Clone)]
pub struct FileTreeNode {
    name: String,
    path: String,
    children: Option<Vec<FileTreeNode>>,
    is_directory: bool,
    token_count: Option<usize>,
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
            calculate_tokens_for_files,
            commands::get_file_tree,
            commands::copy_files_with_tree_to_clipboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
