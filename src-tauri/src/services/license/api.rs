use super::constants::MAX_FREE_WORKSPACES;
use super::errors::LicenseError;
use super::persistence::{get_or_create_machine_id, load_encrypted_state, save_encrypted_state};
use chrono::Utc;
use std::path::Path;
use tracing::{debug, error, info, instrument, warn};

use super::state::{
    ActivateRequest, ActivateResponse, ApiDeviceInfo, ApiErrorResponse, AppState, LicenseStatus,
    LocalLicenseState, LocalUsageStats, WorkspaceLimitStatus,
};
use reqwest::Client;
use tauri::{AppHandle, Manager};

// --- Helper Functions ---

fn get_os_type() -> Result<String, LicenseError> {
    Ok(std::env::consts::OS.to_string())
}

// --- Public API ---

// Internal function for easier testing and separation
#[instrument(skip(app_handle, client, license_key))] // Skip sensitive key
pub async fn activate_license_internal(
    app_handle: &AppHandle,
    client: Client,
    license_key: String,
) -> Result<LocalLicenseState, LicenseError> {
    // FREE MODE: ignore network and force local activation
    let _ = client;
    let _ = license_key;
    let machine_id = get_or_create_machine_id(app_handle).await?;
    let mut app_state = load_encrypted_state::<AppState>(app_handle, &machine_id)?;
    app_state.license = LocalLicenseState {
        status: LicenseStatus::Activated,
        license_type: Some("free".into()),
        expires_at: None,
        ref_code: None,
        ref_code_expires_at: None,
    };
    app_state.usage = LocalUsageStats::default();
    save_encrypted_state(app_handle, &app_state, &machine_id)?;
    info!("FREE MODE: Local application state set to activated (free).");
    Ok(app_state.license)
}

#[instrument(skip(app_handle))]
pub async fn get_local_license_state_internal(
    app_handle: &AppHandle,
) -> Result<LocalLicenseState, LicenseError> {
    let machine_id = get_or_create_machine_id(app_handle).await?;
    let mut app_state = load_encrypted_state::<AppState>(app_handle, &machine_id)?;
    // FREE MODE: always activated
    if app_state.license.status != LicenseStatus::Activated {
        app_state.license = LocalLicenseState {
            status: LicenseStatus::Activated,
            license_type: Some("free".into()),
            expires_at: None,
            ref_code: None,
            ref_code_expires_at: None,
        };
        save_encrypted_state(app_handle, &app_state, &machine_id)?;
        info!("FREE MODE: Auto-set license to activated.");
    }
    Ok(app_state.license.clone())
}

/// Checks if opening a new workspace is allowed based on the license state.
/// If inactive, it also records the workspace path if under the limit.
#[instrument(skip(app_handle))]
pub async fn check_and_record_workspace_access(
    app_handle: &AppHandle,
    new_workspace_path: &str,
) -> Result<(), LicenseError> {
    let _ = app_handle;
    let _ = new_workspace_path;
    // FREE MODE: always allow
    info!("FREE MODE: workspace access granted.");
    Ok(())
}

#[instrument(skip(app_handle))]
pub async fn check_workspace_limit_internal(
    app_handle: &AppHandle,
) -> Result<WorkspaceLimitStatus, LicenseError> {
    let _ = app_handle;
    // FREE MODE: unlimited (report 0/limit and allowed=true)
    Ok(WorkspaceLimitStatus { allowed: true, used: 0, limit: MAX_FREE_WORKSPACES })
}
