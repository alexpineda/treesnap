# Device Features

## Barcode Scanner | Tauri
[https://v2.tauri.app/plugin/barcode-scanner/](https://v2.tauri.app/plugin/barcode-scanner/)

# Barcode Scanner

Allows your mobile application to use the camera to scan QR codes, EAN-13, and other kinds of barcodes.

## Supported Platforms

This plugin requires a Rust version of at least **1.77.2**.

| Platform | Level | Notes |
| --- | --- | --- |
| windows |  |  |
| linux |  |  |
| macos |  |  |
| android |  |  |
| ios |  |  |

## Setup

Install the barcode-scanner plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add barcode-scanner
```

```
yarn run tauri add barcode-scanner
```

```
pnpm tauri add barcode-scanner
```

```
deno task tauri add barcode-scanner
```

```
bun tauri add barcode-scanner
```

```
cargo tauri add barcode-scanner
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-barcode-scanner --target 'cfg(any(target_os = "android", target_os = "ios"))'
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(mobile)]
            app.handle().plugin(tauri_plugin_barcode_scanner::init());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-barcode-scanner
```

```
yarn add @tauri-apps/plugin-barcode-scanner
```

```
pnpm add @tauri-apps/plugin-barcode-scanner
```

```
deno add npm:@tauri-apps/plugin-barcode-scanner
```

```
bun add @tauri-apps/plugin-barcode-scanner
```

## Configuration

On iOS, the barcode scanner plugin requires the `NSCameraUsageDescription` information property list value, which should describe why your app needs to use the camera.

In the `src-tauri/Info.ios.plist` file, add the following snippet:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>NSCameraUsageDescription</key>
    <string>Read QR codes</string>
  </dict>
</plist>
```

## Usage

The barcode scanner plugin is available in JavaScript.

```javascript
import { scan, Format } from '@tauri-apps/plugin-barcode-scanner';

// when using `"withGlobalTauri": true`, you may use
// const { scan, Format } = window.__TAURI__.barcodeScanner;

// `windowed: true` actually sets the webview to transparent
// instead of opening a separate view for the camera
// make sure your user interface is ready to show what is underneath with a transparent element

scan({ windowed: true, formats: [Format.QRCode] });
```

## Permissions

By default, all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```json
{
  "$schema": "../gen/schemas/mobile-schema.json",
  "identifier": "mobile-capability",
  "windows": ["main"],
  "platforms": ["iOS", "android"],
  "permissions": ["barcode-scanner:allow-scan", "barcode-scanner:allow-cancel"]
}
```

## Default Permission

This permission set configures which barcode scanning features are by default exposed.

### Granted Permissions

It allows all barcode-related features.

- `allow-cancel`
- `allow-check-permissions`
- `allow-open-app-settings`
- `allow-request-permissions`
- `allow-scan`
- `allow-vibrate`

## Permission Table

| Identifier | Description |
| --- | --- |
| `barcode-scanner:allow-cancel` | Enables the cancel command without any pre-configured scope. |
| `barcode-scanner:deny-cancel` | Denies the cancel command without any pre-configured scope. |
| `barcode-scanner:allow-check-permissions` | Enables the check_permissions command without any pre-configured scope. |
| `barcode-scanner:deny-check-permissions` | Denies the check_permissions command without any pre-configured scope. |
| `barcode-scanner:allow-open-app-settings` | Enables the open_app_settings command without any pre-configured scope. |
| `barcode-scanner:deny-open-app-settings` | Denies the open_app_settings command without any pre-configured scope. |
| `barcode-scanner:allow-request-permissions` | Enables the request_permissions command without any pre-configured scope. |
| `barcode-scanner:deny-request-permissions` | Denies the request_permissions command without any pre-configured scope. |
| `barcode-scanner:allow-scan` | Enables the scan command without any pre-configured scope. |
| `barcode-scanner:deny-scan` | Denies the scan command without any pre-configured scope. |
| `barcode-scanner:allow-vibrate` | Enables the vibrate command without any pre-configured scope. |
| `barcode-scanner:deny-vibrate` | Denies the vibrate command without any pre-configured scope. |

