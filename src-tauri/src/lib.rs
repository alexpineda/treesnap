#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use anyhow::{Context, Result};
use ignore::{DirEntry, WalkBuilder};
use regex::Regex;
use serde::Deserialize;
use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{Manager, Runtime};
use tauri_plugin_dialog;
use tauri_plugin_fs;
use tiktoken_rs::CoreBPE; // For GPT-like token counting

/// Hard-coded default ignore patterns (akin to your Node code's default-ignore.ts).
const DEFAULT_IGNORE_PATTERNS: &str = r#"
codefetch/
.git/
node_modules/
target/
dist/
build/
.vscode/
.idea/
.DS_Store
*.png
*.jpg
*.jpeg
*.gif
*.webp
*.pdf
*.exe
*.dll
*.so
*.zip
*.tar
*.gz
*.lock
*.log
"#;

/// Simple config for scanning.
#[derive(Debug, Deserialize)]
pub struct CodefetchConfig {
    pub dir: String,
    pub max_tokens: Option<usize>,
    pub disable_line_numbers: bool,
    pub verbose: bool,
}

/// Tauri command: replicate "codefetch" default logic.
#[tauri::command]
async fn run_codefetch(cfg: CodefetchConfig) -> Result<String, String> {
    match do_codefetch(cfg).await {
        Ok(md) => Ok(md),
        Err(e) => Err(format!("Error: {}", e)),
    }
}

/// Actual scanning + markdown generation.
async fn do_codefetch(cfg: CodefetchConfig) -> Result<String> {
    let dir = PathBuf::from(&cfg.dir);
    if !dir.exists() {
        anyhow::bail!("Directory does not exist: {:?}", dir);
    }

    // 1) Build ignore list
    let mut ignore_builder = ignore::gitignore::GitignoreBuilder::new(dir.clone());
    // Load .gitignore if present
    let gitignore = dir.join(".gitignore");
    if gitignore.exists() {
        if let Some(e) = ignore_builder.add(&gitignore) {
            eprintln!("Warning: Failed to parse .gitignore: {}", e);
        }
    }
    // Load .codefetchignore if present
    let codefetchignore = dir.join(".codefetchignore");
    if codefetchignore.exists() {
        if let Some(e) = ignore_builder.add(&codefetchignore) {
            eprintln!("Warning: Failed to parse .codefetchignore: {}", e);
        }
    }
    // Add default ignore patterns
    for line in DEFAULT_IGNORE_PATTERNS.lines() {
        ignore_builder.add_line(None, line.trim())?;
    }
    let ig = ignore_builder.build()?;

    // 2) Collect files that pass ignore
    let mut files_to_include = vec![];
    let mut builder = WalkBuilder::new(&dir);
    builder
        .git_ignore(false)
        .hidden(false)
        .ignore(false)
        .follow_links(true);

    for result in builder.build() {
        let entry = match result {
            Ok(e) => e,
            Err(_) => continue,
        };
        if entry.file_type().map(|ft| ft.is_file()).unwrap_or(false) {
            let rel_path = entry.path().strip_prefix(&dir).unwrap_or(entry.path());
            if !ig.matched(rel_path, false).is_ignore() {
                files_to_include.push(entry.path().to_path_buf());
            }
        }
    }

    // 3) Build a GPT tokenizer if we need it
    let bpe = if cfg.max_tokens.is_some() {
        // For example, p50k_base
        let core_bpe = tiktoken_rs::get_bpe_from_model("gpt-4o")?;
        Some(core_bpe)
    } else {
        None
    };

    // 4) Read each file, line-by-line, append to a big string in Markdown format.
    //    We'll do "truncated" if we exceed max_tokens.
    let max_tokens = cfg.max_tokens.unwrap_or(usize::MAX);
    let mut total_tokens_used = 0;
    let mut output_md = String::new();

    // (Optional) project tree? This example omits the fancy tree, but you can add it.

    // Then, for each file:
    files_to_include.sort(); // sort for consistent output
    for file in files_to_include {
        // Check if adding file metadata would blow tokens
        let file_header = format!("{}\n```\n", file.strip_prefix(&dir)?.display());
        let needed_header_tokens = count_tokens(&file_header, bpe.as_ref())?;
        if total_tokens_used + needed_header_tokens > max_tokens {
            // We can't even fit the file header => skip
            if cfg.verbose {
                eprintln!("Skipping {}: not enough tokens", file.display());
            }
            continue;
        }
        output_md.push_str(&file_header);
        total_tokens_used += needed_header_tokens;

        // Now read lines
        let content = fs::read_to_string(&file).unwrap_or_default();
        let mut line_no = 1;
        for line in content.split('\n') {
            let line_with_num = if cfg.disable_line_numbers {
                format!("{}\n", line)
            } else {
                format!("{} | {}\n", line_no, line)
            };

            let needed_tokens = count_tokens(&line_with_num, bpe.as_ref())?;
            if total_tokens_used + needed_tokens > max_tokens {
                // Not enough tokens left, add a truncation marker
                output_md.push_str("[TRUNCATED]\n```\n");
                total_tokens_used += count_tokens("[TRUNCATED]\n```\n", bpe.as_ref())?;
                break;
            } else {
                output_md.push_str(&line_with_num);
                total_tokens_used += needed_tokens;
            }
            line_no += 1;
        }

        // close triple backtick
        if !output_md.ends_with("[TRUNCATED]\n```\n") {
            output_md.push_str("```\n");
        }

        if total_tokens_used >= max_tokens {
            if cfg.verbose {
                eprintln!("Max tokens reached, stopping early.");
            }
            break;
        }
    }

    // Done!
    Ok(output_md)
}

