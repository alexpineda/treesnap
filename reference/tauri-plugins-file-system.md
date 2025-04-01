# File System

## File System | Tauri
[https://v2.tauri.app/plugin/file-system/](https://v2.tauri.app/plugin/file-system/)

```markdown
# File System

Access the file system.

## Supported Platforms

_This plugin requires a Rust version of at least **1.77.2**_

| Platform | Level | Notes |
| --- | --- | --- |
| windows |  | Apps installed via MSI or NSIS in `perMachine` and `both` mode require admin permissions for write access in `$RESOURCES` folder |
| linux |  | No write access to `$RESOURCES` folder |
| macos |  | No write access to `$RESOURCES` folder |
| android |  | Access is restricted to Application folder by default |
| ios |  | Access is restricted to Application folder by default |

## Setup

Install the fs plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add fs
```

```
yarn run tauri add fs
```

```
pnpm tauri add fs
```

```
deno task tauri add fs
```

```
bun tauri add fs
```

```
cargo tauri add fs
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-fs
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
     tauri::Builder::default()
       .plugin(tauri_plugin_fs::init())
       .run(tauri::generate_context!())
       .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-fs
```

```
yarn add @tauri-apps/plugin-fs
```

```
pnpm add @tauri-apps/plugin-fs
```

```
deno add npm:@tauri-apps/plugin-fs
```

```
bun add @tauri-apps/plugin-fs
```

## Configuration

### Android

When using the audio, cache, documents, downloads, picture, public or video directories your app must have access to the external storage.

Include the following permissions to the `manifest` tag in the `gen/android/app/src/main/AndroidManifest.xml` file:

```
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### iOS

Apple requires app developers to specify approved reasons for API usage to enhance user privacy.

You must create a `PrivacyInfo.xcprivacy` file in the `src-tauri/gen/apple` folder with the required `NSPrivacyAccessedAPICategoryFileTimestamp` key and the `C617.1` recommended reason.

```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
      <dict>
        <key>NSPrivacyAccessedAPIType</key>
        <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
        <key>NSPrivacyAccessedAPITypeReasons</key>
        <array>
          <string>C617.1</string>
        </array>
      </dict>
    </array>
  </dict>
</plist>
```

## Usage

The fs plugin is available in both JavaScript and Rust.

### JavaScript

```javascript
import { exists, BaseDirectory } from '@tauri-apps/plugin-fs';

// Check if the `$APPDATA/avatar.png` file exists
await exists('avatar.png', { baseDir: BaseDirectory.AppData });
```

### Rust

```rust
use tauri_plugin_fs::FsExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
      .plugin(tauri_plugin_fs::init())
      .setup(|app| {
          // allowed the given directory
          let scope = app.fs_scope();
          scope.allow_directory("/path/to/directory", false);
          dbg!(scope.allowed());
          Ok(())
       })
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
}
```

## Security

This module prevents path traversal, not allowing parent directory accessors to be used (i.e. “/usr/path/to/../file” or ”../path/to/file” paths are not allowed). Paths accessed with this API must be either relative to one of the base directories or created with the path API.

## Paths

The file system plugin offers two ways of manipulating paths: the base directory and the path API.

- **Base Directory**: Every API has an options argument that lets you define a baseDir that acts as the working directory of the operation.

```javascript
import { readFile } from '@tauri-apps/plugin-fs';

const contents = await readFile('avatars/tauri.png', {
    baseDir: BaseDirectory.Home,
});
```

- **Path API**: Alternatively you can use the path APIs to perform path manipulations.

```javascript
import { readFile } from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';

const home = await path.homeDir();
const contents = await readFile(await path.join(home, 'avatars/tauri.png'));
```

## Files

### Create

Creates a file and returns a handle to it. If the file already exists, it is truncated.

```javascript
import { create, BaseDirectory } from '@tauri-apps/plugin-fs';

const file = await create('foo/bar.txt', { baseDir: BaseDirectory.AppData });
await file.write(new TextEncoder().encode('Hello world'));
await file.close();
```

### Write

The plugin offers separate APIs for writing text and binary files for performance.

- **Text Files**

```javascript
import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

