use std::{
    fs,
    path::{Path, PathBuf},
    sync::Arc,
};

use arboard::Clipboard;

use crate::{
    file_util::{build_file_content_string, build_ignore_list, generate_file_tree_text},
    token_builder::fill_tokens_in_tree,
    tree_builder::{build_tree_sync, filter_tree_to_selected},
    FileTreeNode,
};

#[tauri::command]
pub async fn get_file_tree(
    dir_path: String,
    with_tokens: bool,
) -> Result<Vec<FileTreeNode>, String> {
    let dir = PathBuf::from(&dir_path);
    if !dir.exists() || !dir.is_dir() {
        return Err(format!(
            "Directory does not exist or is not a directory: {:?}",
            dir
        ));
    }

    let ig = build_ignore_list(&dir)?;
    let mut tree = build_tree_sync(&dir, &dir, &ig)?;

    if with_tokens {
        let bpe = Arc::new(
            tiktoken_rs::get_bpe_from_model("gpt-4o")
                .map_err(|e| format!("Failed to initialize tokenizer: {}", e))?,
        );

        fill_tokens_in_tree(&mut tree, bpe).await?;
    }

    Ok(tree)
}

#[tauri::command]
pub async fn copy_files_with_tree_to_clipboard(
    dir_path: String,
    selected_file_paths: Vec<String>,
    tree_option: String,
) -> Result<(), String> {
    // First get the content using our existing function
    let content = match tree_option.as_str() {
        "include" => {
            // Get full tree
            let tree = get_file_tree(dir_path.clone(), false).await?;
            let tree_text = generate_file_tree_text(&dir_path, &tree);
            format!("<file_map>\n{}</file_map>\n\n", tree_text)
        }
        "include-only-selected" => {
            // Get tree with only selected files
            let mut tree = get_file_tree(dir_path.clone(), false).await?;
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
