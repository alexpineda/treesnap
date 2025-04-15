use super::persistence::StateError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum LicenseError {
    #[error("Store operation failed: {0}")]
    StoreError(String),
    #[error("State handling error: {0}")]
    StateHandlingError(#[from] StateError),
    #[error("API request failed: {0}")]
    ApiRequestError(#[from] reqwest::Error),
    #[error("API activation failed: Status {0}, Message: {1}")]
    ApiActivationError(u16, String),
    #[error("Invalid response from API: {0}")]
    ApiResponseError(String),
    #[error("Internal error: {0}")]
    InternalError(String),
    #[error("Activation required: Maximum workspace limit ({0}) reached for free tier.")]
    WorkspaceLimitReached(usize),
    #[error("Could not determine OS type.")]
    OsDetectionError,
    #[error("Your license has expired.")]
    LicenseExpired,
}

impl From<tauri_plugin_store::Error> for LicenseError {
    fn from(e: tauri_plugin_store::Error) -> Self {
        LicenseError::StoreError(e.to_string())
    }
}