const contents = JSON.stringify({ notifications: true });
await writeTextFile('config.json', contents, {
    baseDir: BaseDirectory.AppConfig,
});
```

- **Binary Files**

```javascript
import { writeFile, BaseDirectory } from '@tauri-apps/plugin-fs';

const contents = new Uint8Array(); // fill a byte array
await writeFile('config', contents, {
    baseDir: BaseDirectory.AppConfig,
});
```

### Open

Opens a file and returns a handle to it.

- **Read-Only**

```javascript
import { open, BaseDirectory } from '@tauri-apps/plugin-fs';

const file = await open('foo/bar.txt', {
    read: true,
    baseDir: BaseDirectory.AppData,
});

const stat = await file.stat();
const buf = new Uint8Array(stat.size);
await file.read(buf);
const textContents = new TextDecoder().decode(buf);
await file.close();
```

- **Write-Only**

```javascript
import { open, BaseDirectory } from '@tauri-apps/plugin-fs';

const file = await open('foo/bar.txt', {
    write: true,
    baseDir: BaseDirectory.AppData,
});

await file.write(new TextEncoder().encode('Hello world'));
await file.close();
```

- **Append**

```javascript
import { open, BaseDirectory } from '@tauri-apps/plugin-fs';

const file = await open('foo/bar.txt', {
    append: true,
    baseDir: BaseDirectory.AppData,
});

await file.write(new TextEncoder().encode('world'));
await file.close();
```

- **Truncate**

```javascript
import { open, BaseDirectory } from '@tauri-apps/plugin-fs';

const file = await open('foo/bar.txt', {
    write: true,
    truncate: true,
    baseDir: BaseDirectory.AppData,
});

await file.write(new TextEncoder().encode('world'));
await file.close();
```

- **Create**

```javascript
import { open, BaseDirectory } from '@tauri-apps/plugin-fs';

const file = await open('foo/bar.txt', {
    write: true,
    create: true,
    baseDir: BaseDirectory.AppData,
});

await file.write(new TextEncoder().encode('world'));
await file.close();
```

- **Create New**

```javascript
import { open, BaseDirectory } from '@tauri-apps/plugin-fs';

const file = await open('foo/bar.txt', {
    write: true,
    createNew: true,
    baseDir: BaseDirectory.AppData,
});

await file.write(new TextEncoder().encode('world'));
await file.close();
```

### Read

The plugin offers separate APIs for reading text and binary files for performance.

- **Text Files**

```javascript
import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

const configToml = await readTextFile('config.toml', {
    baseDir: BaseDirectory.AppConfig,
});
```

- **Streaming Lines**

```javascript
import { readTextFileLines, BaseDirectory } from '@tauri-apps/plugin-fs';

const lines = await readTextFileLines('app.logs', {
    baseDir: BaseDirectory.AppLog,
});

for await (const line of lines) {
    console.log(line);
}
```

- **Binary Files**

```javascript
import { readFile, BaseDirectory } from '@tauri-apps/plugin-fs';

const icon = await readFile('icon.png', {
    baseDir: BaseDirectory.Resources,
});
```

### Remove

Call `remove()` to delete a file. If the file does not exist, an error is returned.

```javascript
import { remove, BaseDirectory } from '@tauri-apps/plugin-fs';

await remove('user.db', { baseDir: BaseDirectory.AppLocalData });
```

### Copy

The `copyFile` function takes the source and destination paths.

```javascript
import { copyFile, BaseDirectory } from '@tauri-apps/plugin-fs';

await copyFile('user.db', 'user.db.bk', {
  fromPathBaseDir: BaseDirectory.AppLocalData,
  toPathBaseDir: BaseDirectory.Temp,
});
```

### Exists

Use the `exists()` function to check if a file exists:

```javascript
import { exists, BaseDirectory } from '@tauri-apps/plugin-fs';

const tokenExists = await exists('token', {
  baseDir: BaseDirectory.AppLocalData,
});
```

### Metadata

File metadata can be retrieved with the `stat` and the `lstat` functions.

```javascript
import { stat, BaseDirectory } from '@tauri-apps/plugin-fs';

