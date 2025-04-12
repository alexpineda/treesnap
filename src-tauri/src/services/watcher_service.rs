use notify::{Event, RecommendedWatcher, RecursiveMode, Result as NotifyResult, Watcher};
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::mpsc::channel;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{Emitter, Manager, State, Window};

// Import the file service to use build_ignore_list
use crate::services::file_service;

// State definition to hold the watcher
pub struct WatcherState(pub Mutex<Option<RecommendedWatcher>>);

// Internal function to start the watcher
// Takes a reference to the Mutex guarded Option<RecommendedWatcher>
pub fn start_watcher_internal(
    window: Window,
    dir_path_str: String,
    watcher_mutex: &Mutex<Option<RecommendedWatcher>>,
) -> Result<(), String> {
    let base_dir = PathBuf::from(&dir_path_str);
    if !base_dir.is_dir() {
        return Err(format!("Not a directory: {}", dir_path_str));
    }

    // Build the ignore list for this directory
    let ig = file_service::build_ignore_list(&base_dir)?;

    // Clone base_dir for the move closure
    let watched_dir_path = base_dir.clone();

    // --- State for debouncing ---
    let last_event_time = Arc::new(Mutex::new(Instant::now()));
    // Use HashSet to automatically handle duplicate paths
    let accumulated_paths = Arc::new(Mutex::new(HashSet::<PathBuf>::new()));
    let debouncer_handle = Arc::new(Mutex::new(None::<thread::JoinHandle<()>>));
    let debounce_duration = Duration::from_millis(500); // 500ms debounce
                                                        // --- End State for debouncing ---

    // Create the watcher instance with a callback
    let mut watcher = notify::recommended_watcher(move |res: NotifyResult<Event>| {
        match res {
            Ok(event) => {
                // Filter out ignored paths
                let non_ignored_paths: Vec<PathBuf> = event
                    .paths
                    .into_iter()
                    .filter(|path| {
                        // Calculate path relative to the watched directory root
                        let rel_path = path.strip_prefix(&watched_dir_path).unwrap_or(path);
                        // Check if the path is ignored
                        !ig.matched(rel_path, path.is_dir()).is_ignore()
                    })
                    .collect();

                // Only proceed if there are non-ignored paths
                if !non_ignored_paths.is_empty() {
                    // --- Debounce Start ---
                    let mut paths = accumulated_paths.lock().unwrap();
                    for path in non_ignored_paths {
                        paths.insert(path); // Add paths to the set
                    }
                    *last_event_time.lock().unwrap() = Instant::now(); // Update last event time

                    let mut handle_guard = debouncer_handle.lock().unwrap();
                    if handle_guard.is_none() {
                        // No active debouncer thread, spawn one
                        let window_clone = window.clone();
                        let last_event_time_clone = Arc::clone(&last_event_time);
                        let accumulated_paths_clone = Arc::clone(&accumulated_paths);
                        let debouncer_handle_clone = Arc::clone(&debouncer_handle);

                        *handle_guard = Some(thread::spawn(move || {
                            loop {
                                thread::sleep(debounce_duration / 5); // Check periodically

                                let elapsed = {
                                    // Scope for lock guard
                                    let last_time = last_event_time_clone.lock().unwrap();
                                    last_time.elapsed()
                                };

                                if elapsed >= debounce_duration {
                                    // Debounce duration elapsed, emit event
                                    let paths_to_emit = {
                                        // Scope for lock guard
                                        let mut acc_paths = accumulated_paths_clone.lock().unwrap();
                                        // Take the paths, leave an empty set
                                        std::mem::take(&mut *acc_paths)
                                    };

                                    // Clear the handle *before* emitting
                                    *debouncer_handle_clone.lock().unwrap() = None;

                                    if !paths_to_emit.is_empty() {
                                        println!(
                                            "Emitting after debounce: {} files changed",
                                            paths_to_emit.len()
                                        );
                                        let paths_as_strings: Vec<String> = paths_to_emit
                                            .into_iter()
                                            .map(|p| p.to_string_lossy().into_owned())
                                            .collect();
                                        let _ = window_clone
                                            .emit("files-changed-event", paths_as_strings);
                                    }
                                    break; // Exit the debouncer thread
                                }
                                // If not enough time elapsed, loop again
                            }
                        }));
                    }
                    // If handle_guard was Some, it means a debouncer is already running
                    // --- Debounce End ---
                }
            }
            Err(e) => {
                eprintln!("Watch error: {:?}", e);
                // TODO: Maybe emit an error event to the frontend?
                // let _ = window.emit("watcher-error-event", e.to_string());
            }
        }
    })
    .map_err(|e| format!("Failed to create file watcher: {}", e))?;

    // Add the directory to the watcher
    watcher
        .watch(&base_dir, RecursiveMode::Recursive)
        .map_err(|e| {
            format!(
                "Failed to start watching directory '{}': {}",
                dir_path_str, e
            )
        })?;

    // Store the watcher in the state, automatically dropping the old one if exists
    *watcher_mutex.lock().unwrap() = Some(watcher);

    println!("Started watching directory: {}", dir_path_str);
    Ok(())
}

// Internal function to stop the watcher
// Takes a reference to the Mutex guarded Option<RecommendedWatcher>
pub fn stop_watcher_internal(
    watcher_mutex: &Mutex<Option<RecommendedWatcher>>,
) -> Result<(), String> {
    // Lock the mutex and take the watcher out of the Option, dropping it
    let maybe_watcher = watcher_mutex.lock().unwrap().take();

    if maybe_watcher.is_some() {
        println!("Stopped file watcher.");
    } else {
        println!("No active file watcher to stop.");
    }
    // The watcher (if it existed) is dropped when maybe_watcher goes out of scope

    Ok(())
}

// Tauri command to explicitly start watching (e.g., for debugging or manual control)
#[tauri::command]
pub async fn start_watching_command(
    window: Window,
    dir_path: String,
    state: State<'_, WatcherState>,
) -> Result<(), String> {
    start_watcher_internal(window, dir_path, &state.0) // Pass the inner Mutex
}

// Tauri command to explicitly stop watching
#[tauri::command]
pub async fn stop_watching_command(state: State<'_, WatcherState>) -> Result<(), String> {
    stop_watcher_internal(&state.0) // Pass the inner Mutex
}
