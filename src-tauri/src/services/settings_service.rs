use crate::{
    constants::SETTINGS_STORE_FILENAME, domain::application_settings::ApplicationSettings,
};
use serde_json;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager, State, Wry};
use tauri_plugin_store::StoreExt;
use tracing::{debug, error, info, warn};

const SETTINGS_KEY: &str = "application_settings";

pub fn load_application_settings_internal(app_handle: &AppHandle) -> ApplicationSettings {
    info!("Attempting to load application settings using StoreExt...");
    let path = Path::new(SETTINGS_STORE_FILENAME);
    let store = match app_handle.store(path) {
        Ok(store) => store,
        Err(e) => {
            error!(
                "Failed to get store instance '{}': {}. Returning default.",
                path.display(),
                e
            );
            return ApplicationSettings::default();
        }
    };

    match store.get(SETTINGS_KEY) {
        Some(settings_value) => {
            match serde_json::from_value::<ApplicationSettings>(settings_value.clone()) {
                Ok(loaded_settings) => {
                    info!("Successfully loaded settings: {:?}", loaded_settings);
                    loaded_settings
                }
                Err(e) => {
                    error!("Failed to deserialize settings: {}. Returning default.", e);
                    ApplicationSettings::default()
                }
            }
        }
        None => {
            error!(
                "No settings under key '{}'. Returning default.",
                SETTINGS_KEY
            );
            ApplicationSettings::default()
        }
    }
}

pub fn save_application_settings_internal(
    app_handle: &AppHandle,
    settings: &ApplicationSettings,
) -> Result<(), String> {
    info!("Attempting to save application settings: {:?}", settings);
    let store = app_handle
        .store(Path::new(SETTINGS_STORE_FILENAME))
        .map_err(|e| format!("Cannot open settings store: {}", e))?;

    store.set(
        SETTINGS_KEY,
        serde_json::to_value(settings).map_err(|e| e.to_string())?,
    );

    store
        .save()
        .map_err(|e| format!("Failed to write settings to disk: {}", e))
}
