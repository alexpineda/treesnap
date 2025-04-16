use notify::{
    event::EventKind, Event, RecommendedWatcher, RecursiveMode, Result as NotifyResult, Watcher,
};
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{Emitter, State, Window};
use tracing::debug;

// Import the file service to use build_ignore_list
use crate::services::file_service;

// State definition to hold the watcher
pub struct WatcherState(pub Mutex<Option<RecommendedWatcher>>);

// Define a struct to represent the file change event for the frontend
#[derive(Clone, Debug, Serialize)]
struct FileChangeEvent {
    path: String,
    kind: String, // e.g., "create", "remove", "modify", "rename"
}

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
    // Use HashMap to store the latest event kind for each path
    let accumulated_events = Arc::new(Mutex::new(HashMap::<PathBuf, EventKind>::new()));
    let debouncer_handle = Arc::new(Mutex::new(None::<thread::JoinHandle<()>>));
    let debounce_duration = Duration::from_millis(500); // 500ms debounce
                                                        // --- End State for debouncing ---

    // Create the watcher instance with a callback
    let mut watcher = notify::recommended_watcher(move |res: NotifyResult<Event>| {
        match res {
            Ok(event) => {
                // Determine the primary event kind (simplified handling)
                let kind = event.kind;

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
                    let mut events_map = accumulated_events.lock().unwrap();
                    for path in non_ignored_paths {
                        // Insert or update the path with the latest event kind
                        events_map.insert(path, kind);
                    }
                    *last_event_time.lock().unwrap() = Instant::now(); // Update last event time

                    let mut handle_guard = debouncer_handle.lock().unwrap();
                    if handle_guard.is_none() {
                        // No active debouncer thread, spawn one
                        let window_clone = window.clone();
                        let last_event_time_clone = Arc::clone(&last_event_time);
                        let accumulated_events_clone = Arc::clone(&accumulated_events);
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
                                    let events_to_emit_map = {
                                        // Scope for lock guard
                                        let mut acc_events =
                                            accumulated_events_clone.lock().unwrap();
                                        // Take the events map, leave an empty map
                                        std::mem::take(&mut *acc_events)
                                    };

                                    // Clear the handle *before* emitting
                                    *debouncer_handle_clone.lock().unwrap() = None;

                                    if !events_to_emit_map.is_empty() {
                                        println!(
                                            "Emitting after debounce: {} file events",
                                            events_to_emit_map.len()
                                        );
                                        // Convert the map to the Vec<FileChangeEvent> structure
                                        let change_events: Vec<FileChangeEvent> =
                                            events_to_emit_map
                                                .into_iter()
                                                .map(|(path, kind)| FileChangeEvent {
                                                    path: path.to_string_lossy().into_owned(),
                                                    // Convert EventKind to a simple string
                                                    kind: match kind {
                                                        EventKind::Create(_) => {
                                                            "create".to_string()
                                                        }
                                                        EventKind::Modify(_) => {
                                                            "modify".to_string()
                                                        }
                                                        EventKind::Remove(_) => {
                                                            "remove".to_string()
                                                        }
                                                        _ => "other".to_string(), // Handle other kinds like Access, Any
                                                    },
                                                })
                                                .collect();

                                        let _ =
                                            window_clone.emit("files-changed-event", change_events);
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

    debug!("Started watching directory: {}", dir_path_str);
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
