#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod constants;
mod domain;
mod services;

use domain::file_tree_node::FileTreeNode;
use services::cache_service;
use services::file_service;
use services::license;
use services::license::state::LicenseStatus;
use services::token_service;
use services::tree_service;
use services::watcher_service;
use std::collections::HashMap;

// Conditional imports for debug commands
#[cfg(debug_assertions)]
use services::license::debug as license_debug;

use tauri_plugin_dialog;
use tauri_plugin_fs;
use tauri_plugin_updater::UpdaterExt;

use std::sync::Mutex;
use tauri::{AppHandle, Manager, State, Window};
// use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use chrono::Utc;
use reqwest::Client;
use services::license::errors::ApiError;
use tracing::{error, info};
use tracing_subscriber;

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
async fn calculate_file_tokens(
    file_path: String,
    app_handle: AppHandle,
    cache_state: State<'_, cache_service::CacheState>,
) -> Result<usize, String> {
    return token_service::calculate_file_tokens(file_path, &app_handle, &cache_state).await;
}

// Calculate tokens for specific files
#[tauri::command]
async fn calculate_tokens_for_files(
    file_paths: Vec<String>,
    app_handle: AppHandle,
    cache_state: State<'_, cache_service::CacheState>,
) -> Result<HashMap<String, usize>, String> {
    return token_service::calculate_tokens_for_files(file_paths, &app_handle, &cache_state).await;
}

#[tauri::command]
async fn open_workspace(
    window: Window,
    app_handle: AppHandle,
    dir_path: String,
    watcher_state: State<'_, watcher_service::WatcherState>,
) -> Result<Vec<FileTreeNode>, ApiError> {
    info!("Attempting to open workspace: {}", dir_path);

    // --- License Check ---
    license::check_and_record_workspace_access(&app_handle, &dir_path)
        .await
        .map_err(|e| {
            error!("License check failed for {}: {}", dir_path, e);
            // Convert LicenseError to ApiError
            ApiError::from(e)
        })?;
    info!("License check passed for {}", dir_path);
    // --- End License Check ---

    // First, get the file tree
    let tree = tree_service::get_file_tree(dir_path.clone(), false)
        .await
        .map_err(|e| ApiError::new("file_tree_error", &e))?;

    // Then, start the watcher for this directory
    watcher_service::start_watcher_internal(window, dir_path, &watcher_state.0)
        .map_err(|e| ApiError::new("watcher_error", &e))?;

    Ok(tree)
}

#[tauri::command]
async fn close_workspace(
    watcher_state: State<'_, watcher_service::WatcherState>,
) -> Result<(), String> {
    // Stop the current watcher
    watcher_service::stop_watcher_internal(&watcher_state.0)
}

/// Clears the token calculation cache.
#[tauri::command]
async fn clear_cache(
    app_handle: AppHandle,
    cache_state: State<'_, cache_service::CacheState>,
) -> Result<(), String> {
    info!("Clearing cache via Tauri command...");
    cache_service::clear_cache_internal(&app_handle, &cache_state)
}

// Define the LicenseClient state struct here as it's managed by the builder
pub struct LicenseClient(Mutex<Client>);

impl Default for LicenseClient {
    fn default() -> Self {
        Self(Mutex::new(Client::new()))
    }
}

// Tauri command to activate the application using a license key.
#[tauri::command]
#[tracing::instrument(skip(app_handle, client_state, license_key))] // Skip sensitive key
async fn activate_license(
    app_handle: AppHandle,
    client_state: State<'_, LicenseClient>, // Assuming LicenseClient type
    license_key: String,
) -> Result<license::LocalLicenseState, ApiError> {
    // Changed return type back to ApiError
    info!("Activating license from Tauri command...");
    let client = client_state.inner().0.lock().unwrap().clone(); // Clone the client

    match crate::services::license::api::activate_license_internal(&app_handle, client, license_key)
        .await
    {
        Ok(new_state) => {
            info!("License activation successful via Tauri command.");
            Ok(new_state)
        }
        Err(e) => {
            error!("License activation failed: {:?}", e); // Log the full error
            Err(e.into()) // Use From trait to convert LicenseError to ApiError
        }
    }
}

