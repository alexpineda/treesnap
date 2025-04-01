# Networking

## HTTP Client | Tauri
[https://v2.tauri.app/plugin/http-client/](https://v2.tauri.app/plugin/http-client/)

# HTTP Client

Make HTTP requests with the http plugin.

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

Install the http plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add http
```

```
yarn run tauri add http
```

```
pnpm tauri add http
```

```
deno task tauri add http
```

```
bun tauri add http
```

```
cargo tauri add http
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-http
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. If you’d like to make http requests in JavaScript then install the npm package as well:

```
npm install @tauri-apps/plugin-http
```

```
yarn add @tauri-apps/plugin-http
```

```
pnpm add @tauri-apps/plugin-http
```

```
deno add npm:@tauri-apps/plugin-http
```

```
bun add @tauri-apps/plugin-http
```

## Usage

The HTTP plugin is available in both Rust and JavaScript.

### JavaScript

1. Configure the allowed URLs

```json
{
    "permissions": [
        {
            "identifier": "http:default",
            "allow": [{ "url": "https://*.tauri.app" }],
            "deny": [{ "url": "https://private.tauri.app" }]
        }
    ]
}
```

2. Send a request

The `fetch` method tries to be as close and compliant to the `fetch` Web API as possible.

```javascript
import { fetch } from '@tauri-apps/plugin-http';

// Send a GET request
const response = await fetch('http://test.tauri.app/data.json', {
    method: 'GET',
});

console.log(response.status); // e.g. 200
console.log(response.statusText); // e.g. "OK"
```

### Rust

In Rust you can utilize the `reqwest` crate re-exported by the plugin.

```rust
use tauri_plugin_http::reqwest;

let res = reqwest::get("http://my.api.host/data.json").await;

println!("{:?}", res.status()); // e.g. 200
println!("{:?}", res.text().await); // e.g Ok("{ Content }")
```

## Default Permission

This permission set configures what kind of fetch operations are available from the http plugin. This enables all fetch operations but does not allow explicitly any origins to be fetched. This needs to be manually configured before usage.

### Granted Permissions

All fetch operations are enabled.

- `allow-fetch`
- `allow-fetch-cancel`
- `allow-fetch-read-body`
- `allow-fetch-send`

## Permission Table

| Identifier | Description |
| --- | --- |
| `http:allow-fetch` | Enables the fetch command without any pre-configured scope. |
| `http:deny-fetch` | Denies the fetch command without any pre-configured scope. |
| `http:allow-fetch-cancel` | Enables the fetch_cancel command without any pre-configured scope. |
| `http:deny-fetch-cancel` | Denies the fetch_cancel command without any pre-configured scope. |
| `http:allow-fetch-read-body` | Enables the fetch_read_body command without any pre-configured scope. |
| `http:deny-fetch-read-body` | Denies the fetch_read_body command without any pre-configured scope. |
| `http:allow-fetch-send` | Enables the fetch_send command without any pre-configured scope. |
| `http:deny-fetch-send` | Denies the fetch_send command without any pre-configured scope. |

## Websocket | Tauri
[https://v2.tauri.app/plugin/websocket/](https://v2.tauri.app/plugin/websocket/)

# Websocket

Open a WebSocket connection using a Rust client in JavaScript.

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

Install the websocket plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add websocket
```

```
yarn run tauri add websocket
```

```
pnpm tauri add websocket
```

```
deno task tauri add websocket
```

```
bun tauri add websocket
```

```
cargo tauri add websocket
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-websocket
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_websocket::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-websocket
```

```
yarn add @tauri-apps/plugin-websocket
```

```
pnpm add @tauri-apps/plugin-websocket
```

```
deno add npm:@tauri-apps/plugin-websocket
```

```
bun add @tauri-apps/plugin-websocket
```

## Usage

The websocket plugin is available in JavaScript.

```javascript
import WebSocket from '@tauri-apps/plugin-websocket';

// when using `"withGlobalTauri": true`, you may use
// const WebSocket = window.__TAURI__.websocket;

const ws = await WebSocket.connect('ws://127.0.0.1:8080');

ws.addListener((msg) => {
    console.log('Received Message:', msg);
});

await ws.send('Hello World!');
await ws.disconnect();
```

## Permissions

By default, all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": ["websocket:default"]
}
```

## Default Permission

Allows connecting and sending data to a WebSocket server

- `allow-connect`
- `allow-send`

## Permission Table

| Identifier | Description |
| --- | --- |
| `websocket:allow-connect` | Enables the connect command without any pre-configured scope. |
| `websocket:deny-connect` | Denies the connect command without any pre-configured scope. |
| `websocket:allow-send` | Enables the send command without any pre-configured scope. |
| `websocket:deny-send` | Denies the send command without any pre-configured scope. |

## Upload | Tauri
[https://v2.tauri.app/plugin/upload/](https://v2.tauri.app/plugin/upload/)

# Upload

Upload files from disk to a remote server over HTTP. Download files from a remote HTTP server to disk.

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

Use your project’s package manager to add the dependency:

```
npm run tauri add upload
```

```
yarn run tauri add upload
```

```
pnpm tauri add upload
```

```
deno task tauri add upload
```

```
bun tauri add upload
```

```
cargo tauri add upload
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-upload
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_upload::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-upload
```

```
yarn add @tauri-apps/plugin-upload
```

```
pnpm add @tauri-apps/plugin-upload
```

```
deno add npm:@tauri-apps/plugin-upload
```

```
bun add @tauri-apps/plugin-upload
```

## Usage

Once you’ve completed the registration and setup process for the plugin, you can access all of its APIs through the JavaScript guest bindings.

Here’s an example of how you can use the plugin to upload and download files:

```javascript
import { upload } from '@tauri-apps/plugin-upload';

upload(
  'https://example.com/file-upload',
  './path/to/my/file.txt',
  ({ progress, total }) => console.log(`Uploaded ${progress} of ${total} bytes`),
  { 'Content-Type': 'text/plain' }
);
```

```javascript
import { download } from '@tauri-apps/plugin-upload';

download(
  'https://example.com/file-download-link',
  './path/to/save/my/file.txt',
  ({ progress, total }) => console.log(`Downloaded ${progress} of ${total} bytes`),
  { 'Content-Type': 'text/plain' }
);
```

## Permissions

By default, all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```json
{
  "permissions": [
    ...,
    "upload:default"
  ]
}
```

## Default Permission

This permission set configures what kind of operations are available from the upload plugin.

### Granted Permissions

All operations are enabled by default.

- `allow-upload`
- `allow-download`

## Permission Table

| Identifier | Description |
| --- | --- |
| `upload:allow-download` | Enables the download command without any pre-configured scope. |
| `upload:deny-download` | Denies the download command without any pre-configured scope. |
| `upload:allow-upload` | Enables the upload command without any pre-configured scope. |
| `upload:deny-upload` | Denies the upload command without any pre-configured scope. |

