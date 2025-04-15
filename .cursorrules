This is a Tauri app using bun and typescript/react on the front end.

It's meant to analyse a directory, get token counts for files of interset, and compile a file tree and file contents.

# ** UI **

The UI should be kept as simple and streamlined as possible. All heavy processing should be delegated to the rust back end.

## UI Without open directories (tabs):

Show recent opened directories and an Open Folder button

## UI With open directories (tabs):

### Left side:

    - Directory name
    - Token totals
    - Filters
    - File navigation + selection

### Right side:

Split into 3 sections:

- Top nav
- Selected file summary
- Treemap view

### Key UX Ideas

Users select files to include in their file set.
The files are asynchronously tallied for token counts by rust.
The UI should be snappy and eager update, filling in token counts as they arrive.
The selected file summary provides sorting files based on token count for better analysis.
The treemap also provides additional analysis of files by token count.
The user can then copy the file tree plus concatenated selected files with the Copy button or Export to a markdown format.

## Main area

Token counts are calculated for each file and a sum is provided.
Files are shown by token counts.
Users can deselect from this view as well.

** Rust backend **

Responsible for file handling and processing and messaging for the UI.

## Other

Reference markdown documents for tauri can be found under /reference

# License Rules

Free: Up to 3 unique workspaces (no license needed)
Basic: 1 user seat / 1 machine max
Standard: 2 user seats / 2 machines max
Team: TBD (multi-seat, volume licenses, admin dashboard?)

## 🔁 Full License Workflow (Accurate & Clear)

---

### 🟢 App Launch

- Load local license
- If **license is valid and not expired** → full access, check for updates
- If **license is expired** → full access **but skip update check**
- If **no license at all** → operate in free tier mode

---

### 🟡 Workspace Opened

- Load local `workspace_ids` array
- If **license exists** → no limit enforcement, proceed
- If **no license**:
  - If workspace ID already seen → proceed
  - If workspace ID is new:
    - Add it to tracked list
    - If count exceeds 3:
      - Prompt user to enter/purchase license
      - Block access to opening new workspace

---

### 🛒 User Purchases License (Stripe Webhook)

- Webhook hits `/api/licenses/purchase`
  - Generate license key
  - Save `license`, `purchase`, `plan`, and `available_seats` to DB
  - Email key to buyer

---

### 🔑 User Activates License (From App)

- User enters key in UI
- POST `/api/licenses/activate` with:
  ```json
  {
    "key": "RPS-XXXXX",
    "machine_id": "ABC-123"
  }
  ```
- Server checks:
  - Valid key?
  - Not expired?
  - Seats/machines left?
- If OK:
  - Return plan, expiration, activation_id
  - Save locally to disk (psuedocode):
    ```json
    {
      "license": {
        "key": "RPS-XXXXX",
        "plan": "basic",
        "machine_id": "ABC-123",
        "expires_at": "...",
        "activated": true
      }
    }
    ```

---

### 🔄 App Update Check

- Happens **only** if license exists AND not expired
- Otherwise silently skip update fetch

---

### 👮 Enforcement Rules

| Scenario                   | Result                        |
| -------------------------- | ----------------------------- |
| No license, ≤ 3 workspaces | ✅ Full use                   |
| No license, > 3 workspaces | ❌ Prompt to enter license    |
| License expired            | ✅ Full use, ❌ No updates    |
| License invalid or revoked | ❌ Prompt + restrict features |

---

# More workflow details

**Here’s how the licensing flow works, step by step, referencing the code in** `/src-tauri/src/services/license` **and how errors bubble up:**

---

## 1. Local Machine ID & Encrypted State

1. On startup (or whenever the license checks run), the code tries to load a unique `machine_id` from disk.
   - See [`get_or_create_machine_id`](persistence.rs):
     - It looks for `mach.id` on disk (in your local app data dir).
     - If not found, it generates a new UUID and writes it out.
     - Returns the machine ID as a `String`.
2. This `machine_id` is used to derive an AES encryption key via HKDF (see [`derive_key`](persistence.rs)).
3. License data is stored in `app_state.bin`, encrypted with that derived key.
4. On reads/writes:
   - The code loads or saves a top-level `AppState` struct (see [`load_encrypted_state` / `save_encrypted_state`](persistence.rs)) which contains:
     ```rs
     pub struct AppState {
       pub license: LocalLicenseState,  // status, license_type, expires_at
       pub device: LocalDeviceInfo,     // machine_id if needed
       pub usage: LocalUsageStats,      // how many unique folders opened, etc
     }
     ```

---

## 2. Activating a License

### 2.1 Frontend Calls Tauri Command

