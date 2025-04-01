# Development Concepts

## Develop | Tauri
[https://v2.tauri.app/develop/](https://v2.tauri.app/develop/)

# Develop

Now that you have everything set up, you are ready to run your application using Tauri.

If you are using a UI framework or JavaScript bundler, you likely have access to a development server that will speed up your development process. You can configure your app’s dev URL and script that starts it via the `devUrl` and `beforeDevCommand` config values:

```json
{
  "build": {
    "devUrl": "http://localhost:3000",
    "beforeDevCommand": "npm run dev"
  }
}
```

If you are not using a UI framework or module bundler, you can point Tauri to your frontend source code, and the Tauri CLI will start a development server for you:

```json
{
  "build": {
    "frontendDist": "./src"
  }
}
```

Note that in this example, the `src` folder must include an `index.html` file along with any other assets loaded by your frontend.

### Developing Your Desktop Application

To develop your application for desktop, run the `tauri dev` command.

```bash
npm run tauri dev
```

```bash
yarn tauri dev
```

```bash
pnpm tauri dev
```

```bash
deno task tauri dev
```

```bash
bun tauri dev
```

```bash
cargo tauri dev
```

The first time you run this command, the Rust package manager may need **several minutes** to download and build all the required packages. Since they are cached, subsequent builds are much faster, as only your code needs rebuilding.

Once Rust has finished building, the webview opens, displaying your web app. You can make changes to your web app, and if your tooling supports it, the webview should update automatically, just like a browser.

#### Opening the Web Inspector

You can open the Web Inspector to debug your application by performing a right-click on the webview and clicking “Inspect” or using the `Ctrl + Shift + I` shortcut on Windows and Linux or `Cmd + Option + I` shortcut on macOS.

### Developing your Mobile Application

Developing for mobile is similar to how desktop development works, but you must run `tauri android dev` or `tauri ios dev` instead:

```bash
npm run tauri [android|ios] dev
```

```bash
yarn tauri [android|ios] dev
```

```bash
pnpm tauri [android|ios] dev
```

```bash
deno task tauri [android|ios] dev
```

```bash
bun tauri [android|ios] dev
```

```bash
cargo tauri [android|ios] dev
```

The first time you run this command, the Rust package manager may need **several minutes** to download and build all the required packages. Since they are cached, subsequent builds are much faster, as only your code needs rebuilding.

#### Development Server

The development server on mobile works similarly to the desktop one, but if you are trying to run on a physical iOS device, you must configure it to listen to a particular address provided by the Tauri CLI, defined in the `TAURI_DEV_HOST` environment variable. This address is either a public network address (which is the default behavior) or the actual iOS device TUN address.

To use the iOS device’s address, you must open Xcode before running the dev command and ensure your device is connected via network in the Window > Devices and Simulators menu. Then you must run `tauri ios dev --force-ip-prompt` to select the iOS device address (an IPv6 address ending with **::2**).

To make your development server listen on the correct host to be accessible by the iOS device, you must tweak its configuration to use the `TAURI_DEV_HOST` value if it has been provided. Here is an example configuration for Vite:

```javascript
import { defineConfig } from 'vite';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  clearScreen: false,
  server: {
    host: host || false,
    port: 1420,
    strictPort: true,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
  },
});
```

Check your framework’s setup guide for more information.

#### Device Selection

By default, the mobile dev command tries to run your application on a connected device and falls back to prompting you to select a simulator to use. To define the run target upfront, you can provide the device or simulator name as an argument:

```bash
npm run tauri ios dev 'iPhone 15'
```

```bash
yarn tauri ios dev 'iPhone 15'
```

```bash
pnpm tauri ios dev 'iPhone 15'
```

```bash
deno task tauri ios dev 'iPhone 15'
```

```bash
bun tauri ios dev 'iPhone 15'
```

```bash
cargo tauri ios dev 'iPhone 15'
```

#### Using Xcode or Android Studio

Alternatively, you can choose to use Xcode or Android Studio to develop your application. This can help you troubleshoot some development issues by using the IDE instead of the command line tools. To open the mobile IDE instead of running on a connected device or simulator, use the `--open` flag:

```bash
npm run tauri [android|ios] dev --open
```

```bash
yarn tauri [android|ios] dev --open
```

```bash
pnpm tauri [android|ios] dev --open
```

```bash
deno task tauri [android|ios] dev --open
```

```bash
bun tauri [android|ios] dev --open
```

```bash
cargo tauri [android|ios] dev --open
```

#### Opening the Web Inspector

- **iOS**: Safari must be used to access the Web Inspector for your iOS application. Open Safari on your Mac machine, choose **Safari > Settings** in the menu bar, click **Advanced**, then select **Show features for web developers**. If you are running on a physical device, you must enable **Web Inspector** in **Settings > Safari > Advanced**.

- **Android**: The inspector is enabled by default for Android emulators, but you must enable it for physical devices. Connect your Android device to the computer, open the **Settings** app in the Android device, select **About**, scroll to Build Number and tap that 7 times. This will enable Developer Mode for your Android device and the **Developer Options** settings. To enable application debugging on your device, you must enter the **Developer Options** settings, toggle on the developer options switch, and enable **USB Debugging**. The Web Inspector for Android is powered by Google Chrome’s DevTools and can be accessed by navigating to `chrome://inspect` in the Chrome browser.

#### Troubleshooting

1. **Error running build script on Xcode**: Tauri hooks into the iOS Xcode project by creating a build phase that executes the Tauri CLI to compile the Rust source as a library that is loaded at runtime. The build phase is executed on the Xcode process context, so it might not be able to use shell modifications such as PATH additions.

2. **Network permission prompt on first iOS app execution**: On the first time you execute `tauri ios dev`, you might see iOS prompting you for permission to find and connect to devices on your local network. This permission is required because to access your development server from an iOS device, we must expose it in the local network.

### Reacting to Source Code Changes

Tauri watches your Rust files for changes, so when you modify any of them, your application is automatically rebuilt and restarted. You can disable this behavior by using the `--no-watch` flag on the `tauri dev` command. To restrict the files that are watched for changes, you can create a `.taurignore` file in the src-tauri folder.

```plaintext
build/
src/generated/*.rs
deny.toml
```

### Using the Browser DevTools

Tauri’s APIs only work in your app window, so once you start using them, you won’t be able to open your frontend in your system’s browser anymore. If you prefer using your browser’s developer tooling, you must configure `tauri-invoke-http` to bridge Tauri API calls through an HTTP server.

### Source Control

In your project repository, you **SHOULD** commit the `src-tauri/Cargo.lock` along with the `src-tauri/Cargo.toml` to git because Cargo uses the lockfile to provide deterministic builds. You **SHOULD NOT** commit the `src-tauri/target` folder or any of its contents.

## Updating Dependencies | Tauri
[https://v2.tauri.app/develop/updating-dependencies/](https://v2.tauri.app/develop/updating-dependencies/)

# Updating Dependencies

## Update npm Packages

If you are using the `tauri` package:

```
npm install @tauri-apps/cli@latest @tauri-apps/api@latest
```

```
yarn up @tauri-apps/cli @tauri-apps/api
```

```
pnpm update @tauri-apps/cli @tauri-apps/api --latest
```

You can also detect what the latest version of Tauri is on the command line, using:

```
npm outdated @tauri-apps/cli
```

```
yarn outdated @tauri-apps/cli
```

```
pnpm outdated @tauri-apps/cli
```

## Update Cargo Packages

You can check for outdated packages with `cargo outdated` or on the crates.io pages: tauri / tauri-build.

Go to `src-tauri/Cargo.toml` and change `tauri` and `tauri-build` to

```
[build-dependencies]

tauri-build = "%version%"

[dependencies]

tauri = { version = "%version%" }
```

where `%version%` is the corresponding version number from above.

Then do the following:

```
cd src-tauri

cargo update
```

Alternatively, you can run the `cargo upgrade` command provided by cargo-edit which does all of this automatically.

## Configuration Files | Tauri
[https://v2.tauri.app/develop/configuration-files/](https://v2.tauri.app/develop/configuration-files/)

# Configuration Files

Since Tauri is a toolkit for building applications, there can be many files to configure project settings. Some common files that you may run across are `tauri.conf.json`, `package.json`, and `Cargo.toml`. We briefly explain each on this page to help point you in the right direction for which files to modify.

## Tauri Config

The Tauri configuration is used to define the source of your web app, describe your application’s metadata, configure bundles, set plugin configurations, and modify runtime behavior by configuring windows, tray icons, menus, and more.

This file is used by the Tauri runtime and the Tauri CLI. You can define build settings, set the name and version of your app, control the Tauri runtime, and configure plugins.

### Supported Formats

The default Tauri config format is JSON. The JSON5 or TOML format can be enabled by adding the `config-json5` or `config-toml` feature flag (respectively) to the `tauri` and `tauri-build` dependencies in `Cargo.toml`.

```toml
[build-dependencies]
tauri-build = { version = "2.0.0", features = [ "config-json5" ] }

[dependencies]
tauri = { version = "2.0.0", features = [  "config-json5" ] }
```

The structure and values are the same across all formats; however, the formatting should be consistent with the respective file’s format:

**JSON Example:**
```json
{
  "build": {
    "devUrl": "http://localhost:3000",
    "beforeDevCommand": "npm run dev"
  },
  "bundle": {
    "active": true,
    "icon": ["icons/app.png"]
  },
  "app": {
    "windows": [
      {
        "title": "MyApp"
      }
    ]
  },
  "plugins": {
    "updater": {
      "pubkey": "updater pub key",
      "endpoints": ["https://my.app.updater/{{target}}/{{current_version}}"]
    }
  }
}
```

**TOML Example:**
```toml
[build]
dev-url = "http://localhost:3000"
before-dev-command = "npm run dev"

[bundle]
active = true
icon = ["icons/app.png"]

[[app.windows]]
title = "MyApp"

[plugins.updater]
pubkey = "updater pub key"
endpoints = ["https://my.app.updater/{{target}}/{{current_version}}"]
```

Note that JSON5 and TOML support comments, and TOML can use kebab-case for config names which are more idiomatic.

### Platform-specific Configuration

In addition to the default configuration file, Tauri can read a platform-specific configuration from:

- `tauri.linux.conf.json` or `Tauri.linux.toml` for Linux
- `tauri.windows.conf.json` or `Tauri.windows.toml` for Windows
- `tauri.macos.conf.json` or `Tauri.macos.toml` for macOS
- `tauri.android.conf.json` or `Tauri.android.toml` for Android
- `tauri.ios.conf.json` or `Tauri.ios.toml` for iOS

The platform-specific configuration file gets merged with the main configuration object following the JSON Merge Patch (RFC 7396) specification.

### Extending the Configuration

The Tauri CLI allows you to extend the Tauri configuration when running one of the `dev`, `android dev`, `ios dev`, `build`, `android build`, `ios build`, or `bundle` commands. The configuration extension can be provided by the `--config` argument either as a raw JSON string or as a path to a JSON file.

This mechanism can be used to define multiple flavors of your application or have more flexibility when configuring your application bundles.

For instance, to distribute a completely isolated _beta_ application, you can use this feature to configure a separate application name and identifier:

```json
{
  "productName": "My App Beta",
  "identifier": "com.myorg.myappbeta"
}
```

And to distribute this separate _beta_ app, you provide this configuration file when building it:

```bash
npm run tauri build -- --config src-tauri/tauri.beta.conf.json
```

## Cargo.toml

Cargo’s manifest file is used to declare Rust crates your app depends on, metadata about your app, and other Rust-related features. Below is an example of a barebones `Cargo.toml` file for a Tauri project:

```toml
[package]
name = "app"
version = "0.1.0"
description = "A Tauri App"
authors = ["you"]
license = ""
repository = ""
default-run = "app"
edition = "2021"
rust-version = "1.57"

[build-dependencies]
tauri-build = { version = "2.0.0" }

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
tauri = { version = "2.0.0", features = [] }
```

The most important parts to take note of are the `tauri-build` and `tauri` dependencies. Generally, they must both be on the latest minor versions as the Tauri CLI, but this is not strictly required. If you encounter issues while trying to run your app, you should check that any Tauri versions are on the latest versions for their respective minor releases.

If you want to use a specific crate version, you can use exact versions instead by prepending `=` to the version number of the dependency:

```toml
tauri-build = { version = "=2.0.0" }
```

An additional thing to take note of is the `features=[]` portion of the `tauri` dependency. Running `tauri dev` and `tauri build` will automatically manage which features need to be enabled in your project based on your Tauri configuration.

When you build your application, a `Cargo.lock` file is produced. This file is used primarily for ensuring that the same dependencies are used across machines during development. It is recommended to commit this file to your source repository so you get consistent builds.

## package.json

This is the package file used by Node.js. If the frontend of your Tauri app is developed using Node.js-based technologies, this file is used to configure the frontend dependencies and scripts.

An example of a barebones `package.json` file for a Tauri project might look like this:

```json
{
  "scripts": {
    "dev": "command to start your app development mode",
    "build": "command to build your app frontend",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0.0",
    "@tauri-apps/cli": "^2.0.0.0"
  }
}
```

It’s common to use the `"scripts"` section to store the commands used to launch and build the frontend used by your Tauri application. The above `package.json` file specifies the `dev` command that you can run using `yarn dev` or `npm run dev` to start the frontend framework and the `build` command that you can run using `yarn build` or `npm run build` to build your frontend’s web assets to be added by Tauri in production.

The dependencies object specifies which dependencies Node.js should download when you run either `yarn`, `pnpm install`, or `npm install`.

In addition to the `package.json` file, you may see either a `yarn.lock`, `pnpm-lock.yaml`, or `package-lock.json` file. These files assist in ensuring that when you download the dependencies later, you’ll get the exact same versions that you have used during development.

## Calling Rust from the Frontend | Tauri
[https://v2.tauri.app/develop/calling-rust/](https://v2.tauri.app/develop/calling-rust/)

# Calling Rust from the Frontend

This document includes guides on how to communicate with your Rust code from your application frontend.

Tauri provides a command primitive for reaching Rust functions with type safety, along with an event system that is more dynamic.

## Commands

Tauri provides a simple yet powerful `command` system for calling Rust functions from your web app. Commands can accept arguments and return values. They can also return errors and be `async`.

### Basic Example

Commands can be defined in your `src-tauri/src/lib.rs` file. To create a command, just add a function and annotate it with `#[tauri::command]`:

```rust
#[tauri::command]
fn my_custom_command() {
  println!("I was invoked from JavaScript!");
}
```

You will have to provide a list of your commands to the builder function like so:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![my_custom_command])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

Now, you can invoke the command from your JavaScript code:

```javascript
import { invoke } from '@tauri-apps/api/core';

invoke('my_custom_command');
```

#### Defining Commands in a Separate Module

If your application defines a lot of components or if they can be grouped, you can define commands in a separate module instead of bloating the `lib.rs` file.

As an example, let’s define a command in the `src-tauri/src/commands.rs` file:

```rust
#[tauri::command]
pub fn my_custom_command() {
  println!("I was invoked from JavaScript!");
}
```

In the `lib.rs` file, define the module and provide the list of your commands accordingly:

```rust
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![commands::my_custom_command])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

Note the `commands::` prefix in the command list, which denotes the full path to the command function.

The command name in this example is `my_custom_command`, so you can still call it by executing `invoke("my_custom_command")` in your frontend; the `commands::` prefix is ignored.

#### WASM

When using a Rust frontend to call `invoke()` without arguments, you will need to adapt your frontend code as below. The reason is that Rust doesn’t support optional arguments.

```rust
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "core"], js_name = invoke)]
    async fn invoke_without_args(cmd: &str) -> JsValue;

    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "core"])]
    async fn invoke(cmd: &str, args: JsValue) -> JsValue;
}
```

### Passing Arguments

Your command handlers can take arguments:

```rust
#[tauri::command]
fn my_custom_command(invoke_message: String) {
  println!("I was invoked from JavaScript, with this message: {}", invoke_message);
}
```

Arguments should be passed as a JSON object with camelCase keys:

```javascript
invoke('my_custom_command', { invokeMessage: 'Hello!' });
```

Arguments can be of any type, as long as they implement `serde::Deserialize`.

The corresponding JavaScript:

```javascript
invoke('my_custom_command', { invoke_message: 'Hello!' });
```

### Returning Data

Command handlers can return data as well:

```rust
#[tauri::command]
fn my_custom_command() -> String {
  "Hello from Rust!".into()
}
```

The `invoke` function returns a promise that resolves with the returned value:

```javascript
invoke('my_custom_command').then((message) => console.log(message));
```

Returned data can be of any type, as long as it implements `serde::Serialize`.

#### Returning Array Buffers

Return values that implement `serde::Serialize` are serialized to JSON when the response is sent to the frontend. This can slow down your application if you try to return large data such as a file or a download HTTP response. To return array buffers in an optimized way, use `tauri::ipc::Response`:

```rust
use tauri::ipc::Response;