## Biometric | Tauri
[https://v2.tauri.app/plugin/biometric/](https://v2.tauri.app/plugin/biometric/)

# Biometric

Prompt the user for biometric authentication on Android and iOS.

## Supported Platforms

This plugin requires a Rust version of at least **1.77.2**.

| Platform | Level | Notes |
| --- | --- | --- |
| windows |  |  |
| linux |  |  |
| macos |  |  |
| android |  |  |
| ios |  |  |

## Setup

Install the biometric plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add biometric
```

```
yarn run tauri add biometric
```

```
pnpm tauri add biometric
```

```
deno task tauri add biometric
```

```
bun tauri add biometric
```

```
cargo tauri add biometric
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-biometric --target 'cfg(any(target_os = "android", target_os = "ios"))'
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(mobile)]
            app.handle().plugin(tauri_plugin_biometric::Builder::new().build());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-biometric
```

```
yarn add @tauri-apps/plugin-biometric
```

```
pnpm add @tauri-apps/plugin-biometric
```

```
deno add npm:@tauri-apps/plugin-biometric
```

```
bun add @tauri-apps/plugin-biometric
```

## Configuration

On iOS, the biometric plugin requires the `NSFaceIDUsageDescription` information property list value, which should describe why your app needs to use biometric authentication.

In the `src-tauri/Info.ios.plist` file, add the following snippet:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>NSFaceIDUsageDescription</key>
    <string>Authenticate with biometric</string>
  </dict>
</plist>
```

## Usage

This plugin enables you to verify the availability of Biometric Authentication on a device, prompt the user for biometric authentication, and check the result to determine if the authentication was successful or not.

### Check Status

You can check the status of Biometric Authentication, including its availability and the types of biometric authentication methods supported.

```javascript
import { checkStatus } from '@tauri-apps/plugin-biometric';

const status = await checkStatus();

if (status.isAvailable) {
  console.log('Yes! Biometric Authentication is available');
} else {
  console.log('No! Biometric Authentication is not available due to ' + status.error);
}
```

```rust
use tauri_plugin_biometric::BiometricExt;

fn check_biometric(app_handle: tauri::AppHandle) {
    let status = app_handle.biometric().status().unwrap();
    if status.is_available {
        println!("Yes! Biometric Authentication is available");
    } else {
        println!("No! Biometric Authentication is not available due to: {}", status.error.unwrap());
    }
}
```

### Authenticate

To prompt the user for Biometric Authentication, utilize the `authenticate()` method.

```javascript
import { authenticate } from '@tauri-apps/plugin-biometric';

const options = {
  allowDeviceCredential: false,
  cancelTitle: "Feature won't work if Canceled",
  fallbackTitle: 'Sorry, authentication failed',
  title: 'Tauri feature',
  subtitle: 'Authenticate to access the locked Tauri function',
  confirmationRequired: true,
};

try {
  await authenticate('This feature is locked', options);
  console.log('Hooray! Successfully Authenticated! We can now perform the locked Tauri function!');
} catch (err) {
  console.log('Oh no! Authentication failed because ' + err.message);
}
```

```rust
use tauri_plugin_biometric::{BiometricExt, AuthOptions};

fn bio_auth(app_handle: tauri::AppHandle) {
    let options = AuthOptions {
        allow_device_credential: false,
        cancel_title: Some("Feature won't work if Canceled".to_string()),
        fallback_title: Some("Sorry, authentication failed".to_string()),
        title: Some("Tauri feature".to_string()),
        subtitle: Some("Authenticate to access the locked Tauri function".to_string()),
        confirmation_required: Some(true),
    };

    match app_handle.biometric().authenticate("This feature is locked".to_string(), options) {
        Ok(_) => {
            println!("Hooray! Successfully Authenticated! We can now perform the locked Tauri function!");
        }
        Err(e) => {
            println!("Oh no! Authentication failed because : {e}");
        }
    }
}
```

