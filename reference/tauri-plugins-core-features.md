# Core Features

## Features & Recipes | Tauri
[https://v2.tauri.app/plugin/](https://v2.tauri.app/plugin/)

# Features & Recipes

Tauri comes with extensibility in mind. On this page you’ll find:

- **Features**: Built-in Tauri features and functionality
- **Community Resources**: More plugins and recipes built by the Tauri community

## Features

- **Autostart**: Automatically launch your app at system startup.
- **Barcode Scanner**: Allows your mobile application to use the camera to scan QR codes, EAN-13 and other types of barcodes.
- **Biometric**: Prompt the user for biometric authentication on Android and iOS.
- **Clipboard**: Read and write to the system clipboard.
- **Command Line Interface (CLI)**: Parse arguments from the command line interface.
- **Deep Linking**: Set your Tauri application as the default handler for a URL.
- **Dialog**: Native system dialogs for opening and saving files along with message dialogs.
- **File System**: Access the file system.
- **Global Shortcut**: Register global shortcuts.
- **HTTP Client**: Access the HTTP client written in Rust.
- **Localhost**: Use a localhost server in production apps.
- **Logging**: Configurable logging.
- **NFC**: Read and write NFC tags on Android and iOS.
- **Notifications**: Send native notifications to the user.
- **Opener**: Open files and URLs in external applications.
- **OS Information**: Read information about the operating system.
- **Persisted Scope**: Persist runtime scope changes on the filesystem.
- **Positioner**: Move windows to common locations.
- **Process**: Access the current process.
- **Shell**: Access the system shell to spawn child processes.
- **Single Instance**: Ensure that a single instance of your Tauri app is running at a time.
- **SQL**: Tauri Plugin providing an interface for the frontend to communicate with SQL databases through sqlx.
- **Store**: Persistent key value storage.
- **Stronghold**: Encrypted, secure database.
- **Updater**: In-app updates for Tauri applications.
- **Upload**: File uploads through HTTP.
- **Websocket**: Open a WebSocket connection using a Rust client in JavaScript.
- **Window State**: Persist window sizes and positions.

## Community Resources

### Plugins

- **tauri-plugin-blec**: Cross platform Bluetooth Low Energy client based on btleplug.
- **tauri-plugin-drpc**: Discord RPC support.
- **tauri-plugin-keep-screen-on**: Disable screen timeout on Android and iOS.
- **tauri-plugin-graphql**: Type-safe IPC for Tauri using GraphQL.
- **sentry-tauri**: Capture JavaScript errors, Rust panics and native crash minidumps to Sentry.
- **tauri-plugin-aptabase**: Privacy-first and minimalist analytics for desktop and mobile apps.
- **tauri-plugin-clipboard**: Clipboard plugin for reading/writing clipboard text/image/html/rtf/files, and monitoring clipboard update.
- **taurpc**: Typesafe IPC wrapper for Tauri commands and events.
- **tauri-plugin-context-menu**: Native context menu.
- **tauri-plugin-fs-pro**: Extended with additional methods for files and directories.
- **tauri-plugin-macos-permissions**: Check and request macOS permissions to accessibility and full disk access.
- **tauri-plugin-network**: Tools for reading network information and scanning network.
- **tauri-plugin-pinia**: Persistent Pinia stores for Vue.
- **tauri-plugin-prevent-default**: Disable default browser shortcuts.
- **tauri-plugin-python**: Use python in your backend.
- **tauri-plugin-serialport**: Cross-compatible serialport communication tool.
- **tauri-plugin-serialplugin**: Cross-compatible serialport communication tool for Tauri 2.
- **tauri-plugin-sharesheet**: Share content to other apps via the Android Sharesheet or iOS Share Pane.
- **tauri-plugin-svelte**: Persistent Svelte stores.
- **tauri-plugin-system-info**: Detailed system information.
- **tauri-plugin-theme**: Dynamically change Tauri App theme.
- **tauri-awesome-rpc**: Custom invoke system that leverages WebSocket.
- **tauri-nspanel**: Convert a window to panel.
- **tauri-plugin-nosleep**: Block the power save functionality in the OS.
- **tauri-plugin-udp**: UDP socket support.
- **tauri-plugin-tcp**: TCP socket support.
- **tauri-plugin-mqtt**: MQTT client support.
- **tauri-plugin-view**: View and share files on mobile.

### Integrations

- **Astrodon**: Make Tauri desktop apps with Deno.
- **Deno in Tauri**: Run JS/TS code with Deno Core Engine, in Tauri apps.
- **Tauri Specta**: Completely typesafe Tauri commands.
- **axios-tauri-adapter**: Axios adapter for the @tauri-apps/api/http module.
- **axios-tauri-api-adapter**: Makes it easy to use Axios in Tauri, axios adapter for the @tauri-apps/api/http module.
- **ngx-tauri**: Small lib to wrap around functions from Tauri modules, to integrate easier with Angular.
- **svelte-tauri-filedrop**: File drop handling component for Svelte.
- **tauri-macos-menubar-app-example**: Example macOS Menubar app project.
- **tauri-macos-spotlight-example**: Example macOS Spotlight app project.
- **tauri-update-cloudflare**: One-click deploy a Tauri Update Server to Cloudflare.
- **tauri-update-server**: Automatically interface the Tauri updater with git repository releases.
- **vite-plugin-tauri**: Integrate Tauri in a Vite project to build cross-platform apps.

## Support Table

| Plugin | Rust Version | android | ios | linux | macos | windows |
| --- | --- | --- | --- | --- | --- | --- |
| autostart | 1.77.2 |  |  |  |  |  |
| barcode-scanner | 1.77.2 |  |  |  |  |  |
| biometric | 1.77.2 |  |  |  |  |  |
| cli | 1.77.2 |  |  |  |  |  |
| clipboard-manager | 1.77.2 | \\* | \\* |  |  |  |
| deep-link | 1.77.2 | \\* | \\* |  | \\* |  |
| dialog | 1.77.2 | \\* | \\* |  |  |  |
| fs | 1.77.2 | \\* | \\* | \\* | \\* | \\* |
| geolocation | 1.77.2 |  |  |  |  |  |
| global-shortcut | 1.77.2 |  |  |  |  |  |
| haptics | 1.77.2 |  |  |  |  |  |
| http | 1.77.2 |  |  |  |  |  |
| localhost | 1.77.2 |  |  |  |  |  |
| log | 1.77.2 |  |  |  |  |  |
| nfc | 1.77.2 |  |  |  |  |  |
| notification | 1.77.2 |  |  |  |  | \\* |
| opener | 1.77.2 | \\* | \\* |  |  |  |
| os | 1.77.2 |  |  |  |  |  |
| persisted-scope | 1.77.2 |  |  |  |  |  |
| positioner | 1.77.2 |  |  |  |  |  |
| process | 1.77.2 |  |  |  |  |  |
| shell | 1.77.2 | \\* | \\* |  |  |  |
| single-instance | 1.77.2 |  |  |  |  |  |
| sql | 1.77.2 |  |  |  |  |  |
| store | 1.77.2 |  |  |  |  |  |
| stronghold | 1.77.2 |  |  |  |  |  |
| updater | 1.77.2 |  |  |  |  |  |
| upload | 1.77.2 |  |  |  |  |  |
| websocket | 1.77.2 |  |  |  |  |  |
| window-state | 1.77.2 |  |  |  |  |  |
| system-tray | 1.77.2 |  |  |  |  |  |
| window-customization | 1.77.2 |  |  |  |  |  |

## Command Line Interface (CLI) | Tauri
[https://v2.tauri.app/plugin/cli/](https://v2.tauri.app/plugin/cli/)

# Command Line Interface (CLI)

Tauri enables your app to have a CLI through clap, a robust command line argument parser. With a simple CLI definition in your `tauri.conf.json` file, you can define your interface and read its argument matches map on JavaScript and/or Rust.

## Supported Platforms

_This plugin requires a Rust version of at least **1.77.2**_

| Platform | Level | Notes |
| --- | --- | --- |
| windows |  |  |
| linux |  |  |
| macos |  |  |
| android |  |  |
| ios |  |  |

- Windows: Due to an OS limitation, production apps are not able to write text back to the calling console by default.

## Setup

Install the CLI plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add cli
```

```
yarn run tauri add cli
```

```
pnpm tauri add cli
```

```
deno task tauri add cli
```

```
bun tauri add cli
```

```
cargo tauri add cli
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-cli --target 'cfg(any(target_os = "macos", windows, target_os = "linux"))'
```

2. Modify `lib.rs` to initialize the plugin:

```
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_cli::init());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-cli
```

```
yarn add @tauri-apps/plugin-cli
```

```
pnpm add @tauri-apps/plugin-cli
```

```
deno add npm:@tauri-apps/plugin-cli
```

```
bun add @tauri-apps/plugin-cli
```

## Base Configuration

Under `tauri.conf.json`, you have the following structure to configure the interface:

```
{
  "plugins": {
    "cli": {
      "description": "Tauri CLI Plugin Example",
      "args": [
        {
          "short": "v",
          "name": "verbose",
          "description": "Verbosity level"
        }
      ],
      "subcommands": {
        "run": {
          "description": "Run the application",
          "args": [
            {
              "name": "debug",
              "description": "Run application in debug mode"
            },
            {
              "name": "release",
              "description": "Run application in release mode"
            }
          ]
        }
      }
    }
  }
}
```

## Adding Arguments

The `args` array represents the list of arguments accepted by its command or subcommand.

### Positional Arguments

A positional argument is identified by its position in the list of arguments. With the following configuration:

```
{
  "args": [
    {
      "name": "source",
      "index": 1,
      "takesValue": true
    },
    {
      "name": "destination",
      "index": 2,
      "takesValue": true
    }
  ]
}
```

Users can run your app as `./app tauri.txt dest.txt` and the arg matches map will define `source` as `"tauri.txt"` and `destination` as `"dest.txt"`.

### Named Arguments

A named argument is a (key, value) pair where the key identifies the value. With the following configuration:

```
{
  "args": [
    {
      "name": "type",
      "short": "t",
      "takesValue": true,
      "multiple": true,
      "possibleValues": ["foo", "bar"]
    }
  ]
}
```

Users can run your app as `./app --type foo bar`, `./app -t foo -t bar` or `./app --type=foo,bar` and the arg matches map will define `type` as `["foo", "bar"]`.

### Flag Arguments

A flag argument is a standalone key whose presence or absence provides information to your application. With the following configuration:

```
{
  "args": [
    {
      "name": "verbose",
      "short": "v"
    }
  ]
}
```

Users can run your app as `./app -v -v -v`, `./app --verbose --verbose --verbose` or `./app -vvv` and the arg matches map will define `verbose` as `true`, with `occurrences = 3`.

## Subcommands

Some CLI applications have additional interfaces as subcommands. For instance, the `git` CLI has `git branch`, `git commit` and `git push`. You can define additional nested interfaces with the `subcommands` array:

```
{
  "cli": {
    ...
    "subcommands": {
      "branch": {
        "args": []
      },
      "push": {
        "args": []
      }
    }
  }
}
```

Its configuration is the same as the root application configuration, with the `description`, `longDescription`, `args`, etc.

## Usage

The CLI plugin is available in both JavaScript and Rust.

### JavaScript

```
import { getMatches } from '@tauri-apps/plugin-cli';

const matches = await getMatches();

if (matches.subcommand?.name === 'run') {
  const args = matches.subcommand.matches.args;
  if (args.debug?.value === true) {
    // `./your-app run --debug` was executed
  }
  if (args.release?.value === true) {
    // `./your-app run --release` was executed
  }
}
```

### Rust

```
use tauri_plugin_cli::CliExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
   tauri::Builder::default()
       .plugin(tauri_plugin_cli::init())
       .setup(|app| {
           match app.cli().matches() {
               Ok(matches) => {
                   println!("{:?}", matches)
               }
               Err(_) => {}
           }
           Ok(())
       })
       .run(tauri::generate_context!())
       .expect("error while running tauri application");
}
```

## Permissions

By default all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": ["cli:default"]
}
```

