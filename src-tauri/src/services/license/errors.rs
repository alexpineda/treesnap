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
    #[error("API activation failed: Status {status}, Code {code:?}, Message: {message}")]
    ApiActivationError {
        status: u16,
        code: Option<String>,
        message: String,
    },
    #[error("Failed to parse API response: {0}")]
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
            LicenseError::StoreError(msg) => ApiError::new("store_error", &msg),
            LicenseError::StateHandlingError(error) => {
                ApiError::new("state_error", &error.to_string())
            }
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
                let message = match error.status() {
                    Some(status) => format!("Network request failed with status: {}", status),
                    None => "Network request failed. Please check your connection.".to_string(),
                };
                ApiError::new("api_request_error", &message)
            }
            LicenseError::ApiActivationError { code, message, .. } => {
                ApiError::new(code.as_deref().unwrap_or("activation_failed"), &message)
            }
            LicenseError::InternalError(msg) => ApiError::new("internal_error", &msg),
        }
    }
}