## Permissions

By default, all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": ["biometric:default"]
}
```

## Default Permission

This permission set configures which biometric features are by default exposed.

### Granted Permissions

It allows access to all biometric commands.

- `allow-authenticate`
- `allow-status`

## Permission Table

| Identifier | Description |
| --- | --- |
| `biometric:allow-authenticate` | Enables the authenticate command without any pre-configured scope. |
| `biometric:deny-authenticate` | Denies the authenticate command without any pre-configured scope. |
| `biometric:allow-status` | Enables the status command without any pre-configured scope. |
| `biometric:deny-status` | Denies the status command without any pre-configured scope. |

## NFC | Tauri
[https://v2.tauri.app/plugin/nfc/](https://v2.tauri.app/plugin/nfc/)

# NFC

Read and write NFC tags on Android and iOS.

## Supported Platforms

This plugin requires a Rust version of at least **1.77.2**

| Platform | Level | Notes |
| --- | --- | --- |
| windows |  |  |
| linux |  |  |
| macos |  |  |
| android |  |  |
| ios |  |  |

## Setup

Install the NFC plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add nfc
```

```
yarn run tauri add nfc
```

```
pnpm tauri add nfc
```

```
bun tauri add nfc
```

```
cargo tauri add nfc
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-nfc --target 'cfg(any(target_os = "android", target_os = "ios"))'
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(mobile)]
            app.handle().plugin(tauri_plugin_nfc::init());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-nfc
```

```
yarn add @tauri-apps/plugin-nfc
```

```
pnpm add @tauri-apps/plugin-nfc
```

```
deno add npm:@tauri-apps/plugin-nfc
```

```
bun add @tauri-apps/plugin-nfc
```

## Configuration

The NFC plugin requires native configuration for iOS.

### iOS

To access the NFC APIs on iOS you must configure a usage description on the Info.plist file and add the NFC capability to your application.

#### Info.plist

On iOS the NFC plugin requires the `NFCReaderUsageDescription` information property list value, which should describe why your app needs to scan or write to NFC tags.

In the `src-tauri/Info.ios.plist` file, add the following snippet:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>NFCReaderUsageDescription</key>
    <string>Read and write various NFC tags</string>
  </dict>
</plist>
```

#### NFC Capability

Additionally, iOS requires the NFC capability to be associated with your application.

The capability can be added in Xcode in the project configuration’s “Signing & Capabilities” tab by clicking the ”+ Capability” button and selecting the “Near Field Communication Tag Reading” capability or by adding the following configuration to the `gen/apple/<app-name>_iOS/<app-name>_iOS.entitlements` file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.developer.nfc.readersession.formats</key>
  <array>
    <string>TAG</string>
  </array>
</dict>
</plist>
```

## Usage

The NFC plugin is available in both JavaScript and Rust, allowing you to scan and write to NFC tags.

### Checking if NFC is supported

Not every mobile device has the capability to scan NFC tags, so you should check for availability before using the scan and write APIs.

```javascript
import { isAvailable } from '@tauri-apps/plugin-nfc';
const canScanNfc = await isAvailable();
```

```rust
tauri::Builder::default()
  .setup(|app| {
    #[cfg(mobile)]
    {
      use tauri_plugin_nfc::NfcExt;
      app.handle().plugin(tauri_plugin_nfc::init());
      let can_scan_nfc = app.nfc().is_available()?;
    }
    Ok(())
  })
```

### Scanning NFC tags

The plugin can scan either generic NFC tags or NFC tags with a NDEF (NFC Data Exchange Format) message.

```javascript
import { scan } from '@tauri-apps/plugin-nfc';
const scanType = {
  type: 'ndef', // or 'tag',
};
const options = {
  keepSessionAlive: false,
  message: 'Scan a NFC tag',
  successMessage: 'NFC tag successfully scanned',
};
const tag = await scan(scanType, options);
```

