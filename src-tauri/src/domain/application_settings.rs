use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationSettings {
    pub schema_version: u32,
    pub app_version: String,
    pub tree_option: String,
}

impl Default for ApplicationSettings {
    fn default() -> Self {
        Self {
            schema_version: 1,
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            tree_option: "include".to_string(),
        }
    }
}
