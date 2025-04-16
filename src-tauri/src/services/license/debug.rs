#[cfg(debug_assertions)]
use super::persistence::{
    get_or_create_machine_id, load_encrypted_state, save_encrypted_state, StateError,
};
#[cfg(debug_assertions)]
use super::state::{AppState, LicenseStatus, LocalLicenseState, LocalUsageStats};
#[cfg(debug_assertions)]
use chrono::{Duration as ChronoDuration, Utc};
#[cfg(debug_assertions)]
use std::collections::HashSet;
#[cfg(debug_assertions)]
use std::str::FromStr;
#[cfg(debug_assertions)]
use std::time::{Duration, SystemTime};
#[cfg(debug_assertions)]
use tauri::{AppHandle, Manager, State};
#[cfg(debug_assertions)]
use tracing::{info, instrument, warn};

#[cfg(debug_assertions)]
#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DebugLicenseParams {
    status: Option<String>,
    license_type: Option<String>,
    expires_at_offset_days: Option<i64>,
}

/// Sets the local license state for debugging purposes.
/// Only available in debug builds.
#[cfg(debug_assertions)]
#[tauri::command]
#[instrument(skip(app_handle))]
pub async fn debug_set_license_state(
    app_handle: AppHandle,
    params: DebugLicenseParams,
) -> Result<(), String> {
    warn!(
        "DEBUG COMMAND: Setting license state with params: {:?}",
        params
    );
    let machine_id = get_or_create_machine_id(&app_handle)
        .await
        .map_err(|e| format!("Failed to get machine ID: {}", e))?;

    let mut app_state: AppState = load_encrypted_state(&app_handle, &machine_id)
        .map_err(|e| format!("Failed to load state: {}", e))?;

    let mut new_license_state = app_state.license.clone(); // Start with current or default

    if let Some(status) = params.status {
        new_license_state.status =
            LicenseStatus::from_str(&status).map_err(|e| format!("Invalid status: {}", e))?;
    }
    if let Some(license_type) = params.license_type {
        new_license_state.license_type = Some(license_type);
    } else if new_license_state.status == LicenseStatus::Activated {
        // Default to basic if activating and no type specified
        new_license_state.license_type = Some("basic".to_string());
    }

    if let Some(offset_days) = params.expires_at_offset_days {
        let now = Utc::now();
        let new_expiry = now + ChronoDuration::days(offset_days);
        new_license_state.expires_at = Some(new_expiry);
    } else if new_license_state.status == LicenseStatus::Activated {
        // Default to 1 year if activating and no expiry specified
        new_license_state.expires_at = Some(Utc::now() + ChronoDuration::days(365));
    }

    // If activating, clear usage stats
    if new_license_state.status == LicenseStatus::Activated {
        app_state.usage = LocalUsageStats::default();
        info!("License activated via debug, resetting usage stats.");
    }

    app_state.license = new_license_state;

    save_encrypted_state(&app_handle, &app_state, &machine_id)
        .map_err(|e| format!("Failed to save state: {}", e))?;

    info!("DEBUG: Successfully updated license state.");
    Ok(())
}

/// Clears the local license state and usage stats for debugging.
/// Only available in debug builds.
#[cfg(debug_assertions)]
#[tauri::command]
#[instrument(skip(app_handle))]
pub async fn debug_clear_license_state(app_handle: AppHandle) -> Result<(), String> {
    warn!("DEBUG COMMAND: Clearing all license state and usage stats.");
    let machine_id = get_or_create_machine_id(&app_handle)
        .await
        .map_err(|e| format!("Failed to get machine ID: {}", e))?;

    let default_state = AppState::default(); // Create a completely default state

    save_encrypted_state(&app_handle, &default_state, &machine_id)
        .map_err(|e| format!("Failed to save default state: {}", e))?;

    info!("DEBUG: Successfully cleared license state and usage.");
    Ok(())
}

/// Adds a specified number of dummy workspace paths to usage stats.
/// Only available in debug builds.
#[cfg(debug_assertions)]
#[tauri::command]
#[instrument(skip(app_handle))]
pub async fn debug_add_usage_entries(app_handle: AppHandle, count: usize) -> Result<(), String> {
    warn!("DEBUG COMMAND: Adding {} dummy workspace entries.", count);
    let machine_id = get_or_create_machine_id(&app_handle)
        .await
        .map_err(|e| format!("Failed to get machine ID: {}", e))?;

    let mut app_state: AppState = load_encrypted_state(&app_handle, &machine_id)
        .map_err(|e| format!("Failed to load state: {}", e))?;

    if app_state.license.status == LicenseStatus::Activated {
        warn!("DEBUG: License is activated, not modifying usage stats.");
        return Ok(());
    }

    for i in 0..count {
        app_state
            .usage
            .unique_workspaces_opened
            .insert(format!("/dummy/path/{}", i));
    }

    save_encrypted_state(&app_handle, &app_state, &machine_id)
        .map_err(|e| format!("Failed to save state: {}", e))?;

    info!(
        "DEBUG: Added {} dummy entries. Total unique workspaces: {}",
        count,
        app_state.usage.unique_workspaces_opened.len()
    );
    Ok(())
}
