use crate::services::cache_service::{self, CacheState};
use futures::future::join_all;
use std::{collections::HashMap, fs, path::PathBuf, sync::Arc};
use tauri::{AppHandle, State};
use tiktoken_rs::{self, CoreBPE};
use tracing::{debug, error, info};

use crate::domain::file_tree_node::FileTreeNode;

/// Calculate tokens for a specific file, using the cache if possible.
pub async fn calculate_file_tokens(
    file_path: String,
    app_handle: &AppHandle,
    cache_state: &State<'_, CacheState>,
) -> Result<usize, String> {
    let path = PathBuf::from(file_path.clone());
    if !path.exists() || !path.is_file() {
        return Err(format!("File does not exist: {:?}", path));
    }

    let current_modified_secs = cache_service::get_current_modified_secs(&file_path)?;
    if let Some(cached_tokens) =
        cache_service::check_cache(&file_path, current_modified_secs, cache_state)?
    {
        info!("Cache hit for {}: {} tokens", file_path, cached_tokens);
        return Ok(cached_tokens);
    }

    info!("Cache miss/stale for {}. Calculating tokens...", file_path);
    let content = match fs::read_to_string(&path) {
        Ok(content) => content,
        Err(e) => return Err(format!("Failed to read file: {}", e)),
    };

    let bpe = match tiktoken_rs::get_bpe_from_model("gpt-4o") {
        Ok(bpe) => bpe,
        Err(e) => return Err(format!("Failed to initialize tokenizer: {}", e)),
    };

    let encoded = bpe.encode_with_special_tokens(&content);
    let token_count = encoded.len();

    cache_service::update_cache(
        file_path.clone(),
        current_modified_secs,
        token_count,
        cache_state,
    )?;

    if let Err(e) = cache_service::save_cache(app_handle, cache_state) {
        error!("Failed to save cache after updating {}: {}", file_path, e);
    }

    Ok(token_count)
}

// Calculate tokens for specific files, utilizing the cache
pub async fn calculate_tokens_for_files(
    file_paths: Vec<String>,
    app_handle: &AppHandle,
    cache_state: &State<'_, CacheState>,
) -> Result<HashMap<String, usize>, String> {
    let bpe = Arc::new(
        tiktoken_rs::get_bpe_from_model("gpt-4o")
            .map_err(|e| format!("Failed to initialize tokenizer: {}", e))?,
    );

    let mut token_map = HashMap::new();
    let mut paths_to_calculate = Vec::new();
    let mut needs_save = false;

    for path_str in &file_paths {
        match cache_service::get_current_modified_secs(path_str) {
            Ok(current_modified_secs) => {
                match cache_service::check_cache(path_str, current_modified_secs, cache_state)? {
                    Some(cached_tokens) => {
                        debug!("Cache hit for {}: {} tokens", path_str, cached_tokens);
                        token_map.insert(path_str.clone(), cached_tokens);
                    }
                    None => {
                        debug!("Cache miss/stale for {}. Will calculate.", path_str);
                        paths_to_calculate.push((path_str.clone(), current_modified_secs));
                    }
                }
            }
            Err(e) => {
                error!(
                    "Failed to get metadata for {}: {}. Skipping cache check.",
                    path_str, e
                );
                paths_to_calculate.push((path_str.clone(), 0));
            }
        }
    }

    if !paths_to_calculate.is_empty() {
        info!(
            "Calculating tokens for {} files...",
            paths_to_calculate.len()
        );
        let mut tasks = Vec::new();
        for (path_str, modified_secs) in paths_to_calculate {
            let path = PathBuf::from(&path_str);
            let bpe_clone = bpe.clone();

            tasks.push(tokio::spawn(async move {
                let content = match fs::read_to_string(&path) {
                    Ok(c) => c,
                    Err(e) => {
                        error!("Failed to read file {}: {}", path.display(), e);
                        return (path_str, modified_secs, Err(e.to_string()));
                    }
                };
                let encoded = bpe_clone.encode_with_special_tokens(&content);
                (path_str, modified_secs, Ok(encoded.len()))
            }));
        }

        let results = join_all(tasks).await;
        for result in results {
            match result {
                Ok((path_str, modified_secs, Ok(count))) => {
                    token_map.insert(path_str.clone(), count);
                    let mod_time_to_cache = if modified_secs == 0 {
                        cache_service::get_current_modified_secs(&path_str).unwrap_or(0)
                    } else {
                        modified_secs
                    };

                    if mod_time_to_cache != 0 {
                        match cache_service::update_cache(
                            path_str.clone(),
                            mod_time_to_cache,
                            count,
                            cache_state,
                        ) {
                            Ok(()) => needs_save = true,
                            Err(e) => error!("Failed to update cache for {}: {}", path_str, e),
                        }
                    } else {
                        error!(
                            "Could not get valid modification time for {}. Not caching.",
                            path_str
                        );
                    }
                }
                Ok((path_str, _modified_secs, Err(e))) => {
                    error!("Token calculation failed for {}: {}", path_str, e);
                    token_map.insert(path_str, 0);
                }
                Err(e) => {
                    error!("Tokio task join error: {}", e);
                }
            }
        }
    } else {
        info!("All token counts retrieved from cache.");
    }

    if needs_save {
        info!("Saving updated token cache...");
        if let Err(e) = cache_service::save_cache(app_handle, cache_state) {
            error!("Failed to save cache after bulk update: {}", e);
        }
    }

    Ok(token_map)
}

// Asynchronous function to fill token counts into an existing tree structure
pub async fn fill_tokens_in_tree(
    nodes: &mut [FileTreeNode],
    bpe: Arc<CoreBPE>,
) -> Result<(), String> {
    let mut file_nodes: Vec<&mut FileTreeNode> = Vec::new();

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

    let mut tasks = Vec::new();
    for node in file_nodes.iter() {
        let path = node.path.clone();
        let bpe_clone = bpe.clone();
        tasks.push(tokio::spawn(async move {
            let content = match fs::read_to_string(&path) {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("Warning: Failed to read file {}: {}", path, e);
                    return (path, 0);
                }
            };
            let encoded = bpe_clone.encode_with_special_tokens(&content);
            (path, encoded.len())
        }));
    }

    let results = join_all(tasks).await;

    let mut token_map = std::collections::HashMap::new();
    for result in results {
        match result {
            Ok((path, count)) => {
                token_map.insert(path, count);
            }
            Err(e) => eprintln!("Warning: Token calculation task failed: {}", e),
        }
    }

    for node in file_nodes {
        if let Some(count) = token_map.get(&node.path) {
            node.token_count = Some(*count);
        }
    }

    Ok(())
}