const metadata = await stat('app.db', {
  baseDir: BaseDirectory.AppLocalData,
});
```

### Rename

The `rename` function takes the source and destination paths.

```javascript
import { rename, BaseDirectory } from '@tauri-apps/plugin-fs';

await rename('user.db.bk', 'user.db', {
  fromPathBaseDir: BaseDirectory.AppLocalData,
  toPathBaseDir: BaseDirectory.Temp,
});
```

### Truncate

Truncates or extends the specified file to reach the specified file length (defaults to 0).

```javascript
import { truncate } from '@tauri-apps/plugin-fs';

await truncate('my_file.txt', 0, { baseDir: BaseDirectory.AppLocalData });
```

## Directories

### Create

To create a directory, call the `mkdir` function:

```javascript
import { mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';

await mkdir('images', {
  baseDir: BaseDirectory.AppLocalData,
});
```

### Read

The `readDir` function recursively lists the entries of a directory:

```javascript
import { readDir, BaseDirectory } from '@tauri-apps/plugin-fs';

const entries = await readDir('users', { baseDir: BaseDirectory.AppLocalData });
```

### Remove

Call `remove()` to delete a directory. If the directory does not exist, an error is returned.

```javascript
import { remove, BaseDirectory } from '@tauri-apps/plugin-fs';

await remove('images', { baseDir: BaseDirectory.AppLocalData });
```

If the directory is not empty, the `recursive` option must be set to `true`:

```javascript
import { remove, BaseDirectory } from '@tauri-apps/plugin-fs';

await remove('images', {
  baseDir: BaseDirectory.AppLocalData,
  recursive: true,
});
```

### Exists

Use the `exists()` function to check if a directory exists:

```javascript
import { exists, BaseDirectory } from '@tauri-apps/plugin-fs';

const tokenExists = await exists('images', {
  baseDir: BaseDirectory.AppLocalData,
});
```

### Metadata

Directory metadata can be retrieved with the `stat` and the `lstat` functions.

```javascript
import { stat, BaseDirectory } from '@tauri-apps/plugin-fs';

const metadata = await stat('databases', {
  baseDir: BaseDirectory.AppLocalData,
});
```

## Watching changes

To watch a directory or file for changes, use the `watch` or `watchImmediate` functions.

- **Watch**

```javascript
import { watch, BaseDirectory } from '@tauri-apps/plugin-fs';

await watch(
    'app.log',
    (event) => {
      console.log('app.log event', event);
    },
    {
      baseDir: BaseDirectory.AppLog,
      delayMs: 500,
    }
);
```

- **Watch Immediate**

```javascript
import { watchImmediate, BaseDirectory } from '@tauri-apps/plugin-fs';

await watchImmediate(
    'logs',
    (event) => {
      console.log('logs directory event', event);
    },
    {
      baseDir: BaseDirectory.AppLog,
      recursive: true,
    }
);
```

## Permissions

By default all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "fs:default",
    {
      "identifier": "fs:allow-exists",
      "allow": [{ "path": "$APPDATA/*" }]
    }
  ]
}
```

## Default Permission

This set of permissions describes the what kind of file system access the `fs` plugin has enabled or denied by default.

### Granted Permissions

This default permission set enables read access to the application specific directories (AppConfig, AppData, AppLocalData, AppCache, AppLog) and all files and sub directories created in it.

### Denied Permissions

This default permission set prevents access to critical components of the Tauri application by default.

### Included permissions within this default permission set:

- `create-app-specific-dirs`
- `read-app-specific-dirs-recursive`
- `deny-default`

## Permission Table

| Identifier | Description |
| --- | --- |
| `fs:allow-app-read-recursive` | This allows full recursive read access to the complete application folders, files and subdirectories. |
| `fs:allow-app-write-recursive` | This allows full recursive write access to the complete application folders, files and subdirectories. |
| `fs:allow-app-read` | This allows non-recursive read access to the application folders. |
| `fs:allow-app-write` | This allows non-recursive write access to the application folders. |
| `fs:allow-app-meta-recursive` | This allows full recursive read access to metadata of the application folders, including file listing and statistics. |
| `fs:allow-app-meta` | This allows non-recursive read access to metadata of the application folders, including file listing and statistics. |
| `fs:scope-app-recursive` | This scope permits recursive access to the complete application folders, including sub directories and files. |
| `fs:scope-app` | This scope permits access to all files and list content of top level directories in the application folders. |
| `fs:scope-app-index` | This scope permits to list all files and folders in the application directories. |

### Scopes

This plugin permissions includes scopes for defining which paths are allowed or explicitly rejected.

Each `allow` or `deny` scope must include an array listing all paths that should be allowed or denied. The scope entries are in the `{ path: string }` format.

Scope entries can use `$<path>` variables to reference common system paths such as the home directory, the app resources directory and the config directory.

| Path | Variable |
| --- | --- |
| appConfigDir | $APPCONFIG |
| appDataDir | $APPDATA |
| appLocalDataDir | $APPLOCALDATA |
| appcacheDir | $APPCACHE |
| applogDir | $APPLOG |
| audioDir | $AUDIO |
| cacheDir | $CACHE |
| configDir | $CONFIG |
| dataDir | $DATA |
| localDataDir | $LOCALDATA |
| desktopDir | $DESKTOP |
| documentDir | $DOCUMENT |
| downloadDir | $DOWNLOAD |
| executableDir | $EXE |
| fontDir | $FONT |
| homeDir | $HOME |
| pictureDir | $PICTURE |
| publicDir | $PUBLIC |
| runtimeDir | $RUNTIME |
| templateDir | $TEMPLATE |
| videoDir | $VIDEO |
| resourceDir | $RESOURCE |
| tempDir | $TEMP |

#### Examples

- **Global Scope**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    {
      "identifier": "fs:scope",
      "allow": [{ "path": "$APPDATA" }, { "path": "$APPDATA/**" }]
    }
  ]
}
```

- **Specific Command Scope**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    {
      "identifier": "fs:allow-rename",
      "allow": [{ "path": "$HOME/**" }]
    },
    {
      "identifier": "fs:allow-rename",
      "deny": [{ "path": "$HOME/.config/**" }]
    },
    {
      "identifier": "fs:allow-exists",
      "allow": [{ "path": "$APPDATA/*" }]
    }
  ]
}
``` 
```

## Opener | Tauri
[https://v2.tauri.app/plugin/opener/](https://v2.tauri.app/plugin/opener/)

# Opener

This plugin allows you to open files and URLs in a specified, or the default, application. It also supports “revealing” files in the system’s file explorer.

## Supported Platforms

_This plugin requires a Rust version of at least **1.77.2**_

| Platform | Level | Notes |
| --- | --- | --- |
| windows |  |  |
| linux |  |  |
| macos |  |  |
| android |  | Only allows to open URLs via `open` |
| ios |  | Only allows to open URLs via `open` |

## Setup

Install the opener plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add opener
```

