// Declare the sub-modules
pub mod api;
pub mod constants;
pub mod errors;
pub mod persistence;
pub mod state;

// Re-export key items for easier access from `services::license::*`
pub use api::{
    activate_license_internal, check_and_record_workspace_access, check_workspace_limit_internal,
    get_local_license_state_internal,
};
pub use errors::LicenseError;
pub use state::LocalLicenseState;