```rust
tauri::Builder::default()
  .setup(|app| {
    #[cfg(mobile)]
    {
      use tauri_plugin_nfc::NfcExt;
      app.handle().plugin(tauri_plugin_nfc::init());
      let tag = app
        .nfc()
        .scan(tauri_plugin_nfc::ScanRequest {
            kind: tauri_plugin_nfc::ScanKind::Ndef {
                mime_type: None,
                uri: None,
                tech_list: None,
            },
            keep_session_alive: false,
        })?
        .tag;
    }
    Ok(())
  })
```

#### Filters

The NFC scanner can also filter tags with a specific URI format, mime type or NFC tag technologies.

```javascript
import { scan, TechKind } from '@tauri-apps/plugin-nfc';
const techLists = [
  [TechKind.NfcF],
  [TechKind.NfcA, TechKind.MifareClassic, TechKind.Ndef],
];
const tag = await scan({
  type: 'ndef', // or 'tag'
  mimeType: 'text/plain',
  uri: {
    scheme: 'https',
    host: 'my.domain.com',
    pathPrefix: '/app',
  },
  techLists,
});
```

```rust
tauri::Builder::default()
  .setup(|app| {
    #[cfg(mobile)]
    {
      use tauri_plugin_nfc::NfcExt;
      app.handle().plugin(tauri_plugin_nfc::init());
      let tag = app
        .nfc()
        .scan(tauri_plugin_nfc::ScanRequest {
            kind: tauri_plugin_nfc::ScanKind::Ndef {
                mime_type: Some("text/plain".to_string()),
                uri: Some(tauri_plugin_nfc::UriFilter {
                  scheme: Some("https".to_string()),
                  host: Some("my.domain.com".to_string()),
                  path_prefix: Some("/app".to_string()),
                }),
                tech_list: Some(vec![vec![tauri_plugin_nfc::TechKind::Ndef]]),
            },
        })?
        .tag;
    }
    Ok(())
  })
```

### Writing to NFC tags

The `write` API can be used to write a payload to an NFC tag.

```javascript
import { write, textRecord, uriRecord } from '@tauri-apps/plugin-nfc';
const payload = [uriRecord('https://tauri.app'), textRecord('some payload')];
const options = {
  kind: {
    type: 'ndef',
  },
  message: 'Scan a NFC tag',
  successfulReadMessage: 'NFC tag successfully scanned',
  successMessage: 'NFC tag successfully written',
};
await write(payload, options);
```

```rust
tauri::Builder::default()
  .setup(|app| {
    #[cfg(mobile)]
    {
      use tauri_plugin_nfc::NfcExt;
      app.handle().plugin(tauri_plugin_nfc::init());
      app
        .nfc()
        .write(vec![
          tauri_plugin_nfc::NfcRecord {
            format: tauri_plugin_nfc::NFCTypeNameFormat::NfcWellKnown,
            kind: vec![0x55], // URI record
            id: vec![],
            payload: vec![], // insert payload here
          }
        ])?;
    }
    Ok(())
  })
```

## Permissions

By default, all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```
{
  "permissions": [
    ...,
    "nfc:default",
  ]
}
```

## Default Permission

This permission set configures what kind of operations are available from the NFC plugin.

### Granted Permissions

Checking if the NFC functionality is available and scanning nearby tags is allowed. Writing to tags needs to be manually enabled.

- `allow-is-available`
- `allow-scan`

## Permission Table

| Identifier | Description |
| --- | --- |
| `nfc:allow-is-available` | Enables the is_available command without any pre-configured scope. |
| `nfc:deny-is-available` | Denies the is_available command without any pre-configured scope. |
| `nfc:allow-scan` | Enables the scan command without any pre-configured scope. |
| `nfc:deny-scan` | Denies the scan command without any pre-configured scope. |
| `nfc:allow-write` | Enables the write command without any pre-configured scope. |
| `nfc:deny-write` | Denies the write command without any pre-configured scope. |

