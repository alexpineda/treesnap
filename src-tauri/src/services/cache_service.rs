use crate::constants::CACHE_STORE_FILENAME;
use lru::LruCache;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    num::NonZeroUsize,
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

pub type Cache = LruCache<String, CacheEntry>;

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
                match serde_json::from_value::<HashMap<String, CacheEntry>>(cache_data.clone()) {
                    Ok(loaded_map) => {
                        let capacity = NonZeroUsize::new(1_000).unwrap();
                        let mut lru = LruCache::new(capacity);
                        for (key, value) in loaded_map {
                            lru.put(key, value);
                        }
                        info!(
                            "Token cache loaded successfully with {} entries (capacity {}).",
                            lru.len(),
                            lru.cap().get()
                        );
                        lru
                    }
                    Err(e) => {
                        error!("Corrupt/legacy cache found ({}). Starting fresh.", e);
                        store.delete("token_cache");
                        store.save().ok();
                        LruCache::new(NonZeroUsize::new(1_000).unwrap())
                    }
                }
            } else {
                info!("No 'token_cache' key found in store. Creating new cache.");
                LruCache::new(NonZeroUsize::new(1_000).unwrap())
            }
        }
        Err(e) => {
            error!(
                "Failed to access store file ({}): {}. Creating new cache.",
                path.display(),
                e
            );
            LruCache::new(NonZeroUsize::new(1_000).unwrap())
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
            // Convert LruCache to HashMap for serialization
            let map: HashMap<_, _> = {
                let guard = cache_state
                    .0
                    .lock()
                    .map_err(|_| "Failed to lock cache mutex for saving")?;
                guard.iter().map(|(k, v)| (k.clone(), v.clone())).collect()
            }; // mutex released before heavy work

            let cache_data = serde_json::to_value(map)
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
    let mut cache_guard = cache_state
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
    cache_guard.put(path, entry);
    Ok(())
}

/// Clears both the in-memory cache and the persisted cache file.
pub fn clear_cache_internal(
    app_handle: &AppHandle,
    cache_state: &State<'_, CacheState>,
) -> Result<(), String> {
    info!("Clearing token cache...");

    // Clear in-memory cache
    {
        let mut cache_guard = cache_state
            .0
            .lock()
            .map_err(|_| "Failed to lock cache mutex for clearing".to_string())?;
        cache_guard.clear();
        info!("In-memory cache cleared.");
    } // Mutex guard dropped here

    // Clear persisted cache file
    let path = Path::new(CACHE_STORE_FILENAME);
    match app_handle.store(path) {
        Ok(store) => {
            if store.has("token_cache") {
                store.delete("token_cache");
                match store.save() {
                    Ok(_) => info!("Persisted cache key 'token_cache' cleared."),
                    Err(e) => {
                        // Log error but don't necessarily fail the whole operation
                        error!("Failed to save store after deleting cache key: {:?}", e);
                    }
                }
            } else {
                info!("No persisted cache key 'token_cache' found to clear.");
            }

            // Optionally, you could try deleting the entire store file,
            // but tauri-plugin-store might recreate it. Deleting the key is safer.
            // if path.exists() {
            //     match fs::remove_file(path) {
            //         Ok(_) => info!("Cache store file deleted: {}", path.display()),
            //         Err(e) => error!("Failed to delete cache store file: {}", e), // Log error but proceed
            //     }
            // }
        }
        Err(e) => {
            // Log error, but don't fail if we couldn't access the store,
            // maybe it just didn't exist yet.
            error!(
                "Failed to access store file ({}) for clearing: {}. In-memory cache was still cleared.",
                path.display(),
                e
            );
        }
    }

    Ok(())
}
