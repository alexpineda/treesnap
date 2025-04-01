# Plugin Development

## Plugin Development | Tauri
[https://v2.tauri.app/develop/plugins/](https://v2.tauri.app/develop/plugins/)

# Plugin Development

Plugins are able to hook into the Tauri lifecycle, expose Rust code that relies on the web view APIs, handle commands with Rust, Kotlin or Swift code, and much more.

Tauri offers a windowing system with web view functionality, a way to send messages between the Rust process and the web view, and an event system along with several tools to enhance the development experience. By design, the Tauri core does not contain features not needed by everyone. Instead it offers a mechanism to add external functionalities into a Tauri application called plugins.

A Tauri plugin is composed of a Cargo crate and an optional NPM package that provides API bindings for its commands and events. Additionally, a plugin project can include an Android library project and a Swift package for iOS.

## Naming Convention

Tauri plugins have a prefix followed by the plugin name. The plugin name is specified on the plugin configuration under `tauri.conf.json > plugins`.

By default Tauri prefixes your plugin crate with `tauri-plugin-`. This helps your plugin to be discovered by the Tauri community and to be used with the Tauri CLI. When initializing a new plugin project, you must provide its name. The generated crate name will be `tauri-plugin-{plugin-name}` and the JavaScript NPM package name will be `tauri-plugin-{plugin-name}-api`. The Tauri naming convention for NPM packages is `@scope-name/plugin-{plugin-name}`.

## Initialize Plugin Project

To bootstrap a new plugin project, run `plugin new`. If you do not need the NPM package, use the `--no-api` CLI flag. If you want to initialize the plugin with Android and/or iOS support, use the `--android` and/or `--ios` flags.

After installing, you can run the following to create a plugin project:

```
npx @tauri-apps/cli plugin new [name]
```

This will initialize the plugin at the directory `tauri-plugin-[name]` and, depending on the used CLI flags, the resulting project will look like this:

```
. tauri-plugin-[name]/
├── src/                - Rust code
│ ├── commands.rs       - Defines the commands the webview can use
│ ├── desktop.rs        - Desktop implementation
│ ├── error.rs          - Default error type to use in returned results
│ ├── lib.rs            - Re-exports appropriate implementation, setup state...
│ ├── mobile.rs         - Mobile implementation
│ └── models.rs         - Shared structs
├── permissions/        - This will host (generated) permission files for commands
├── android             - Android library
├── ios                 - Swift package
├── guest-js            - Source code of the JavaScript API bindings
├── dist-js             - Transpiled assets from guest-js
├── Cargo.toml          - Cargo crate metadata
└── package.json        - NPM package metadata
```

If you have an existing plugin and would like to add Android or iOS capabilities to it, you can use `plugin android add` and `plugin ios add` to bootstrap the mobile library projects and guide you through the changes needed.

## Mobile Plugin Development

Plugins can run native mobile code written in Kotlin (or Java) and Swift. The default plugin template includes an Android library project using Kotlin and a Swift package. It includes an example mobile command showing how to trigger its execution from Rust code.

## Plugin Configuration

In the Tauri application where the plugin is used, the plugin configuration is specified on `tauri.conf.json` where `plugin-name` is the name of the plugin:

```
{
  "build": { ... },
  "tauri": { ... },
  "plugins": {
    "plugin-name": {
      "timeout": 30
    }
  }
}
```

The plugin’s configuration is set on the `Builder` and is parsed at runtime. Here is an example of the `Config` struct being used to specify the plugin configuration:

```rust
use tauri::plugin::{Builder, Runtime, TauriPlugin};
use serde::Deserialize;

// Define the plugin config
#[derive(Deserialize)]
struct Config {
  timeout: usize,
}

pub fn init<R: Runtime>() -> TauriPlugin<R, Config> {
  Builder::<R, Config>::new("<plugin-name>")
    .setup(|app, api| {
      let timeout = api.config().timeout;
      Ok(())
    })
    .build()
}
```

## Lifecycle Events

Plugins can hook into several lifecycle events:

- setup: Plugin is being initialized
- on_navigation: Web view is attempting to perform navigation
- on_webview_ready: New window is being created
- on_event: Event loop events
- on_drop: Plugin is being deconstructed

### setup

- **When**: Plugin is being initialized
- **Why**: Register mobile plugins, manage state, run background tasks

```rust
use tauri::{Manager, plugin::Builder};
use std::{collections::HashMap, sync::Mutex, time::Duration};

struct DummyStore(Mutex<HashMap<String, String>>);

Builder::new("<plugin-name>")
  .setup(|app, api| {
    app.manage(DummyStore(Default::default()));
    let app_ = app.clone();
    std::thread::spawn(move || {
      loop {
        app_.emit("tick", ());
        std::thread::sleep(Duration::from_secs(1));
      }
    });
    Ok(())
  })
```

### on_navigation

- **When**: Web view is attempting to perform navigation
- **Why**: Validate the navigation or track URL changes

Returning `false` cancels the navigation.

```rust
use tauri::plugin::Builder;

Builder::new("<plugin-name>")
  .on_navigation(|window, url| {
    println!("window {} is navigating to {}", window.label(), url);
    url.scheme() != "forbidden"
  })
```

### on_webview_ready

- **When**: New window has been created
- **Why**: Execute an initialization script for every window

```rust
use tauri::plugin::Builder;

Builder::new("<plugin-name>")
  .on_webview_ready(|window| {
    window.listen("content-loaded", |event| {
      println!("webview content has been loaded");
    });
  })
```

### on_event

- **When**: Event loop events
- **Why**: Handle core events such as window events, menu events and application exit requested

```rust
use std::{collections::HashMap, fs::write, sync::Mutex};
use tauri::{plugin::Builder, Manager, RunEvent};

struct DummyStore(Mutex<HashMap<String, String>>);

Builder::new("<plugin-name>")
  .setup(|app, _api| {
    app.manage(DummyStore(Default::default()));
    Ok(())
  })
  .on_event(|app, event| {
    match event {
      RunEvent::ExitRequested { api, .. } => {
        api.prevent_exit();
      }
      RunEvent::Exit => {
        let store = app.state::<DummyStore>();
        write(
          app.path().app_local_data_dir().unwrap().join("store.json"),
          serde_json::to_string(&*store.0.lock().unwrap()).unwrap(),
        )
        .unwrap();
      }
      _ => {}
    }
  })
```

### on_drop

- **When**: Plugin is being deconstructed
- **Why**: Execute code when the plugin has been destroyed

```rust
use tauri::plugin::Builder;

Builder::new("<plugin-name>")
  .on_drop(|app| {
    // plugin has been destroyed...
  })
```

## Exposing Rust APIs

The plugin APIs defined in the project’s `desktop.rs` and `mobile.rs` are exported to the user as a struct with the same name as the plugin (in pascal case). When the plugin is setup, an instance of this struct is created and managed as a state so that users can retrieve it at any point in time with a `Manager` instance (such as `AppHandle`, `App`, or `Window`) through the extension trait defined in the plugin.

For example, the `global-shortcut plugin` defines a `GlobalShortcut` struct that can be read by using the `global_shortcut` method of the `GlobalShortcutExt` trait:

```rust
use tauri_plugin_global_shortcut::GlobalShortcutExt;

tauri::Builder::default()
  .plugin(tauri_plugin_global_shortcut::init())
  .setup(|app| {
    app.global_shortcut().register(...);
    Ok(())
  })
```

## Adding Commands

Commands are defined in the `commands.rs` file. They are regular Tauri applications commands. They can access the AppHandle and Window instances directly, access state, and take input the same way as application commands.

This command shows how to get access to the `AppHandle` and `Window` instance via dependency injection, and takes two input parameters (`on_progress` and `url`):

```rust
use tauri::{command, ipc::Channel, AppHandle, Runtime, Window};

#[command]
async fn upload<R: Runtime>(app: AppHandle<R>, window: Window<R>, on_progress: Channel, url: String) {
  // implement command logic here
  on_progress.send(100).unwrap();
}
```

To expose the command to the webview, you must hook into the `invoke_handler()` call in `lib.rs`:

```rust
Builder::new("<plugin-name>")
    .invoke_handler(tauri::generate_handler![commands::upload])
```

Define a binding function in `webview-src/index.ts` so that plugin users can easily call the command in JavaScript:

```javascript
import { invoke, Channel } from '@tauri-apps/api/core'

export async function upload(url: string, onProgressHandler: (progress: number) => void): Promise<void> {
  const onProgress = new Channel<number>()
  onProgress.onmessage = onProgressHandler
  await invoke('plugin:<plugin-name>|upload', { url, onProgress })
}
```

Be sure to build the TypeScript code prior to testing it.

### Command Permissions

By default your commands are not accessible by the frontend. If you try to execute one of them, you will get a denied error rejection. To actually expose commands, you also need to define permissions that allow each command.

#### Permission Files

Permissions are defined as JSON or TOML files inside the `permissions` directory. Each file can define a list of permissions, a list of permission sets and your plugin’s default permission.

##### Permissions

A permission describes privileges of your plugin commands. It can allow or deny a list of commands and associate command-specific and global scopes.

```
"$schema" = "schemas/schema.json"

[[permission]]
identifier = "allow-start-server"
description = "Enables the start_server command."
commands.allow = ["start_server"]

[[permission]]
identifier = "deny-start-server"
description = "Denies the start_server command."
commands.deny = ["start_server"]
```

##### Scope

Scopes allow your plugin to define deeper restrictions to individual commands. Each permission can define a list of scope objects that define something to be allowed or denied either specific to a command or globally to the plugin.

Let’s define an example struct that will hold scope data for a list of binaries a `shell` plugin is allowed to spawn:

```rust
#[derive(Debug, schemars::JsonSchema)]
pub struct Entry {
    pub binary: String,
}
```

###### Command Scope

Your plugin consumer can define a scope for a specific command in their capability file. You can read the command-specific scope with the `tauri::ipc::CommandScope` struct:

```rust
use tauri::ipc::CommandScope;
use crate::scope::Entry;

async fn spawn<R: tauri::Runtime>(app: tauri::AppHandle<R>, command_scope: CommandScope<'_, Entry>) -> Result<()> {
  let allowed = command_scope.allows();
  let denied = command_scope.denies();
  todo!()
}
```

###### Global Scope

When a permission does not define any commands to be allowed or denied, it’s considered a scope permission and it should only define a global scope for your plugin:

```rust
[[permission]]
identifier = "allow-spawn-node"
description = "This scope permits spawning the `node` binary."

[[permission.scope.allow]]
binary = "node"
```

You can read the global scope with the `tauri::ipc::GlobalScope` struct:

```rust
use tauri::ipc::GlobalScope;
use crate::scope::Entry;

async fn spawn<R: tauri::Runtime>(app: tauri::AppHandle<R>, scope: GlobalScope<'_, Entry>) -> Result<()> {
  let allowed = scope.allows();
  let denied = scope.denies();
  todo!()
}
```

###### Schema

The scope entry requires the `schemars` dependency to generate a JSON schema so the plugin consumers know the format of the scope and have autocomplete in their IDEs.

To define the schema, first add the dependency to your Cargo.toml file:

```toml
[dependencies]
schemars = "0.8"

[build-dependencies]
schemars = "0.8"
```

In your build script, add the following code:

```rust
#[path = "src/scope.rs"]
mod scope;

const COMMANDS: &[&str] = &[];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .global_scope_schema(schemars::schema_for!(scope::Entry))
        .build();
}
```

##### Permission Sets

Permission sets are groups of individual permissions that helps users manage your plugin with a higher level of abstraction. For instance if a single API uses multiple commands or if there’s a logical connection between a collection of commands, you should define a set containing them:

```
"$schema" = "schemas/schema.json"

[[set]]
identifier = "allow-websocket"
description = "Allows connecting and sending messages through a WebSocket"
permissions = ["allow-connect", "allow-send"]
```

##### Default Permission

The default permission is a special permission set with identifier `default`. It’s recommended that you enable required commands by default. For instance the `http` plugin is useless without the `request` command allowed:

```
"$schema" = "schemas/schema.json"

[default]
description = "Allows making HTTP requests"
permissions = ["allow-request"]
```

#### Autogenerated Permissions

The easiest way to define permissions for each of your commands is to use the autogeneration option defined in your plugin’s build script defined in the `build.rs` file. Inside the `COMMANDS` const, define the list of commands in snake_case (should match the command function name) and Tauri will automatically generate an `allow-$commandname` and a `deny-$commandname` permissions.

The following example generates the `allow-upload` and `deny-upload` permissions:

```rust
const COMMANDS: &[&str] = &["upload"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
```

## Managing State

A plugin can manage state in the same way a Tauri application does.

## Mobile Plugin Development | Tauri
[https://v2.tauri.app/develop/plugins/develop-mobile/](https://v2.tauri.app/develop/plugins/develop-mobile/)

# Mobile Plugin Development

Plugins can run native mobile code written in Kotlin (or Java) and Swift. The default plugin template includes an Android library project using Kotlin and a Swift package including an example mobile command showing how to trigger its execution from Rust code.

## Initialize Plugin Project

Follow the steps in the Plugin Development guide to initialize a new plugin project.

If you have an existing plugin and would like to add Android or iOS capabilities to it, you can use `plugin android init` and `plugin ios init` to bootstrap the mobile library projects and guide you through the changes needed.

The default plugin template splits the plugin’s implementation into two separate modules: `desktop.rs` and `mobile.rs`.

The desktop implementation uses Rust code to implement a functionality, while the mobile implementation sends a message to the native mobile code to execute a function and get a result back. If shared logic is needed across both implementations, it can be defined in `lib.rs`:

```rust
use tauri::Runtime;

impl<R: Runtime> <plugin-name><R> {
  pub fn do_something(&self) {
    // do something that is a shared implementation between desktop and mobile
  }
}
```

### Develop an Android Plugin

A Tauri plugin for Android is defined as a Kotlin class that extends `app.tauri.plugin.Plugin` and is annotated with `app.tauri.annotation.TauriPlugin`. Each method annotated with `app.tauri.annotation.Command` can be called by Rust or JavaScript.

Tauri uses Kotlin by default for the Android plugin implementation, but you can switch to Java if you prefer. After generating a plugin, right click the Kotlin plugin class in Android Studio and select the “Convert Kotlin file to Java file” option from the menu. Android Studio will guide you through the project migration to Java.

### Develop an iOS Plugin

A Tauri plugin for iOS is defined as a Swift class that extends the `Plugin` class from the `Tauri` package. Each function with the `@objc` attribute and the `(_ invoke: Invoke)` parameter (for example `@objc private func download(_ invoke: Invoke) { }`) can be called by Rust or JavaScript.

The plugin is defined as a Swift package so that you can use its package manager to manage dependencies.

## Plugin Configuration

Refer to the Plugin Configuration section of the Plugin Development guide for more details on developing plugin configurations.

The plugin instance on mobile has a getter for the plugin configuration:

```kotlin
import android.app.Activity
import android.webkit.WebView
import app.tauri.annotation.TauriPlugin
import app.tauri.annotation.InvokeArg

@InvokeArg
class Config {
    var timeout: Int? = 3000
}

@TauriPlugin
class ExamplePlugin(private val activity: Activity): Plugin(activity) {
    private var timeout: Int? = 3000

    override fun load(webView: WebView) {
        getConfig(Config::class.java).let {
            this.timeout = it.timeout
        }
    }
}
```

```swift
struct Config: Decodable {
    let timeout: Int?
}

class ExamplePlugin: Plugin {
    var timeout: Int? = 3000

    @objc public override func load(webview: WKWebView) {
        do {
            let config = try parseConfig(Config.self)
            self.timeout = config.timeout
        } catch {}
    }
}
```

## Lifecycle Events

Plugins can hook into several lifecycle events:

- **load**: When the plugin is loaded into the web view
- **onNewIntent**: Android only, when the activity is re-launched

### load

- **When**: When the plugin is loaded into the web view
- **Why**: Execute plugin initialization code

```kotlin
import android.app.Activity
import android.webkit.WebView
import app.tauri.annotation.TauriPlugin

@TauriPlugin
class ExamplePlugin(private val activity: Activity): Plugin(activity) {
    override fun load(webView: WebView) {
        // perform plugin setup here
    }
}
```

```swift
class ExamplePlugin: Plugin {
    @objc public override func load(webview: WKWebView) {
        let timeout = self.config["timeout"] as? Int ?? 30
    }
}
```

### onNewIntent

**Note**: This is only available on Android.

- **When**: When the activity is re-launched.
- **Why**: Handle application re-launch such as when a notification is clicked or a deep link is accessed.

```kotlin
import android.app.Activity
import android.content.Intent
import app.tauri.annotation.TauriPlugin

@TauriPlugin
class ExamplePlugin(private val activity: Activity): Plugin(activity) {
    override fun onNewIntent(intent: Intent) {
        // handle new intent event
    }
}
```

## Adding Mobile Commands

There is a plugin class inside the respective mobile projects where commands can be defined that can be called by the Rust code:

```kotlin
import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin

@TauriPlugin
class ExamplePlugin(private val activity: Activity): Plugin(activity) {
    @Command
    fun openCamera(invoke: Invoke) {
        val ret = JSObject()
        ret.put("path", "/path/to/photo.jpg")
        invoke.resolve(ret)
    }
}
```

If you want to use a Kotlin `suspend` function, you need to use a custom coroutine scope:

```kotlin
import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import kotlinx.coroutines.*

val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())

@TauriPlugin
class ExamplePlugin(private val activity: Activity): Plugin(activity) {
    @Command
    fun openCamera(invoke: Invoke) {
        scope.launch {
            openCameraInner(invoke)
        }
    }

    private suspend fun openCameraInner(invoke: Invoke) {
        val ret = JSObject()
        ret.put("path", "/path/to/photo.jpg")
        invoke.resolve(ret)
    }
}
```

```swift
class ExamplePlugin: Plugin {
    @objc public func openCamera(_ invoke: Invoke) throws {
        invoke.resolve(["path": "/path/to/photo.jpg"])
    }
}
```

Use the `tauri::plugin::PluginHandle` to call a mobile command from Rust:

```rust
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::Runtime;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CameraRequest {
    quality: usize,
    allow_edit: bool,
}

#[derive(Deserialize)]
pub struct Photo {
    path: PathBuf,
}

impl<R: Runtime> <plugin-name;pascal-case><R> {
    pub fn open_camera(&self, payload: CameraRequest) -> crate::Result<Photo> {
        self.0.run_mobile_plugin("openCamera", payload).map_err(Into::into)
    }
}
```

## Command Arguments

Arguments are serialized to commands and can be parsed on the mobile plugin with the `Invoke::parseArgs` function, taking a class describing the argument object.

### Android

On Android, the arguments are defined as a class annotated with `@app.tauri.annotation.InvokeArg`. Inner objects must also be annotated:

```kotlin
import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin

@InvokeArg
internal class OpenAppArgs {
    lateinit var name: String
    var timeout: Int? = null
}

@InvokeArg
internal class OpenArgs {
    lateinit var requiredArg: String
    var allowEdit: Boolean = false
    var quality: Int = 100
    var app: OpenAppArgs? = null
}

@TauriPlugin
class ExamplePlugin(private val activity: Activity): Plugin(activity) {
    @Command
    fun openCamera(invoke: Invoke) {
        val args = invoke.parseArgs(OpenArgs::class.java)
    }
}
```

### iOS

On iOS, the arguments are defined as a class that inherits `Decodable`. Inner objects must also inherit the Decodable protocol:

```swift
class OpenAppArgs: Decodable {
    let name: String
    var timeout: Int?
}

class OpenArgs: Decodable {
    let requiredArg: String
    var allowEdit: Bool?
    var quality: UInt8?
    var app: OpenAppArgs?
}

class ExamplePlugin: Plugin {
    @objc public func openCamera(_ invoke: Invoke) throws {
        let args = try invoke.parseArgs(OpenArgs.self)
        invoke.resolve(["path": "/path/to/photo.jpg"])
    }
}
```

## Permissions

If a plugin requires permissions from the end user, Tauri simplifies the process of checking and requesting permissions.

First define the list of permissions needed and an alias to identify each group in code. This is done inside the `TauriPlugin` annotation:

```kotlin
@TauriPlugin(
    permissions = [
        Permission(strings = [Manifest.permission.POST_NOTIFICATIONS], alias = "postNotification")
    ]
)
class ExamplePlugin(private val activity: Activity): Plugin(activity) { }
```

First override the `checkPermissions` and `requestPermissions` functions:

```swift
class ExamplePlugin: Plugin {
    @objc open func checkPermissions(_ invoke: Invoke) {
        invoke.resolve(["postNotification": "prompt"])
    }

    @objc public override func requestPermissions(_ invoke: Invoke) {
        // request permissions here
        // then resolve the request
        invoke.resolve(["postNotification": "granted"])
    }
}
```

Tauri automatically implements two commands for the plugin: `checkPermissions` and `requestPermissions`. Those commands can be directly called from JavaScript or Rust:

```javascript
import { invoke, PermissionState } from '@tauri-apps/api/core'

interface Permissions {
    postNotification: PermissionState
}

// check permission state
const permission = await invoke<Permissions>('plugin:<plugin-name>|checkPermissions')
if (permission.postNotification === 'prompt-with-rationale') {
    // show information to the user about why permission is needed
}

// request permission
if (permission.postNotification.startsWith('prompt')) {
    const state = await invoke<Permissions>('plugin:<plugin-name>|requestPermissions', { permissions: ['postNotification'] })
}
```

```rust
use serde::{Serialize, Deserialize};
use tauri::{plugin::PermissionState, Runtime};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PermissionResponse {
    pub post_notification: PermissionState,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RequestPermission {
    post_notification: bool,
}

impl<R: Runtime> Notification<R> {
    pub fn request_post_notification_permission(&self) -> crate::Result<PermissionState> {
        self.0.run_mobile_plugin::<PermissionResponse>("requestPermissions", RequestPermission { post_notification: true })
            .map(|r| r.post_notification)
            .map_err(Into::into)
    }

    pub fn check_permissions(&self) -> crate::Result<PermissionResponse> {
        self.0.run_mobile_plugin::<PermissionResponse>("checkPermissions", ())
            .map_err(Into::into)
    }
}
```

## Plugin Events

Plugins can emit events at any point of time using the `trigger` function:

```kotlin
@TauriPlugin
class ExamplePlugin(private val activity: Activity): Plugin(activity) {
    override fun load(webView: WebView) {
        trigger("load", JSObject())
    }

    override fun onNewIntent(intent: Intent) {
        // handle new intent event
        if (intent.action == Intent.ACTION_VIEW) {
            val data = intent.data.toString()
            val event = JSObject()
            event.put("data", data)
            trigger("newIntent", event)
        }
    }

    @Command
    fun openCamera(invoke: Invoke) {
        val payload = JSObject()
        payload.put("open", true)
        trigger("camera", payload)
    }
}
```

```swift
class ExamplePlugin: Plugin {
    @objc public override func load(webview: WKWebView) {
        trigger("load", data: [:])
    }

    @objc public func openCamera(_ invoke: Invoke) {
        trigger("camera", data: ["open": true])
    }
}
```

The helper functions can then be called from the NPM package by using the `addPluginListener` helper function:

```javascript
import { addPluginListener, PluginListener } from '@tauri-apps/api/core';

export async function onRequest(handler: (url: string) => void): Promise<PluginListener> {
    return await addPluginListener('<plugin-name>', 'event-name', handler);
}
```