```
yarn run tauri add opener
```

```
pnpm tauri add opener
```

```
deno task tauri add opener
```

```
bun tauri add opener
```

```
cargo tauri add opener
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-opener
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-opener
```

```
yarn add @tauri-apps/plugin-opener
```

```
pnpm add @tauri-apps/plugin-opener
```

```
deno add npm:@tauri-apps/plugin-opener
```

```
bun add @tauri-apps/plugin-opener
```

## Usage

The shell plugin is available in both JavaScript and Rust.

### JavaScript

```javascript
import { openPath } from '@tauri-apps/plugin-opener';

// opens a file using the default program:
await openPath('/path/to/file');

// opens a file using `vlc` command on Windows:
await openPath('C:/path/to/file', 'vlc');
```

### Rust

```rust
use tauri_plugin_opener::OpenerExt;

// opens a file using the default program:
app.opener().open_path("/path/to/file", None::<&str>);

// opens a file using `vlc` command on Windows:
app.opener().open_path("C:/path/to/file", Some("vlc"));
```

## Permissions

By default all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    {
      "identifier": "opener:allow-open-path",
      "allow": [
        {
          "path": "/path/to/file"
        }
      ]
    }
  ]
}
```

## Default Permission

This permission set allows opening `mailto:`, `tel:`, `https://` and `http://` urls using their default application as well as reveal file in directories using default file explorer.

