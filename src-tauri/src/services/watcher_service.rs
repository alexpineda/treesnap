use notify::{Event, RecommendedWatcher, RecursiveMode, Result as NotifyResult, Watcher};
use std::path::Path;
use std::sync::mpsc::channel;
use std::sync::Mutex;
use tauri::{Emitter, Manager, State, Window};

// State definition to hold the watcher
pub struct WatcherState(pub Mutex<Option<RecommendedWatcher>>);

// Internal function to start the watcher
// Takes a reference to the Mutex guarded Option<RecommendedWatcher>
pub fn start_watcher_internal(
    window: Window,
    dir_path: String,
    watcher_mutex: &Mutex<Option<RecommendedWatcher>>,
) -> Result<(), String> {
    // let (tx, rx) = channel(); // <-- Remove this line

    // Create the watcher instance with a callback
    let mut watcher = notify::recommended_watcher(move |res: NotifyResult<Event>| {
        match res {
            Ok(event) => {
                println!("File change detected: {:?}", event.paths);
                // TODO: Implement debouncing/throttling before emitting
                // For now, emit a simplified event (e.g., just paths or a generic signal)
                // Using clone on window handle inside the move closure
                let window_clone = window.clone();
                let _ = window_clone.emit("files-changed-event", event.paths); // Consider a simpler payload
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
        .watch(Path::new(&dir_path), RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to start watching directory '{}': {}", dir_path, e))?;

    // Store the watcher in the state, automatically dropping the old one if exists
    *watcher_mutex.lock().unwrap() = Some(watcher);

    println!("Started watching directory: {}", dir_path);
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
