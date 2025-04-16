use crate::constants::CACHE_STORE_FILENAME;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    path::Path,
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, State};
use tauri_plugin_store::StoreExt;
use tracing::{debug, error, info};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CacheEntry {
    pub path: String,
    pub modified: u64, // Store as seconds since epoch for simplicity
    pub token_count: usize,
}

pub type Cache = HashMap<String, CacheEntry>;

pub struct CacheState(pub Mutex<Cache>);

// Helper to get seconds since epoch from SystemTime
fn system_time_to_epoch_secs(time: SystemTime) -> Result<u64, String> {
    time.duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .map_err(|e| format!("System time error: {}", e))
}

// Helper to get current modification time in seconds since epoch
pub fn get_current_modified_secs(path: &str) -> Result<u64, String> {
    let metadata = fs::metadata(path).map_err(|e| format!("Failed to get metadata: {}", e))?;
    let modified_time = metadata
        .modified()
        .map_err(|e| format!("Failed to get modification time: {}", e))?;
    system_time_to_epoch_secs(modified_time)
}

/// Loads the cache from the store on startup.
pub fn load_cache(app_handle: &AppHandle) -> Cache {
    info!("Attempting to load token cache...");
    let path = Path::new(CACHE_STORE_FILENAME);

    match app_handle.store(path) {
        Ok(store) => {
            if let Some(cache_data) = store.get("token_cache") {
                match serde_json::from_value::<Cache>(cache_data.clone()) {
                    Ok(cache) => {
                        info!(
                            "Token cache loaded successfully with {} entries.",
                            cache.len()
                        );
                        cache
                    }
                    Err(e) => {
                        error!(
                            "Failed to deserialize cache data: {}. Creating new cache.",
                            e
                        );
                        HashMap::new()
                    }
                }
            } else {
                info!("No 'token_cache' key found in store. Creating new cache.");
                HashMap::new()
            }
        }
        Err(e) => {
            error!(
                "Failed to access store file ({}): {}. Creating new cache.",
                path.display(),
                e
            );
            HashMap::new()
        }
    }
}

/// Saves the cache to the store.
pub fn save_cache(
    app_handle: &AppHandle,
    cache_state: &State<'_, CacheState>,
) -> Result<(), String> {
    info!("Saving token cache...");
    let path = Path::new(CACHE_STORE_FILENAME);

    match app_handle.store(path) {
        Ok(store) => {
            let cache_guard = cache_state
                .0
                .lock()
                .map_err(|_| "Failed to lock cache mutex".to_string())?;
            let cache_data = serde_json::to_value(&*cache_guard)
                .map_err(|e| format!("Failed to serialize cache: {}", e))?;

            store.set("token_cache".to_string(), cache_data);

            store
                .save()
                .map_err(|e| format!("Failed to save cache store: {:?}", e))?;
            debug!("Token cache saved successfully.");
            Ok(())
        }
        Err(e) => Err(format!("Failed to get store handle for saving: {}", e)),
    }
}

/// Checks the cache for a valid entry for the given file path and modification time.
pub fn check_cache(
    path: &str,
    current_modified_secs: u64,
    cache_state: &State<'_, CacheState>,
) -> Result<Option<usize>, String> {
    let cache_guard = cache_state
        .0
        .lock()
        .map_err(|_| "Failed to lock cache mutex".to_string())?;
    if let Some(entry) = cache_guard.get(path) {
        if entry.modified == current_modified_secs {
            debug!("Cache hit for file: {}", path);
            return Ok(Some(entry.token_count));
        } else {
            debug!("Cache stale for file: {}", path);
        }
    } else {
        debug!("Cache miss for file: {}", path);
    }
    Ok(None)
}

/// Updates the cache with a new or modified entry.
pub fn update_cache(
    path: String,
    modified_secs: u64,
    token_count: usize,
    cache_state: &State<'_, CacheState>,
) -> Result<(), String> {
    let mut cache_guard = cache_state
        .0
        .lock()
        .map_err(|_| "Failed to lock cache mutex".to_string())?;
    let entry = CacheEntry {
        path: path.clone(),
        modified: modified_secs,
        token_count,
    };
    debug!("Updating cache for file: {}", path);
    cache_guard.insert(path, entry);
    Ok(())
}
