use super::persistence::StateError;
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum LicenseError {
    #[error("Store operation failed: {0}")]
    StoreError(String),
    #[error("State handling error: {0}")]
    StateHandlingError(#[from] StateError),
    #[error("API request failed: {0}")]
    ApiRequestError(#[from] reqwest::Error),
    #[error("Invalid response from API: {0}")]
    ApiResponseError(String),
    #[error("Internal error: {0}")]
    InternalError(String),
    #[error("Activation required: Maximum workspace limit ({0}) reached for free tier.")]
    WorkspaceLimitReached(usize),
    #[error("Your license has expired.")]
    LicenseExpired,
}

impl From<tauri_plugin_store::Error> for LicenseError {
    fn from(e: tauri_plugin_store::Error) -> Self {
        LicenseError::StoreError(e.to_string())
    }
}
// -- Api Error format for front end --
#[derive(Debug, Serialize)]
pub struct ApiError {
    code: String,
    message: String,
}

impl ApiError {
    pub fn new(code: &str, message: &str) -> Self {
        ApiError {
            code: code.to_string(),
            message: message.to_string(),
        }
    }
}

impl From<LicenseError> for ApiError {
    fn from(e: LicenseError) -> Self {
        match e {
            LicenseError::WorkspaceLimitReached(limit) => ApiError::new(
                "workspace_limit_reached",
                &format!("Free tier limit of {} workspaces reached", limit),
            ),
            LicenseError::LicenseExpired => {
                ApiError::new("license_expired", "Your license has expired.")
            }
            LicenseError::ApiResponseError(message) => {
                ApiError::new("api_response_error", &message)
            }
            LicenseError::ApiRequestError(error) => {
                ApiError::new("api_activation_error", &error.to_string())
            }
            other => ApiError::new("internal_error", &other.to_string()),
        }
    }
}