/// Count tokens for a given string using the GPT BPE.  If `bpe` is None, we do a naive "split on whitespace" as fallback.
fn count_tokens(text: &str, bpe: Option<&CoreBPE>) -> Result<usize> {
    if let Some(bpe) = bpe {
        let encoded = bpe.encode_with_special_tokens(text);
        Ok(encoded.len())
    } else {
        // fallback "simple" approach
        let re = Regex::new(r"\s+").unwrap();
        let tokens: Vec<&str> = re.split(text.trim()).filter(|s| !s.is_empty()).collect();
        Ok(tokens.len())
    }
}

/// Calculate tokens for a specific file.
#[tauri::command]
async fn calculate_file_tokens(file_path: String) -> Result<usize, String> {
    let path = PathBuf::from(file_path);
    if !path.exists() || !path.is_file() {
        return Err(format!("File does not exist: {:?}", path));
    }

    let content = match fs::read_to_string(&path) {
        Ok(content) => content,
        Err(e) => return Err(format!("Failed to read file: {}", e)),
    };

    // Use GPT-4o tokenizer for consistent counting
    let bpe = match tiktoken_rs::get_bpe_from_model("gpt-4o") {
        Ok(bpe) => bpe,
        Err(e) => return Err(format!("Failed to initialize tokenizer: {}", e)),
    };

    let encoded = bpe.encode_with_special_tokens(&content);
    Ok(encoded.len())
}

#[derive(Debug, Serialize)]
pub struct FileTreeNode {
    name: String,
    path: String,
    children: Option<Vec<FileTreeNode>>,
    is_directory: bool,
}

#[tauri::command]
async fn get_file_tree(dir_path: String) -> Result<Vec<FileTreeNode>, String> {
    let dir = PathBuf::from(&dir_path);
    if !dir.exists() {
        return Err(format!("Directory does not exist: {:?}", dir));
    }

    // Build ignore list (reusing code from do_codefetch)
    let mut ignore_builder = ignore::gitignore::GitignoreBuilder::new(dir.clone());
    // Load .gitignore if present
    let gitignore = dir.join(".gitignore");
    if gitignore.exists() {
        if let Some(e) = ignore_builder.add(&gitignore) {
            eprintln!("Warning: Failed to parse .gitignore: {}", e);
        }
    }
    // Load .codefetchignore if present
    let codefetchignore = dir.join(".codefetchignore");
    if codefetchignore.exists() {
        if let Some(e) = ignore_builder.add(&codefetchignore) {
            eprintln!("Warning: Failed to parse .codefetchignore: {}", e);
        }
    }
    // Add default ignore patterns
    for line in DEFAULT_IGNORE_PATTERNS.lines() {
        ignore_builder
            .add_line(None, line.trim())
            .map_err(|e| e.to_string())?;
    }
    let ig = ignore_builder.build().map_err(|e| e.to_string())?;

    // Build file tree recursively
    fn build_tree(
        path: &Path,
        base_dir: &Path,
        ig: &ignore::gitignore::Gitignore,
    ) -> Result<Vec<FileTreeNode>, String> {
        let mut nodes = Vec::new();

        match fs::read_dir(path) {
            Ok(entries) => {
                for entry in entries.flatten() {
                    let path = entry.path();
                    let rel_path = path.strip_prefix(base_dir).unwrap_or(&path);

                    // Skip if path is ignored by gitignore
                    if ig.matched(rel_path, path.is_dir()).is_ignore() {
                        continue;
                    }

                    let is_dir = path.is_dir();
                    let file_name = path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("unknown")
                        .to_string();

                    let children = if is_dir {
                        match build_tree(&path, base_dir, ig) {
                            Ok(children) => Some(children),
                            Err(e) => return Err(e),
                        }
                    } else {
                        None
                    };

                    nodes.push(FileTreeNode {
                        name: file_name,
                        path: path.to_string_lossy().to_string(),
                        children,
                        is_directory: is_dir,
                    });
                }
            }
            Err(e) => return Err(format!("Failed to read directory: {}", e)),
        }

        // Sort: directories first, then files alphabetically
        nodes.sort_by(|a, b| match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        });

        Ok(nodes)
    }

    build_tree(&dir, &dir, &ig).map_err(|e| e.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            run_codefetch,
            calculate_file_tokens,
            get_file_tree
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
