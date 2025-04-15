// Hard-coded default ignore patterns (akin to your Node code's default-ignore.ts).
pub const DEFAULT_IGNORE_PATTERNS: &str = r#"
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

pub const CACHE_STORE_FILENAME: &str = "cache.dat";
pub const SETTINGS_STORE_FILENAME: &str = "settings.dat";
