use super::constants::MAX_FREE_WORKSPACES;
use super::errors::LicenseError;
use super::persistence::{get_or_create_machine_id, load_encrypted_state, save_encrypted_state};
use chrono::Utc;
use std::path::Path;
use tracing::{error, info, instrument, warn};

use super::constants::LICENSE_API_ENDPOINT;
use super::state::{
    ActivateRequest, ActivateResponse, ApiDeviceInfo, AppState, LocalLicenseState, LocalUsageStats,
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
    let machine_id = get_or_create_machine_id(app_handle).await?;
    let os = get_os_type()?;
    let app_version = app_handle.package_info().version.to_string();

    let device_info = ApiDeviceInfo {
        machine_id: machine_id.clone(), // Clone machine_id for the request
        os,
        app_version,
    };

    let request_payload = ActivateRequest {
        license_key: license_key.trim().to_string(),
        device_info,
    };

    info!(payload = ?request_payload, "Sending activation request");

    let response = client
        .post(LICENSE_API_ENDPOINT)
        .json(&request_payload)
        .send()
        .await?
        .error_for_status()?; // Use reqwest's built-in error handling for non-2xx

    let status = response.status();
    let response_body_text = response.text().await?; // Read body after checking status

    info!("Activation API call successful (Status: {})", status);
    let parsed_response: ActivateResponse =
        serde_json::from_str(&response_body_text).map_err(|e| {
            LicenseError::ApiResponseError(format!(
                "Failed to parse success response: {}. Body: {}",
                e, response_body_text
            ))
        })?;

    info!(response = ?parsed_response, "Parsed activation response");

    // Load the current AppState to update it
    let mut app_state = load_encrypted_state::<AppState>(app_handle, &machine_id)?;

    // Update the license part of the state
    app_state.license = LocalLicenseState {
        status: "activated".to_string(),
        license_type: Some(parsed_response.license_type),
        expires_at: parsed_response.expires_at,
    };

    // Clear the usage stats as they are no longer needed for activated state
    app_state.usage = LocalUsageStats::default();

    // Save the updated consolidated state
    save_encrypted_state(app_handle, &app_state, &machine_id)?;

    info!("Local application state updated to activated.");

    // Return the updated license state portion
    Ok(app_state.license)
}

#[instrument(skip(app_handle))]
pub async fn get_local_license_state_internal(
    app_handle: &AppHandle,
) -> Result<LocalLicenseState, LicenseError> {
    let machine_id = get_or_create_machine_id(app_handle).await?;
    let mut app_state = load_encrypted_state::<AppState>(app_handle, &machine_id)?;
    if app_state.license.status == "activated" {
        // Check expiry if the license has an expiration date
        if let Some(expires_at) = app_state.license.expires_at {
            if Utc::now() > expires_at {
                warn!(
                    "License has expired (Expired at: {}). Updating state.",
                    expires_at
                );
                // Optionally, could reset the status here before returning error
                app_state.license.status = "expired".to_string();
                save_encrypted_state(app_handle, &app_state, &machine_id)?;
            }
        }
        // If no expiry date or not expired, access is granted
    }
    Ok(app_state.license)
}

/// Checks if opening a new workspace is allowed based on the license state.
/// If inactive, it also records the workspace path if under the limit.
#[instrument(skip(app_handle))]
pub async fn check_and_record_workspace_access(
    app_handle: &AppHandle,
    new_workspace_path: &str,
) -> Result<(), LicenseError> {
    let machine_id = get_or_create_machine_id(app_handle).await?;
    let mut app_state = load_encrypted_state::<AppState>(app_handle, &machine_id)?;

    if app_state.license.status == "activated" {
        // If no expiry date or not expired, access is granted
        info!("License activated and valid, access granted.");
        return Ok(());
    }

    if app_state.license.status == "expired" {
        warn!("License expired, access denied.");
        return Err(LicenseError::LicenseExpired);
    }

    // If inactive, check the limit
    info!("License inactive, checking workspace limit.");

    let canonical_path = Path::new(new_workspace_path)
        .canonicalize()
        .map_err(|e| {
            LicenseError::InternalError(format!(
                "Invalid workspace path {}: {}",
                new_workspace_path, e
            ))
        })?
        .to_string_lossy()
        .to_string();

    if app_state
        .usage
        .unique_workspaces_opened
        .contains(&canonical_path)
    {
        info!("Workspace already opened in free tier, access granted.");
        Ok(()) // Already opened this one before
    } else if app_state.usage.unique_workspaces_opened.len() < MAX_FREE_WORKSPACES {
        info!("Adding new workspace to free tier list.");
        app_state
            .usage
            .unique_workspaces_opened
            .insert(canonical_path);
        save_encrypted_state(app_handle, &app_state, &machine_id)?;
        Ok(())
    } else {
        error!("Workspace limit reached for free tier.");
        Err(LicenseError::WorkspaceLimitReached(MAX_FREE_WORKSPACES))
    }
}