#[tauri::command]
fn read_file() -> Response {
  let data = std::fs::read("/path/to/file").unwrap();
  tauri::ipc::Response::new(data)
}
```

### Error Handling

If your handler could fail and needs to be able to return an error, have the function return a `Result`:

```rust
#[tauri::command]
fn login(user: String, password: String) -> Result<String, String> {
  if user == "tauri" && password == "tauri" {
    Ok("logged_in".to_string())
  } else {
    Err("invalid credentials".to_string())
  }
}
```

If the command returns an error, the promise will reject; otherwise, it resolves:

```javascript
invoke('login', { user: 'tauri', password: '0j4rijw8=' })
  .then((message) => console.log(message))
  .catch((error) => console.error(error));
```

As mentioned above, everything returned from commands must implement `serde::Serialize`, including errors. This can be problematic if you’re working with error types from Rust’s std library or external crates as most error types do not implement it. In simple scenarios, you can use `map_err` to convert these errors to `String`s:

```rust
#[tauri::command]
fn my_custom_command() -> Result<(), String> {
  std::fs::File::open("path/to/file").map_err(|err| err.to_string())?;
  Ok(())
}
```

Since this is not very idiomatic, you may want to create your own error type which implements `serde::Serialize`. In the following example, we use the `thiserror` crate to help create the error type.

```rust
#[derive(Debug, thiserror::Error)]
enum Error {
  #[error(transparent)]
  Io(#[from] std::io::Error)
}

impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::ser::Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

#[tauri::command]
fn my_custom_command() -> Result<(), Error> {
  std::fs::File::open("path/that/does/not/exist")?;
  Ok(())
}
```

A custom error type has the advantage of making all possible errors explicit so readers can quickly identify what errors can happen.

### Async Commands

Asynchronous commands are preferred in Tauri to perform heavy work in a manner that doesn’t result in UI freezes or slowdowns.

If your command needs to run asynchronously, simply declare it as `async`.

When working with borrowed types, you have to make additional changes. These are your two main options:

**Option 1**: Convert the type, such as `&str` to a similar type that is not borrowed, such as `String`.

```rust
#[tauri::command]
async fn my_custom_command(value: String) -> String {
  some_async_function().await;
  value
}
```

**Option 2**: Wrap the return type in a `Result`. Use the return type `Result<a, b>`, replacing `a` with the type you wish to return, or `()` if you wish to return `null`, and replacing `b` with an error type to return if something goes wrong, or `()` if you wish to have no optional error returned.

```rust
#[tauri::command]
async fn my_custom_command(value: &str) -> Result<String, ()> {
  some_async_function().await;
  Ok(format!(value))
}
```

##### Invoking from JavaScript

Since invoking the command from JavaScript already returns a promise, it works just like any other command:

```javascript
invoke('my_custom_command', { value: 'Hello, Async!' }).then(() =>
  console.log('Completed!')
);
```

### Channels

The Tauri channel is the recommended mechanism for streaming data such as streamed HTTP responses to the frontend. The following example reads a file and notifies the frontend of the progress in chunks of 4096 bytes:

```rust
use tokio::io::AsyncReadExt;

#[tauri::command]
async fn load_image(path: std::path::PathBuf, reader: tauri::ipc::Channel<&[u8]>) {
  let mut file = tokio::fs::File::open(path).await.unwrap();
  let mut chunk = vec![0; 4096];

  loop {
    let len = file.read(&mut chunk).await.unwrap();
    if len == 0 {
      break;
    }
    reader.send(&chunk).unwrap();
  }
}
```

### Accessing the WebviewWindow in Commands

Commands can access the `WebviewWindow` instance that invoked the message:

```rust
#[tauri::command]
async fn my_custom_command(webview_window: tauri::WebviewWindow) {
  println!("WebviewWindow: {}", webview_window.label());
}
```

### Accessing an AppHandle in Commands

Commands can access an `AppHandle` instance:

```rust
#[tauri::command]
async fn my_custom_command(app_handle: tauri::AppHandle) {
  let app_dir = app_handle.path_resolver().app_dir();
  use tauri::GlobalShortcutManager;
  app_handle.global_shortcut_manager().register("CTRL + U", move || {});
}
```

### Accessing Managed State

Tauri can manage state using the `manage` function on `tauri::Builder`. The state can be accessed on a command using `tauri::State`:

```rust
struct MyState(String);

#[tauri::command]
fn my_custom_command(state: tauri::State<MyState>) {
  assert_eq!(state.0 == "some state value", true);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(MyState("some state value".into()))
    .invoke_handler(tauri::generate_handler![my_custom_command])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

### Accessing Raw Request

Tauri commands can also access the full `tauri::ipc::Request` object which includes the raw body payload and the request headers.

```rust
#[derive(Debug, thiserror::Error)]
enum Error {
  #[error("unexpected request body")]
  RequestBodyMustBeRaw,
  #[error("missing `{0}` header")]
  MissingHeader(&'static str),
}

impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::ser::Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

#[tauri::command]
fn upload(request: tauri::ipc::Request) -> Result<(), Error> {
  let tauri::ipc::InvokeBody::Raw(upload_data) = request.body() else {
    return Err(Error::RequestBodyMustBeRaw);
  };

  let Some(authorization_header) = request.headers().get("Authorization") else {
    return Err(Error::MissingHeader("Authorization"));
  };

  Ok(())
}
```

In the frontend, you can call `invoke()` sending a raw request body by providing an ArrayBuffer or Uint8Array on the payload argument, and include request headers in the third argument:

```javascript
const data = new Uint8Array([1, 2, 3]);

await __TAURI__.core.invoke('upload', data, {
  headers: {
    Authorization: 'apikey',
  },
});
```

### Creating Multiple Commands

The `tauri::generate_handler!` macro takes an array of commands. To register multiple commands, you cannot call `invoke_handler` multiple times. Only the last call will be used. You must pass each command to a single call of `tauri::generate_handler!`.

```rust
#[tauri::command]
fn cmd_a() -> String {
  "Command a"
}

#[tauri::command]
fn cmd_b() -> String {
  "Command b"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![cmd_a, cmd_b])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

### Complete Example

Any or all of the above features can be combined:

```rust
struct Database;

#[derive(serde::Serialize)]
struct CustomResponse {
  message: String,
  other_val: usize,
}

async fn some_other_function() -> Option<String> {
  Some("response".into())
}

#[tauri::command]
async fn my_custom_command(
  window: tauri::Window,
  number: usize,
  database: tauri::State<'_, Database>,
) -> Result<CustomResponse, String> {
  println!("Called from {}", window.label());
  let result: Option<String> = some_other_function().await;

  if let Some(message) = result {
    Ok(CustomResponse {
      message,
      other_val: 42 + number,
    })
  } else {
    Err("No result".into())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(Database {})
    .invoke_handler(tauri::generate_handler![my_custom_command])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

```javascript
import { invoke } from '@tauri-apps/api/core';

invoke('my_custom_command', {
  number: 42,
})
  .then((res) =>
    console.log(`Message: ${res.message}, Other Val: ${res.other_val}`)
  )
  .catch((e) => console.error(e));
```

## Event System

The event system is a simpler communication mechanism between your frontend and Rust. Unlike commands, events are not type safe, are always async, cannot return values, and only support JSON payloads.

### Global Events

To trigger a global event you can use the `event.emit` or the `WebviewWindow#emit` functions:

```javascript
import { emit } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

emit('file-selected', '/path/to/file');

const appWebview = getCurrentWebviewWindow();
appWebview.emit('route-changed', { url: window.location.href });
```

### Webview Event

To trigger an event to a listener registered by a specific webview you can use the `event.emitTo` or the `WebviewWindow#emitTo` functions:

```javascript
import { emitTo } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

emitTo('settings', 'settings-update-requested', {
  key: 'notification',
  value: 'all',
});

const appWebview = getCurrentWebviewWindow();
appWebview.emitTo('editor', 'file-changed', {
  path: '/path/to/file',
  contents: 'file contents',
});
```

### Listening to Events

The `@tauri-apps/api` NPM package offers APIs to listen to both global and webview-specific events.

- Listening to global events

```javascript
import { listen } from '@tauri-apps/api/event';

type DownloadStarted = {
    url: string;
    downloadId: number;
    contentLength: number;
};

listen<DownloadStarted>('download-started', (event) => {
    console.log(
      `downloading ${event.payload.contentLength} bytes from ${event.payload.url}`
    );
});
```

- Listening to webview-specific events

```javascript
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

const appWebview = getCurrentWebviewWindow();
appWebview.listen<string>('logged-in', (event) => {
    localStorage.setItem('session-token', event.payload);
});
```

The `listen` function keeps the event listener registered for the entire lifetime of the application. To stop listening on an event you can use the `unlisten` function which is returned by the `listen` function:

```javascript
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('download-started', (event) => {});
unlisten();
```

Additionally, Tauri provides a utility function for listening to an event exactly once:

```javascript
import { once } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

once('ready', (event) => {});

const appWebview = getCurrentWebviewWindow();
appWebview.once('ready', () => {});
```

#### Listening to Events on Rust

Global and webview-specific events are also delivered to listeners registered in Rust.

- Listening to global events

```rust
use tauri::Listener;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
      .setup(|app| {
        app.listen("download-started", |event| {
          if let Ok(payload) = serde_json::from_str::<DownloadStarted>(&event.payload()) {
            println!("downloading {}", payload.url);
          }
        });
        Ok(())
      })
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
}
```

- Listening to webview-specific events

```rust
use tauri::{Listener, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
      .setup(|app| {
        let webview = app.get_webview_window("main").unwrap();
        webview.listen("logged-in", |event| {
          let session_token = event.data;
          // save token..
        });
        Ok(())
      })
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
}
```

The `listen` function keeps the event listener registered for the entire lifetime of the application. To stop listening on an event you can use the `unlisten` function:

```rust
let event_id = app.listen("download-started", |event| {});
app.unlisten(event_id);

let handle = app.handle().clone();
app.listen("status-changed", |event| {
  if event.data == "ready" {
    handle.unlisten(event.id);
  }
});
```

Additionally, Tauri provides a utility function for listening to an event exactly once:

```rust
app.once("ready", |event| {
  println!("app is ready");
});
```

## Calling the Frontend from Rust | Tauri
[https://v2.tauri.app/develop/calling-frontend/](https://v2.tauri.app/develop/calling-frontend/)

```markdown
# Calling the Frontend from Rust

This document includes guides on how to communicate with your application frontend from your Rust code.

The Rust side of your Tauri application can call the frontend by leveraging the Tauri event system, using channels or directly evaluating JavaScript code.

## Event System

Tauri ships a simple event system you can use to have bi-directional communication between Rust and your frontend.

The event system was designed for situations where small amounts of data need to be streamed or you need to implement a multi consumer multi producer pattern (e.g. push notification system).

The event system is not designed for low latency or high throughput situations. The major differences between a Tauri command and a Tauri event are that events have no strong type support, event payloads are always JSON strings making them not suitable for bigger messages and there is no support for fine grain control of event data and channels.

Events are either global (delivered to all listeners) or webview-specific (only delivered to the webview matching a given label).

### Global Events

To trigger a global event you can use the `Emitter#emit` function:

```rust
use tauri::{AppHandle, Emitter};

#[tauri::command]
fn download(app: AppHandle, url: String) {
  app.emit("download-started", &url).unwrap();
  for progress in [1, 15, 50, 80, 100] {
    app.emit("download-progress", progress).unwrap();
  }
  app.emit("download-finished", &url).unwrap();
}
```

### Webview Event

To trigger an event to a listener registered by a specific webview you can use the `Emitter#emit_to` function:

```rust
use tauri::{AppHandle, Emitter};

#[tauri::command]
fn login(app: AppHandle, user: String, password: String) {
  let authenticated = user == "tauri-apps" && password == "tauri";
  let result = if authenticated { "loggedIn" } else { "invalidCredentials" };
  app.emit_to("login", "login-result", result).unwrap();
}
```

It is also possible to trigger an event to a list of webviews by calling `Emitter#emit_filter`. In the following example we emit an open-file event to the main and file-viewer webviews:

```rust
use tauri::{AppHandle, Emitter, EventTarget};

#[tauri::command]
fn open_file(app: AppHandle, path: std::path::PathBuf) {
  app.emit_filter("open-file", path, |target| match target {
    EventTarget::WebviewWindow { label } => label == "main" || label == "file-viewer",
    _ => false,
  }).unwrap();
}
```

### Event Payload

The event payload can be any serializable type that also implements `Clone`. Let’s enhance the download event example by using an object to emit more information in each event:

```rust
use tauri::{AppHandle, Emitter};
use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadStarted<'a> {
  url: &'a str,
  download_id: usize,
  content_length: usize,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadProgress {
  download_id: usize,
  chunk_length: usize,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadFinished {
  download_id: usize,
}

#[tauri::command]
fn download(app: AppHandle, url: String) {
  let content_length = 1000;
  let download_id = 1;
  app.emit("download-started", DownloadStarted {
    url: &url,
    download_id,
    content_length
  }).unwrap();
  for chunk_length in [15, 150, 35, 500, 300] {
    app.emit("download-progress", DownloadProgress {
      download_id,
      chunk_length,
    }).unwrap();
  }
  app.emit("download-finished", DownloadFinished { download_id }).unwrap();
}
```

### Listening to Events

Tauri provides APIs to listen to events on both the webview and the Rust interfaces.

#### Listening to Events on the Frontend

The `@tauri-apps/api` NPM package offers APIs to listen to both global and webview-specific events.

- Listening to global events

```javascript
import { listen } from '@tauri-apps/api/event';

type DownloadStarted = {
    url: string;
    downloadId: number;
    contentLength: number;
};

listen<DownloadStarted>('download-started', (event) => {
    console.log(`downloading ${event.payload.contentLength} bytes from ${event.payload.url}`);
});
```

- Listening to webview-specific events

```javascript
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

const appWebview = getCurrentWebviewWindow();
appWebview.listen<string>('logged-in', (event) => {
    localStorage.setItem('session-token', event.payload);
});
```

The `listen` function keeps the event listener registered for the entire lifetime of the application. To stop listening on an event you can use the `unlisten` function which is returned by the `listen` function:

```javascript
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('download-started', (event) => {});
unlisten();
```

Additionally, Tauri provides a utility function for listening to an event exactly once:

```javascript
import { once } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

once('ready', (event) => {});
const appWebview = getCurrentWebviewWindow();
appWebview.once('ready', () => {});
```

#### Listening to Events on Rust

Global and webview-specific events are also delivered to listeners registered in Rust.

- Listening to global events

```rust
use tauri::Listener;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
      .setup(|app| {
        app.listen("download-started", |event| {
          if let Ok(payload) = serde_json::from_str::<DownloadStarted>(&event.payload()) {
            println!("downloading {}", payload.url);
          }
        });
        Ok(())
      })
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
}
```

- Listening to webview-specific events

```rust
use tauri::{Listener, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
      .setup(|app| {
        let webview = app.get_webview_window("main").unwrap();
        webview.listen("logged-in", |event| {
          let session_token = event.data;
          // save token..
        });
        Ok(())
      })
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
}
```

The `listen` function keeps the event listener registered for the entire lifetime of the application. To stop listening on an event you can use the `unlisten` function:

```rust
// unlisten outside of the event handler scope:
let event_id = app.listen("download-started", |event| {});
app.unlisten(event_id);

// unlisten when some event criteria is matched
let handle = app.handle().clone();
app.listen("status-changed", |event| {
  if event.data == "ready" {
    handle.unlisten(event.id);
  }
});
```

Additionally, Tauri provides a utility function for listening to an event exactly once:

```rust
app.once("ready", |event| {
  println!("app is ready");
});
```

## Channels

The event system is designed to be a simple two-way communication that is globally available in your application. Under the hood, it directly evaluates JavaScript code so it might not be suitable for sending a large amount of data.

Channels are designed to be fast and deliver ordered data. They are used internally for streaming operations such as download progress, child process output, and WebSocket messages.

Let’s rewrite our download command example to use channels instead of the event system:

```rust
use tauri::{AppHandle, ipc::Channel};
use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
enum DownloadEvent<'a> {
  #[serde(rename_all = "camelCase")]
  Started {
    url: &'a str,
    download_id: usize,
    content_length: usize,
  },
  #[serde(rename_all = "camelCase")]
  Progress {
    download_id: usize,
    chunk_length: usize,
  },
  #[serde(rename_all = "camelCase")]
  Finished {
    download_id: usize,
  },
}

#[tauri::command]
fn download(app: AppHandle, url: String, on_event: Channel<DownloadEvent>) {
  let content_length = 1000;
  let download_id = 1;
  on_event.send(DownloadEvent::Started {
    url: &url,
    download_id,
    content_length,
  }).unwrap();
  for chunk_length in [15, 150, 35, 500, 300] {
    on_event.send(DownloadEvent::Progress {
      download_id,
      chunk_length,
    }).unwrap();
  }
  on_event.send(DownloadEvent::Finished { download_id }).unwrap();
}
```

When calling the download command you must create the channel and provide it as an argument:

```javascript
import { invoke, Channel } from '@tauri-apps/api/core';

type DownloadEvent =
  | {
      event: 'started';
      data: {
        url: string;
        downloadId: number;
        contentLength: number;
      };
    }
  | {
      event: 'progress';
      data: {
        downloadId: number;
        chunkLength: number;
      };
    }
  | {
      event: 'finished';
      data: {
        downloadId: number;
      };
    };

const onEvent = new Channel<DownloadEvent>();
onEvent.onmessage = (message) => {
  console.log(`got download event ${message.event}`);
};

await invoke('download', {
  url: 'https://raw.githubusercontent.com/tauri-apps/tauri/dev/crates/tauri-schema-generator/schemas/config.schema.json',
  onEvent,
});
```

## Evaluating JavaScript

To directly execute any JavaScript code on the webview context you can use the `WebviewWindow#eval` function:

```rust
use tauri::Manager;

tauri::Builder::default()
  .setup(|app| {
    let webview = app.get_webview_window("main").unwrap();
    webview.eval("console.log('hello from Rust')")?;
    Ok(())
  })
```

If the script to be evaluated is not so simple and must use input from Rust objects we recommend using the `serialize-to-javascript` crate.
```

## Embedding Additional Files | Tauri
[https://v2.tauri.app/develop/resources/](https://v2.tauri.app/develop/resources/)

# Embedding Additional Files

You may need to include additional files in your application bundle that aren’t part of your frontend directly or which are too big to be inlined into the binary. We call these files `resources`.

To bundle the files of your choice, you can add the `resources` property to the `bundle` object in your `tauri.conf.json` file.

`resources` expects a list of strings targeting files or directories either with absolute or relative paths. It supports glob patterns in case you need to include multiple files from a directory.

Here is a sample to illustrate the configuration:

```json
{
  "bundle": {
    "resources": [
      "/absolute/path/to/textfile.txt",
      "relative/path/to/jsonfile.json",
      "resources/**/*"
    ]
  }
}
```

Alternatively, the `resources` config also accepts a map object if you want to change where the files will be copied to. Here is a sample that shows how to include files from different sources into the same `resources` folder:

```json
{
  "bundle": {
    "resources": {
      "/absolute/path/to/textfile.txt": "resources/textfile.txt",
      "relative/path/to/jsonfile.json": "resources/jsonfile.json",
      "resources/**/*": "resources/"
    }
  }
}
```

## Source Path Syntax

In the following explanations, “target resource directory” is either the value after the colon in the object notation, or a reconstruction of the original file paths in the array notation.

- `"dir/file.txt"`: copies the `file.txt` file into the target resource directory.
- `"dir/"`: copies all files **and directories** _recursively_ into the target resource directory. Use this if you also want to preserve the file system structure of your files and directories.
- `"dir/*"`: copies all files in the `dir` directory _non-recursively_ (sub-directories will be ignored) into the target resource directory.
- `"dir/**/*"`: copies all files in the `dir` directory _recursively_ (all files in `dir/` and all files in all sub-directories) into the target resource directory.

## Accessing Files in Rust

In this example, we want to bundle additional i18n JSON files that look like this:

```json
{
  "hello": "Guten Tag!",
  "bye": "Auf Wiedersehen!"
}
```

In this case, we store these files in a `lang` directory next to the `tauri.conf.json`. For this, we add `"lang/*"` to `resources` as shown above.

On the Rust side, you need an instance of the `PathResolver` which you can get from `App` and `AppHandle`:

```rust
tauri::Builder::default()
  .setup(|app| {
    let resource_path = app.path().resolve("lang/de.json", BaseDirectory::Resource)?;
    let file = std::fs::File::open(&resource_path).unwrap();
    let lang_de: serde_json::Value = serde_json::from_reader(file).unwrap();
    println!("{}", lang_de.get("hello").unwrap());
    Ok(())
  })
```

```rust
#[tauri::command]
fn hello(handle: tauri::AppHandle) -> String {
    let resource_path = handle.path().resolve("lang/de.json", BaseDirectory::Resource)?;
    let file = std::fs::File::open(&resource_path).unwrap();
    let lang_de: serde_json::Value = serde_json::from_reader(file).unwrap();
    lang_de.get("hello").unwrap()
}
```

## Accessing Files in JavaScript

This is based on the example above. Note that you must configure the access control list to enable any `plugin-fs` APIs you will need as well as permissions to access the `$RESOURCE` folder:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "path:default",
    "event:default",
    "window:default",
    "app:default",
    "resources:default",
    "menu:default",
    "tray:default",
    "fs:allow-read-text-file",
    "fs:allow-resource-read-recursive"
  ]
}
```

```javascript
import { resolveResource } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';

const resourcePath = await resolveResource('lang/de.json');
const langDe = JSON.parse(await readTextFile(resourcePath));
console.log(langDe.hello); // This will print 'Guten Tag!' to the devtools console
```

## State Management | Tauri
[https://v2.tauri.app/develop/state-management/](https://v2.tauri.app/develop/state-management/)

# State Management

In a Tauri application, you often need to keep track of the current state of your application or manage the lifecycle of things associated with it. Tauri provides an easy way to manage the state of your application using the `Manager` API, and read it when commands are called.

Here is a simple example:

```rust
use tauri::{Builder, Manager};

struct AppData {
  welcome_message: &'static str,
}

fn main() {
  Builder::default()
    .setup(|app| {
      app.manage(AppData {
        welcome_message: "Welcome to Tauri!",
      });
      Ok(())
    })
    .run(tauri::generate_context!())
    .unwrap();
}
```

You can later access your state with any type that implements the `Manager` trait, for example the `App` instance:

```rust
let data = app.state::<AppData>();
```

## Mutability

In Rust, you cannot directly mutate values which are shared between multiple threads or when ownership is controlled through a shared pointer such as `Arc` (or Tauri’s `State`). Doing so could cause data races (for example, two writes happening simultaneously).

To work around this, you can use a concept known as interior mutability. For example, the standard library’s `Mutex` can be used to wrap your state. This allows you to lock the value when you need to modify it, and unlock it when you are done.

```rust
use std::sync::Mutex;
use tauri::{Builder, Manager};

#[derive(Default)]
struct AppState {
  counter: u32,
}

fn main() {
  Builder::default()
    .setup(|app| {
      app.manage(Mutex::new(AppState::default()));
      Ok(())
    })
    .run(tauri::generate_context!())
    .unwrap();
}
```

The state can now be modified by locking the mutex:

```rust
let state = app.state::<Mutex<AppState>>();

// Lock the mutex to get mutable access:
let mut state = state.lock().unwrap();

// Modify the state:
state.counter += 1;
```

At the end of the scope, or when the `MutexGuard` is otherwise dropped, the mutex is unlocked automatically so that other parts of your application can access and mutate the data within.

### When to use an async mutex

It’s often fine to use the standard library’s `Mutex` instead of an async mutex such as the one Tokio provides. The primary use case for the async mutex is to provide shared mutable access to IO resources such as a database connection.

### Do you need `Arc`?

It’s common to see `Arc` used in Rust to share ownership of a value across multiple threads (usually paired with a `Mutex` in the form of `Arc<Mutex<T>>`). However, you don’t need to use `Arc` for things stored in `State` because Tauri will do this for you.

In case `State`’s lifetime requirements prevent you from moving your state into a new thread you can instead move an `AppHandle` into the thread and then retrieve your state.

## Accessing State

### Access state in commands

```rust
#[tauri::command]
fn increase_counter(state: State<'_, Mutex<AppState>>) -> u32 {
  let mut state = state.lock().unwrap();
  state.counter += 1;
  state.counter
}
```

#### Async commands

If you are using `async` commands and want to use Tokio’s async `Mutex`, you can set it up the same way and access the state like this:

```rust
#[tauri::command]
async fn increase_counter(state: State<'_, Mutex<AppState>>) -> Result<u32, ()> {
  let mut state = state.lock().await;
  state.counter += 1;
  Ok(state.counter)
}
```

Note that the return type must be `Result` if you use asynchronous commands.

### Access state with the `Manager` trait

Sometimes you may need to access the state outside of commands, such as in a different thread or in an event handler like `on_window_event`. In such cases, you can use the `state()` method of types that implement the `Manager` trait (such as the `AppHandle`) to get the state:

```rust
use std::sync::Mutex;
use tauri::{Builder, Window, WindowEvent, Manager};

#[derive(Default)]
struct AppState {
  counter: u32,
}

// In an event handler:
fn on_window_event(window: &Window, _event: &WindowEvent) {
    let app_handle = window.app_handle();
    let state = app_handle.state::<Mutex<AppState>>();
    let mut state = state.lock().unwrap();
    state.counter += 1;
}

fn main() {
  Builder::default()
    .setup(|app| {
      app.manage(Mutex::new(AppState::default()));
      Ok(())
    })
    .on_window_event(on_window_event)
    .run(tauri::generate_context!())
    .unwrap();
}
```

This method is useful when you cannot rely on command injection. For example, if you need to move the state into a thread where using an `AppHandle` is easier, or if you are not in a command context.

## Mismatching Types

If you prefer, you can wrap your state with a type alias to prevent this mistake:

```rust
use std::sync::Mutex;

#[derive(Default)]
struct AppStateInner {
  counter: u32,
}

type AppState = Mutex<AppStateInner>;
```

However, make sure to use the type alias as it is, and not wrap it in a `Mutex` a second time, otherwise you will run into the same issue.

## Embedding External Binaries | Tauri
[https://v2.tauri.app/develop/sidecar/](https://v2.tauri.app/develop/sidecar/)

# Embedding External Binaries

You may need to embed external binaries to add additional functionality to your application or prevent users from installing additional dependencies (e.g., Node.js or Python). We call this binary a `sidecar`.

Binaries are executables written in any programming language. Common use cases are Python CLI applications or API servers bundled using `pyinstaller`.

To bundle the binaries of your choice, you can add the `externalBin` property to the `tauri > bundle` object in your `tauri.conf.json`. The `externalBin` configuration expects a list of strings targeting binaries either with absolute or relative paths.

Here is a Tauri configuration snippet to illustrate a sidecar configuration:

```
{
  "bundle": {
    "externalBin": [
      "/absolute/path/to/sidecar",
      "../relative/path/to/binary",
      "binaries/my-sidecar"
    ]
  }
}
```

To make the external binary work on each supported architecture, a binary with the same name and a `-$TARGET_TRIPLE` suffix must exist on the specified path. For instance, `"externalBin": ["binaries/my-sidecar"]` requires a `src-tauri/binaries/my-sidecar-x86_64-unknown-linux-gnu` executable on Linux or `src-tauri/binaries/my-sidecar-aarch64-apple-darwin` on Mac OS with Apple Silicon.

You can find your **current** platform’s `-$TARGET_TRIPLE` suffix by looking at the `host:` property reported by the following command:

```
rustc -Vv
```

If the `grep` and `cut` commands are available, as they should on most Unix systems, you can extract the target triple directly with the following command:

```
rustc -Vv | grep host | cut -f2 -d' '
```

On Windows you can use PowerShell instead:

```
rustc -Vv | Select-String "host:" | ForEach-Object {$_.Line.split(" ")[1]}
```

Here’s a Node.js script to append the target triple to a binary:

```
import { execSync } from 'child_process';
import fs from 'fs';

const extension = process.platform === 'win32' ? '.exe' : '';
const rustInfo = execSync('rustc -vV');
const targetTriple = /host: (\S+)/g.exec(rustInfo)[1];

if (!targetTriple) {
  console.error('Failed to determine platform target triple');
}

fs.renameSync(
  `src-tauri/binaries/sidecar${extension}`,
  `src-tauri/binaries/sidecar-${targetTriple}${extension}`
);
```

Note that this script will not work if you compile for a different architecture than the one its running on, so only use it as a starting point for your own build scripts.

## Running it from Rust

On the Rust side, import the `tauri_plugin_shell::ShellExt` trait and call the `shell().sidecar()` function on the AppHandle:

```
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

let sidecar_command = app.shell().sidecar("my-sidecar").unwrap();
let (mut rx, mut _child) = sidecar_command
  .spawn()
  .expect("Failed to spawn sidecar");

tauri::async_runtime::spawn(async move {
  // read events such as stdout
  while let Some(event) = rx.recv().await {
    if let CommandEvent::Stdout(line_bytes) = event {
      let line = String::from_utf8_lossy(&line_bytes);
      window
        .emit("message", Some(format!("'{}'", line)))
        .expect("failed to emit event");
      // write to stdin
      child.write("message from Rust\n".as_bytes()).unwrap();
    }
  }
});
```

You can place this code inside a Tauri command to easily pass the AppHandle or you can store a reference to the AppHandle in the builder script to access it elsewhere in your application.

## Running it from JavaScript

When running the sidecar, Tauri requires you to give the sidecar permission to run the `execute` or `spawn` method on the child process. To grant this permission, go to the file `<PROJECT ROOT>/src-tauri/capabilities/default.json` and add the section below to the permissions array. Don’t forget to name your sidecar according to the relative path mentioned earlier.

```
{
  "permissions": [
    "core:default",
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "name": "binaries/app",
          "sidecar": true
        }
      ]
    },
    "shell:allow-open"
  ]
}
```

In the JavaScript code, import the `Command` class from the `@tauri-apps/plugin-shell` module and use the `sidecar` static method.

```
import { Command } from '@tauri-apps/plugin-shell';

const command = Command.sidecar('binaries/my-sidecar');
const output = await command.execute();
```

## Passing arguments

You can pass arguments to Sidecar commands just like you would for running normal Command.

Arguments can be either **static** (e.g. `-o` or `serve`) or **dynamic** (e.g. `<file_path>` or `localhost:<PORT>`). You define the arguments in the exact order in which you’d call them. Static arguments are defined as-is, while dynamic arguments can be defined using a regular expression.

First, define the arguments that need to be passed to the sidecar command in `src-tauri/capabilities/default.json`:

```
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "args": [
            "arg1",
            "-a",
            "--arg2",
            {
              "validator": "\\S+"
            }
          ],
          "name": "binaries/my-sidecar",
          "sidecar": true
        }
      ]
    },
    "shell:allow-open"
  ]
}
```

Then, to call the sidecar command, simply pass in **all** the arguments as an array.

In Rust:

```
use tauri_plugin_shell::ShellExt;

#[tauri::command]
async fn call_my_sidecar(app: tauri::AppHandle) {
  let sidecar_command = app
    .shell()
    .sidecar("my-sidecar")
    .unwrap()
    .args(["arg1", "-a", "--arg2", "any-string-that-matches-the-validator"]);

  let (mut _rx, mut _child) = sidecar_command.spawn().unwrap();
}
```

In JavaScript:

```
import { Command } from '@tauri-apps/plugin-shell';

// notice that the args array matches EXACTLY what is specified in `capabilities/default.json`.
const command = Command.sidecar('binaries/my-sidecar', [
  'arg1',
  '-a',
  '--arg2',
  'any-string-that-matches-the-validator',
]);

const output = await command.execute();
```

