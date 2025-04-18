// --- Constants ---
pub const MAX_FREE_WORKSPACES: usize = 3;
#[cfg(dev)]
pub const LICENSE_API_ENDPOINT: &str = "http://localhost:3001/api/license-activation";
#[cfg(not(dev))]
pub const LICENSE_API_ENDPOINT: &str = "https://reposnap.io/api/license-activation";
pub const APP_STATE_FILENAME: &str = "app_state.bin";
pub const MACHINE_ID_FILENAME: &str = "mach.id";
pub const HKDF_SALT: &[u8] = b"reposnap-hkdf-salt";
