use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

// --- Structs ---

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LocalLicenseState {
    pub status: String, // "inactive" | "activated"
    #[serde(rename = "type")]
    pub license_type: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
}

impl Default for LocalLicenseState {
    fn default() -> Self {
        Self {
            status: "inactive".to_string(),
            license_type: None,
            expires_at: None,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct LocalDeviceInfo {
    pub machine_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct LocalUsageStats {
    pub unique_workspaces_opened: HashSet<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ApiDeviceInfo {
    pub machine_id: String,
    pub os: String,
    pub app_version: String,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ActivateRequest {
    pub license_key: String,
    pub device_info: ApiDeviceInfo,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ActivateResponse {
    pub status: String,
    #[serde(rename = "type")]
    pub license_type: String,
    pub expires_at: Option<DateTime<Utc>>,
}

// Structure to deserialize API error responses
#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ApiErrorResponse {
    pub error: String,
    pub code: Option<String>,
}

// New consolidated state struct
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub license: LocalLicenseState,
    pub device: LocalDeviceInfo, // Keep device info if needed for future checks
    pub usage: LocalUsageStats,
}
