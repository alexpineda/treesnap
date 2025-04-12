use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct FileTreeNode {
    pub name: String,
    pub path: String,
    pub children: Option<Vec<FileTreeNode>>,
    pub is_directory: bool,
    pub token_count: Option<usize>,
    pub last_modified: Option<u64>,
}
