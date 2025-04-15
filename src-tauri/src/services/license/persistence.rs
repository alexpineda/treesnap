use aes_gcm::aead::rand_core::RngCore;
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use hkdf::Hkdf;
use serde::{de::DeserializeOwned, Serialize};
use sha2::Sha256;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use thiserror::Error;
use tracing::{error, info, instrument};
use uuid::Uuid;

use super::constants::{APP_STATE_FILENAME, HKDF_SALT, MACHINE_ID_FILENAME};

// --- Error Type for State Handling ---
#[derive(Debug, Error)]
pub enum StateError {
    #[error("Could not resolve app data directory: {0}")]
    PathResolutionError(String),
    #[error("Filesystem I/O error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    SerializationError(#[from] bincode::Error),
    #[error("Encryption/Decryption error: {0}")]
    EncryptionError(aes_gcm::Error),
    #[error("Key derivation error: {0}")]
    KeyDerivationError(String),
    #[error("Machine ID is missing.")]
    MissingMachineId,
    #[error("Internal state error: {0}")]
    InternalError(String),
}

// --- State Loading/Saving Helpers ---

fn get_data_file_path(app_handle: &AppHandle, filename: &str) -> Result<PathBuf, StateError> {
    let data_dir = app_handle
        .path() // Changed from .path().app_local_data_dir()
        .app_local_data_dir()
        .ok() // Convert Result to Option
        .ok_or_else(|| {
            // Use ok_or_else on the Option
            StateError::PathResolutionError("Could not resolve app local data dir".to_string())
        })?;

    if !data_dir.exists() {
        fs::create_dir_all(&data_dir)?;
    }

    Ok(data_dir.join(filename))
}

fn derive_key(machine_id: &str) -> Result<[u8; 32], StateError> {
    let hk = Hkdf::<Sha256>::new(Some(HKDF_SALT), machine_id.as_bytes());
    let mut okm = [0u8; 32];
    hk.expand(&[], &mut okm)
        .map_err(|e| StateError::KeyDerivationError(format!("HKDF expansion failed: {}", e)))?;
    Ok(okm)
}

#[instrument(skip(app_handle))]
pub async fn get_or_create_machine_id(app_handle: &AppHandle) -> Result<String, StateError> {
    let id_file_path = get_data_file_path(app_handle, MACHINE_ID_FILENAME)?;
    let machine_id: String;

    if id_file_path.exists() {
        machine_id = fs::read_to_string(&id_file_path)?;
        info!("Loaded machine ID from {:?}", id_file_path);
    } else {
        info!("Machine ID file not found. Generating new ID.");
        machine_id = Uuid::new_v4().to_string();
        fs::write(&id_file_path, &machine_id)?;
        info!("Generated and saved new machine ID to {:?}", id_file_path);
    }

    Ok(machine_id)
}

#[instrument(skip(app_handle, machine_id))]
pub fn load_encrypted_state<T: DeserializeOwned + Default>(
    app_handle: &AppHandle,
    machine_id: &str,
) -> Result<T, StateError> {
    let file_path = get_data_file_path(app_handle, APP_STATE_FILENAME)?;
    if !file_path.exists() {
        info!(
            "State file not found ('{}'), returning default.",
            APP_STATE_FILENAME
        );
        return Ok(T::default());
    }

    info!("Loading state from: {:?}", file_path);
    let mut file = File::open(&file_path)?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;

    if buffer.len() <= 12 {
        // Nonce size
        error!(
            "State file '{}' is corrupted or too small.",
            APP_STATE_FILENAME
        );
        return Ok(T::default()); // Return default if corrupted
    }

    let (nonce_bytes, ciphertext) = buffer.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    let key = derive_key(machine_id)?;
    let cipher = Aes256Gcm::new(&key.into());

    let plaintext = match cipher.decrypt(nonce, ciphertext) {
        Ok(pt) => pt,
        Err(e) => {
            error!(
                "Decryption failed for state file '{}': {}. Returning default state.",
                APP_STATE_FILENAME, e
            );
            return Ok(T::default());
        }
    };

    let state: T = match bincode::deserialize(&plaintext) {
        Ok(s) => s,
        Err(e) => {
            error!(
                "Deserialization failed for state file '{}': {}. Returning default state.",
                APP_STATE_FILENAME, e
            );
            return Ok(T::default());
        }
    };

    info!(
        "Successfully loaded and decrypted state ('{}').",
        APP_STATE_FILENAME
    );
    Ok(state)
}

#[instrument(skip(app_handle, state, machine_id))]
pub fn save_encrypted_state<T: Serialize>(
    app_handle: &AppHandle,
    state: &T,
    machine_id: &str,
) -> Result<(), StateError> {
    let key = derive_key(machine_id)?;
    let cipher = Aes256Gcm::new(&key.into());
    let serialized_state = bincode::serialize(state)?;

    let mut nonce_bytes = [0u8; 12];
    let mut rng = OsRng;
    rng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, serialized_state.as_slice())
        .map_err(StateError::EncryptionError)?;

    let file_path = get_data_file_path(app_handle, APP_STATE_FILENAME)?;
    info!(
        "Saving encrypted state ('{}') to: {:?}",
        APP_STATE_FILENAME, file_path
    );

    // Atomic write
    let temp_file_path = file_path.with_extension("tmp");
    let mut file = File::create(&temp_file_path)?;
    file.write_all(&nonce_bytes)?;
    file.write_all(&ciphertext)?;
    file.sync_all()?;
    fs::rename(&temp_file_path, &file_path)?;

    info!(
        "Successfully saved encrypted state ('{}').",
        APP_STATE_FILENAME
    );
    Ok(())
}