- `allow-open-url`
- `allow-reveal-item-in-dir`
- `allow-default-urls`

## Permission Table

| Identifier | Description |
| --- | --- |
| `opener:allow-default-urls` | This enables opening `mailto:`, `tel:`, `https://` and `http://` urls using their default application. |
| `opener:allow-open-path` | Enables the open_path command without any pre-configured scope. |
| `opener:deny-open-path` | Denies the open_path command without any pre-configured scope. |
| `opener:allow-open-url` | Enables the open_url command without any pre-configured scope. |
| `opener:deny-open-url` | Denies the open_url command without any pre-configured scope. |
| `opener:allow-reveal-item-in-dir` | Enables the reveal_item_in_dir command without any pre-configured scope. |
| `opener:deny-reveal-item-in-dir` | Denies the reveal_item_in_dir command without any pre-configured scope. |

## Logging | Tauri
[https://v2.tauri.app/plugin/logging/](https://v2.tauri.app/plugin/logging/)

```markdown
# Logging

Configurable logging for your Tauri app.

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

Install the log plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add log
```

```
yarn run tauri add log
```

```
pnpm tauri add log
```

```
deno task tauri add log
```

```
bun tauri add log
```

```
cargo tauri add log
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-log
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-log
```

```
yarn add @tauri-apps/plugin-log
```

```
pnpm add @tauri-apps/plugin-log
```

```
deno add npm:@tauri-apps/plugin-log
```

```
bun add @tauri-apps/plugin-log
```

## Usage

1. First, you need to register the plugin with Tauri.

```rust
use tauri_plugin_log::{Target, TargetKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

2. Afterwards, all the plugin’s APIs are available through the JavaScript guest bindings:

```javascript
import {
    warn,
    debug,
    trace,
    info,
    error,
    attachConsole,
    attachLogger,
} from '@tauri-apps/plugin-log';
```

## Logging

Use one of the plugin’s `warn`, `debug`, `trace`, `info` or `error` APIs to produce a log record from JavaScript code:

```javascript
import { warn, debug, trace, info, error } from '@tauri-apps/plugin-log';

trace('Trace');
info('Info');
error('Error');
```

To automatically forward all `console` messages to the log plugin you can rewrite them:

```javascript
function forwardConsole(
    fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
    logger: (message: string) => Promise<void>
) {
    const original = console[fnName];
    console[fnName] = (message) => {
        original(message);
        logger(message);
    };
}

forwardConsole('log', trace);
forwardConsole('debug', debug);
forwardConsole('info', info);
forwardConsole('warn', warn);
forwardConsole('error', error);
```

To create your own logs on the Rust side you can use the `log` crate:

```rust
log::error!("something bad happened!");
log::info!("Tauri is awesome!");
```

Note that the `log` crate must be added to your `Cargo.toml` file:

```
[dependencies]
log = "0.4"
```

## Log targets

The log plugin builder has a `targets` function that lets you configure common destination of all your application logs.

### Printing logs to the terminal

To forward all your logs to the terminal, enable the `Stdout` or `Stderr` targets:

```rust
tauri_plugin_log::Builder::new()
    .target(tauri_plugin_log::Target::new(
        tauri_plugin_log::TargetKind::Stdout,
    ))
    .build()
```

This target is enabled by default.

### Logging to the webview console

To view all your Rust logs in the webview console, enable the `Webview` target and run `attachConsole` in your frontend:

```rust
tauri_plugin_log::Builder::new()
    .target(tauri_plugin_log::Target::new(
        tauri_plugin_log::TargetKind::Webview,
    ))
    .build()
```

```javascript
import { attachConsole } from '@tauri-apps/plugin-log';

const detach = await attachConsole();
// call detach() if you do not want to print logs to the console anymore
```

### Persisting logs

To write all logs to a file, you can use either the `LogDir` or the `Folder` targets.

- `LogDir`:

```rust
tauri_plugin_log::Builder::new()
    .target(tauri_plugin_log::Target::new(
        tauri_plugin_log::TargetKind::LogDir {
            file_name: Some("logs".to_string()),
        },
    ))
    .build()
```

When using the LogDir target, all logs are stored in the recommended log directory.

- `Folder`:

The Folder target lets you write logs to a custom location in the filesystem.

```rust
tauri_plugin_log::Builder::new()
    .target(tauri_plugin_log::Target::new(
        tauri_plugin_log::TargetKind::Folder {
            path: std::path::PathBuf::from("/path/to/logs"),
            file_name: None,
        },
    ))
    .build()
```

The default `file_name` is the application name.

#### Configuring log file behavior

By default the log file gets discarded when it reaches the maximum size. The maximum file size can be configured via the builder’s `max_file_size` function:

```rust
tauri_plugin_log::Builder::new()
    .max_file_size(50_000 /* bytes */)
    .build()
```

Tauri can automatically rotate your log file when it reaches the size limit instead of discarding the previous file. This behavior can be configured using `rotation_strategy`:

```rust
tauri_plugin_log::Builder::new()
    .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
    .build()
```

### Filtering

By default **all** logs are processed. There are some mechanisms to reduce the amount of logs and filter only relevant information.

### Maximum log level

To set a maximum log level, use the `level` function:

```rust
tauri_plugin_log::Builder::new()
    .level(log::LevelFilter::Info)
    .build()
```

In this example, debug and trace logs are discarded as they have a lower level than _info_.

It is also possible to define separate maximum levels for individual modules:

```rust
tauri_plugin_log::Builder::new()
    .level(log::LevelFilter::Info)
    .level_for("my_crate_name::commands", log::LevelFilter::Trace)
    .build()
```

### Target filter

A `filter` function can be defined to discard unwanted logs by checking their metadata:

```rust
tauri_plugin_log::Builder::new()
    .filter(|metadata| metadata.target() != "hyper")
    .build()
```

### Formatting

The log plugin formats each log record as `DATE[TARGET][LEVEL] MESSAGE`. A custom format function can be provided with `format`:

```rust
tauri_plugin_log::Builder::new()
    .format(|out, message, record| {
        out.finish(format_args!(
            "[{} {}] {}",
            record.level(),
            record.target(),
            message
        ))
    })
    .build()
```

#### Log dates

By default the log plugin uses the UTC timezone to format dates but you can configure it to use the local timezone with `timezone_strategy`:

```rust
tauri_plugin_log::Builder::new()
    .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
    .build()
```

## Permissions

By default, all plugin commands are blocked and cannot be accessed. You must define a list of permissions in your `capabilities` configuration.

```
{
    "$schema": "../gen/schemas/desktop-schema.json",
    "identifier": "main-capability",
    "description": "Capability for the main window",
    "windows": ["main"],
    "permissions": ["log:default"]
}
```

## Default Permission

Allows the log command

- `allow-log`

## Permission Table

| Identifier | Description |
| --- | --- |
| `log:allow-log` | Enables the log command without any pre-configured scope. |
| `log:deny-log` | Denies the log command without any pre-configured scope. |
```

## Process | Tauri
[https://v2.tauri.app/plugin/process/](https://v2.tauri.app/plugin/process/)

# Process

This plugin provides APIs to access the current process. To spawn child processes, see the shell plugin.

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

Install the plugin-process to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add process
```

```
yarn run tauri add process
```

```
pnpm tauri add process
```

```
deno task tauri add process
```

```
bun tauri add process
```

```
cargo tauri add process
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-process
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. If you’d like to utilize the plugin in JavaScript then install the npm package as well:

```
npm install @tauri-apps/plugin-process
```

```
yarn add @tauri-apps/plugin-process
```

```
pnpm add @tauri-apps/plugin-process
```

```
deno add npm:@tauri-apps/plugin-process
```

```
bun add @tauri-apps/plugin-process
```

## Usage

The process plugin is available in both JavaScript and Rust.

### JavaScript

```javascript
import { exit, relaunch } from '@tauri-apps/plugin-process';

// exits the app with the given status code
await exit(0);

// restarts the app
await relaunch();
```

### Rust

```rust
// exits the app with the given status code
app.exit(0);

// restarts the app
app.restart();
```

## Permissions

By default, all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```json
{
  "permissions": [
    ...,
    "process:default"
  ]
}
```

## Default Permission

This permission set configures which process features are by default exposed.

### Granted Permissions

This enables quitting via `allow-exit` and restarting via `allow-restart` the application.

- `allow-exit`
- `allow-restart`

## Permission Table

| Identifier | Description |
| --- | --- |
| `process:allow-exit` | Enables the exit command without any pre-configured scope. |
| `process:deny-exit` | Denies the exit command without any pre-configured scope. |
| `process:allow-restart` | Enables the restart command without any pre-configured scope. |
| `process:deny-restart` | Denies the restart command without any pre-configured scope. |

## Shell | Tauri
[https://v2.tauri.app/plugin/shell/](https://v2.tauri.app/plugin/shell/)

# Shell

Access the system shell. Allows you to spawn child processes.

## Supported Platforms

_This plugin requires a Rust version of at least **1.77.2**_

| Platform | Level | Notes |
| --- | --- | --- |
| windows |  |  |
| linux |  |  |
| macos |  |  |
| android |  | Only allows to open URLs via `open` |
| ios |  | Only allows to open URLs via `open` |

## Setup

Install the shell plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add shell
```

```
yarn run tauri add shell
```

```
pnpm tauri add shell
```

```
deno task tauri add shell
```

```
bun tauri add shell
```

```
cargo tauri add shell
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-shell
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-shell
```

```
yarn add @tauri-apps/plugin-shell
```

```
pnpm add @tauri-apps/plugin-shell
```

```
deno add npm:@tauri-apps/plugin-shell
```

```
bun add @tauri-apps/plugin-shell
```

## Usage

The shell plugin is available in both JavaScript and Rust.

### JavaScript

```javascript
import { Command } from '@tauri-apps/plugin-shell';

let result = await Command.create('exec-sh', [
  '-c',
  "echo 'Hello World!'",
]).execute();

console.log(result);
```

### Rust

```rust
use tauri_plugin_shell::ShellExt;

let shell = app_handle.shell();

let output = tauri::async_runtime::block_on(async move {
    shell
        .command("echo")
        .args(["Hello from Rust!"])
        .output()
        .await
        .unwrap()
});

if output.status.success() {
    println!("Result: {:?}", String::from_utf8(output.stdout));
} else {
    println!("Exit with code: {}", output.status.code().unwrap());
}
```

## Permissions

By default all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "name": "exec-sh",
          "cmd": "sh",
          "args": [
            "-c",
            {
              "validator": "\\S+"
            }
          ],
          "sidecar": false
        }
      ]
    }
  ]
}
```

## Default Permission

This permission set configures which shell functionality is exposed by default.

### Granted Permissions

It allows to use the `open` functionality without any specific scope pre-configured. It will allow opening `http(s)://`, `tel:` and `mailto:` links.

- `allow-open`

## Permission Table

| Identifier | Description |
| --- | --- |
| `shell:allow-execute` | Enables the execute command without any pre-configured scope. |
| `shell:deny-execute` | Denies the execute command without any pre-configured scope. |
| `shell:allow-kill` | Enables the kill command without any pre-configured scope. |
| `shell:deny-kill` | Denies the kill command without any pre-configured scope. |
| `shell:allow-open` | Enables the open command without any pre-configured scope. |
| `shell:deny-open` | Denies the open command without any pre-configured scope. |
| `shell:allow-spawn` | Enables the spawn command without any pre-configured scope. |
| `shell:deny-spawn` | Denies the spawn command without any pre-configured scope. |
| `shell:allow-stdin-write` | Enables the stdin_write command without any pre-configured scope. |
| `shell:deny-stdin-write` | Denies the stdin_write command without any pre-configured scope. |