#[tauri::command]
async fn get_local_license_state(
    app_handle: AppHandle,
) -> Result<license::LocalLicenseState, ApiError> {
    match license::get_local_license_state_internal(&app_handle).await {
        Ok(status) => Ok(status),
        Err(e) => {
            error!("Failed to get license status: {}", e);
            Err(e.into())
        }
    }
}

#[tauri::command]
async fn check_workspace_limit(app_handle: AppHandle) -> Result<(), ApiError> {
    match license::check_workspace_limit_internal(&app_handle).await {
        Ok(_) => Ok(()),
        Err(e) => Err(e.into()),
    }
}

pub fn run() {
    // Initialize tracing subscriber for logging
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(watcher_service::WatcherState(Mutex::new(None)))
        .manage(LicenseClient::default()) // Manage the LicenseClient
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            let initial_cache = cache_service::load_cache(&handle);
            app.manage(cache_service::CacheState(Mutex::new(initial_cache)));

            // tauri::async_runtime::spawn(async move {
            //     // --- License Check ---
            //     let license_state_result = license::get_local_license_state_internal(&handle).await;

            //     #[cfg(debug_assertions)]
            //     let should_check_for_updates = false;

            //     #[cfg(not(debug_assertions))]
            //     let should_check_for_updates = match license_state_result {
            //         Ok(state) => {
            //             info!("License status: {:?}", state.status);
            //             let is_expired = state.status == LicenseStatus::Expired;

            //             if !is_expired {
            //                 info!("License is active. Checking for updates.");
            //                 true
            //             } else {
            //                 info!("License is expired. Skipping update check.");
            //                 false
            //             }
            //         }
            //         Err(e) => {
            //             error!("Failed to get license state: {}. Skipping update check.", e);
            //             false
            //         }
            //     };
            //     // --- End License Check ---

            //     // --- Update Check ---
            //     if should_check_for_updates {
            //         match handle.updater() {
            //             Ok(updater) => match updater.check().await {
            //                 Ok(Some(update)) => {
            //                     // The check found an update
            //                     info!(
            //                         "Update available: version {}, released on {:?}",
            //                         update.version, update.date
            //                     );
            //                     // Download and install the update
            //                     match update
            //                         .download_and_install(
            //                             |_chunk_len, _content_len| {
            //                                 // You can add download progress feedback here
            //                             },
            //                             || {
            //                                 // Callback when download is finished
            //                                 info!("Update download finished");
            //                             },
            //                         )
            //                         .await
            //                     {
            //                         Ok(_) => {
            //                             info!("Update installed successfully. Restarting app...");
            //                             handle.restart(); // Use handle to restart
            //                         }
            //                         Err(e) => {
            //                             error!("Failed to download/install update: {}", e);
            //                         }
            //                     }
            //                 }
            //                 Ok(None) => {
            //                     // No update available
            //                     info!("No update available.");
            //                 }
            //                 Err(e) => {
            //                     // Error during check
            //                     error!("Failed to check updates: {}", e);
            //                 }
            //             },
            //             Err(e) => {
            //                 error!("Failed to get updater instance: {}", e);
            //             }
            //         }
            //     }
            //     // --- End Update Check ---

            //     // Add a type annotation here if the compiler complains about the future's return type
            //     Ok::<(), Box<dyn std::error::Error + Send + Sync>>(()) // Use a broader error type or handle specific errors
            // });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            copy_files_with_tree_to_clipboard,
            calculate_file_tokens,
            calculate_tokens_for_files,
            get_file_tree,
            open_workspace,
            close_workspace,
            activate_license,
            get_local_license_state,
            check_workspace_limit,
            watcher_service::start_watching_command,
            watcher_service::stop_watching_command,
            clear_cache,
            // Add debug handlers only in debug builds
            #[cfg(debug_assertions)]
            license_debug::debug_set_license_state,
            #[cfg(debug_assertions)]
            license_debug::debug_clear_license_state,
            #[cfg(debug_assertions)]
            license_debug::debug_add_usage_entries,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