## Default Permission

Allows reading the CLI matches

- `allow-cli-matches`

## Permission Table

| Identifier | Description |
| --- | --- |
| `cli:allow-cli-matches` | Enables the cli_matches command without any pre-configured scope. |
| `cli:deny-cli-matches` | Denies the cli_matches command without any pre-configured scope. |

## Autostart | Tauri
[https://v2.tauri.app/plugin/autostart/](https://v2.tauri.app/plugin/autostart/)

# Autostart

Automatically launch your application at system startup.

## Supported Platforms

_This plugin requires a Rust version of at least **1.77.2**_

| Platform | Level | Notes |
| --- | --- | --- |
| windows |  |  |
| linux |  |  |
| macos |  |  |
| android |  |  |
| ios |  |  |

## Setup

Install the autostart plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add autostart
```

```
yarn run tauri add autostart
```

```
pnpm tauri add autostart
```

```
deno task tauri add autostart
```

```
bun tauri add autostart
```

```
cargo tauri add autostart
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-autostart --target 'cfg(any(target_os = "macos", windows, target_os = "linux"))'
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--flag1", "--flag2"]) /* arbitrary number of args to pass to your app */));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. You can install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-autostart
```

```
yarn add @tauri-apps/plugin-autostart
```

```
pnpm add @tauri-apps/plugin-autostart
```

```
deno add npm:@tauri-apps/plugin-autostart
```

```
bun add @tauri-apps/plugin-autostart
```

## Usage

The autostart plugin is available in both JavaScript and Rust.

### JavaScript

```javascript
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';

// Enable autostart
await enable();

// Check enable state
console.log(`registered for autostart? ${await isEnabled()}`);

// Disable autostart
disable();
```

### Rust

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_autostart::MacosLauncher;
                use tauri_plugin_autostart::ManagerExt;
                app.handle().plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    Some(vec!["--flag1", "--flag2"]),
                ));

                // Get the autostart manager
                let autostart_manager = app.autolaunch();

                // Enable autostart
                let _ = autostart_manager.enable();

                // Check enable state
                println!("registered for autostart? {}", autostart_manager.is_enabled().unwrap());

                // Disable autostart
                let _ = autostart_manager.disable();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Permissions

By default all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```json
{
  "permissions": [
    ...,
    "autostart:allow-enable",
    "autostart:allow-disable",
    "autostart:allow-is-enabled"
  ]
}
```

## Default Permission

This permission set configures if your application can enable or disable auto starting the application on boot.

### Granted Permissions

It allows all to check, enable and disable the automatic start on boot.

- `allow-enable`
- `allow-disable`
- `allow-is-enabled`

## Permission Table

| Identifier | Description |
| --- | --- |
| `autostart:allow-disable` | Enables the disable command without any pre-configured scope. |
| `autostart:deny-disable` | Denies the disable command without any pre-configured scope. |
| `autostart:allow-enable` | Enables the enable command without any pre-configured scope. |
| `autostart:deny-enable` | Denies the enable command without any pre-configured scope. |
| `autostart:allow-is-enabled` | Enables the is_enabled command without any pre-configured scope. |
| `autostart:deny-is-enabled` | Denies the is_enabled command without any pre-configured scope. |

## Single Instance | Tauri
[https://v2.tauri.app/plugin/single-instance/](https://v2.tauri.app/plugin/single-instance/)

# Single Instance

Ensure that a single instance of your tauri app is running at a time using the Single Instance Plugin.

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

Install the Single Instance plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add single-instance
```

```
yarn run tauri add single-instance
```

```
pnpm tauri add single-instance
```

```
deno task tauri add single-instance
```

```
bun tauri add single-instance
```

```
cargo tauri add single-instance
```

Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-single-instance --target 'cfg(any(target_os = "macos", windows, target_os = "linux"))'
```

Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_single_instance::init(|app, args, cwd| {}));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Usage

The plugin is already installed and initialized, and it should be functioning correctly right away. Nevertheless, we can also enhance its functionality with the `init()` method.

The plugin `init()` method takes a closure that is invoked when a new app instance was started, but closed by the plugin. The closure has three arguments:

1. **`app`:** The AppHandle of the application.
2. **`args`:** The list of arguments that was passed by the user to initiate this new instance.
3. **`cwd`:** The Current Working Directory denotes the directory from which the new application instance was launched.

So, the closure should look like below:

```rust
.plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
    // Write your code here...
}))
```

### Focusing on New Instance

By default, when you initiate a new instance while the application is already running, no action is taken. To focus the window of the running instance when the user tries to open a new instance, alter the callback closure as follows:

```rust
use tauri::{AppHandle, Manager};

pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            let _ = app.get_webview_window("main")
                       .expect("no main window")
                       .set_focus();
        }));
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Localhost | Tauri
[https://v2.tauri.app/plugin/localhost/](https://v2.tauri.app/plugin/localhost/)

```markdown
# Localhost

Expose your app’s assets through a localhost server instead of the default custom protocol.

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

Install the localhost plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add localhost
```

```
yarn run tauri add localhost
```

```
pnpm tauri add localhost
```

```
deno task tauri add localhost
```

```
bun tauri add localhost
```

```
cargo tauri add localhost
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-localhost
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_localhost::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Usage

The localhost plugin is available in Rust.

```rust
use tauri::{webview::WebviewWindowBuilder, WebviewUrl};

pub fn run() {
    let port: u16 = 9527;

    tauri::Builder::default()
        .plugin(tauri_plugin_localhost::Builder::new(port).build())
        .setup(move |app| {
            let url = format!("http://localhost:{}", port).parse().unwrap();
            WebviewWindowBuilder::new(app, "main".to_string(), WebviewUrl::External(url))
                .title("Localhost Example")
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```
```