- In `lib.rs` you have a Tauri command:
  ```rs
  #[tauri::command]
  async fn activate_license(
      app_handle: AppHandle,
      client_state: State<'_, LicenseClient>,
      license_key: String
  ) -> Result<LocalLicenseState, String> {
      // ...
      match license::activate_license_internal(&app_handle, client, license_key).await {
          Ok(new_state) => Ok(new_state),
          Err(e) => Err(e.to_string()),
      }
  }
  ```
  - The user provides a `license_key` from the UI.
  - `client_state` is a managed `reqwest::Client`.

### 2.2 Making the API Request

- The above command calls [`activate_license_internal`](api.rs):
  1. `get_or_create_machine_id` → ensures we have a stable `machine_id`.
  2. Gathers OS info, app version, etc. → forms an `ActivateRequest`.
  3. Sends a `POST` to `LICENSE_API_ENDPOINT`.
  4. Uses `.error_for_status()?` so non-200 responses automatically bubble up as a `reqwest::Error`.

### 2.3 Parsing Response & Updating Local State

- If the request succeeds, `activate_license_internal`:
  1. Parses the JSON into `ActivateResponse { status, license_type, expires_at }`.
  2. Loads your local `AppState` (decrypted).
  3. Updates `app_state.license = LocalLicenseState { status: "activated", ... }`.
  4. Resets usage stats, so your free-tier counting is irrelevant post-activation.
  5. Saves that updated `AppState` back to disk (encrypted).
  6. Returns an `Ok(LocalLicenseState)`.

### 2.4 Error Handling in Activation

- Errors are turned into `LicenseError` variants.
  - For example, if JSON parsing fails, you get an `ApiResponseError(...)`.
  - If `error_for_status()` fails, you get a `ApiRequestError( reqwest::Error )`.
  - If machine ID can’t be created/saved, you get `StateHandlingError(...)`.
- These bubble up to the Tauri command as `Err(LicenseError)`; the Tauri command maps them to `Err(e.to_string())` for your frontend to see.

---

## 3. Checking License on Workspace Access

### 3.1 Where It’s Called

- In `lib.rs` → `open_workspace` command does:
  ```rs
  license::check_and_record_workspace_access(&app_handle, &dir_path).await?;
  ```
  If that fails, it returns an error to the UI.

### 3.2 Logic

- [`check_and_record_workspace_access`](api.rs):
  1. Loads your `AppState`.
  2. If `app_state.license.status == "activated"`, checks `expires_at`.
     - If expired, returns `LicenseError::LicenseExpired`.
     - Else, OK.
  3. If not activated:
     - Looks at how many unique folders you’ve opened in the `app_state.usage.unique_workspaces_opened` set.
     - If that set is under `MAX_FREE_WORKSPACES` (3 by default), it inserts the new path and saves. Otherwise, errors with `WorkspaceLimitReached(3)`.

### 3.3 Error Handling

- Typical outcomes are:
  - `Ok(())` → user can open the folder.
  - `LicenseError::WorkspaceLimitReached(3)` → free-tier limit hit.
  - `LicenseError::LicenseExpired` → user’s license is expired.
- Those bubble up as Tauri command errors → front-end sees user-friendly string from the `match e { ... }` block in `open_workspace`.

---

## 4. Summary of Error Flow

1. **Any file I/O** or **API request** can bubble up as a `LicenseError`:
   - [`StateError`](persistence.rs) is wrapped → `StateHandlingError`.
   - Reqwest failures → `ApiRequestError`.
   - JSON parse fails → `ApiResponseError`.
   - License logic fail → custom `WorkspaceLimitReached(...)`, `LicenseExpired`, etc.
2. Tauri commands do `?` on these calls, so if something fails, the function short-circuits returning an `Err(...)` to the UI.
3. The UI sees that as an exception in the `.invoke` or an error in the promise if you use `invoke()` from JS/TS.

---

## 5. Quick Points on the Encryption

- Local license info is encrypted with AES-256-GCM:
  - Key derived from `machine_id` + `HKDF_SALT`.
  - Nonce is random each time you save.
- If decryption or deserialization fails, the code defaults to a “clean slate” rather than crashing:
  ```rs
  "Decryption failed … returning default state."
  ```
  so worst-case scenario is the user loses the saved license data and has to re-activate.

---

### That’s the broad data flow for licensing:

- **Generate/Load machine_id** → **Store or load `AppState`** → **Activate by calling license API** → **Check workspace usage** → **Error out or proceed**.
- All errors funnel through the `LicenseError` enum, get mapped in Tauri commands, and surface to the UI as strings.
