# User Interface

## Dialog | Tauri
[https://v2.tauri.app/plugin/dialog/](https://v2.tauri.app/plugin/dialog/)

# Dialog

Native system dialogs for opening and saving files along with message dialogs.

## Supported Platforms

_This plugin requires a Rust version of at least **1.77.2**_

| Platform | Level | Notes |
| --- | --- | --- |
| windows |  |  |
| linux |  |  |
| macos |  |  |
| android |  | Does not support folder picker |
| ios |  | Does not support folder picker |

## Setup

Install the dialog plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add dialog
```

```
yarn run tauri add dialog
```

```
pnpm tauri add dialog
```

```
deno task tauri add dialog
```

```
bun tauri add dialog
```

```
cargo tauri add dialog
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

## Notifications | Tauri
[https://v2.tauri.app/plugin/notification/](https://v2.tauri.app/plugin/notification/)

# Notifications

Send native notifications to your user using the notification plugin.

## Supported Platforms

This plugin requires a Rust version of at least **1.77.2**

| Platform | Level | Notes |
| --- | --- | --- |
| windows |  | Only works for installed apps. Shows powershell name & icon in development. |
| linux |  |  |
| macos |  |  |
| android |  |  |
| ios |  |  |

## Setup

Install the notifications plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add notification
```

```
yarn run tauri add notification
```

```
pnpm tauri add notification
```

```
deno task tauri add notification
```

```
bun tauri add notification
```

```
cargo tauri add notification
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-notification
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. If you’d like to use notifications in JavaScript then install the npm package as well:

```
npm install @tauri-apps/plugin-notification
```

```
yarn add @tauri-apps/plugin-notification
```

```
pnpm add @tauri-apps/plugin-notification
```

```
bun add npm:@tauri-apps/plugin-notification
```

```
bun add @tauri-apps/plugin-notification
```

## Usage

Here are a few examples of how to use the notification plugin:

### Send Notification

Follow these steps to send a notification:

1. Check if permission is granted
2. Request permission if not granted
3. Send the notification

```javascript
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

let permissionGranted = await isPermissionGranted();

if (!permissionGranted) {
  const permission = await requestPermission();
  permissionGranted = permission === 'granted';
}

if (permissionGranted) {
  sendNotification({ title: 'Tauri', body: 'Tauri is awesome!' });
}
```

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_notification::init())
    .setup(|app| {
        use tauri_plugin_notification::NotificationExt;

        app.notification()
            .builder()
            .title("Tauri")
            .body("Tauri is awesome")
            .show()
            .unwrap();

        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

### Actions

Actions add interactive buttons and inputs to notifications. Use them to create a responsive experience for your users.

#### Register Action Types

```javascript
import { registerActionTypes } from '@tauri-apps/plugin-notification';

await registerActionTypes([
  {
    id: 'messages',
    actions: [
      {
        id: 'reply',
        title: 'Reply',
        input: true,
        inputButtonTitle: 'Send',
        inputPlaceholder: 'Type your reply...',
      },
      {
        id: 'mark-read',
        title: 'Mark as Read',
        foreground: false,
      },
    ],
  },
]);
```

#### Action Properties

| Property | Description |
| --- | --- |
| `id` | Unique identifier for the action |
| `title` | Display text for the action button |
| `requiresAuthentication` | Requires device authentication |
| `foreground` | Brings app to foreground when triggered |
| `destructive` | Shows action in red on iOS |
| `input` | Enables text input |
| `inputButtonTitle` | Text for input submit button |
| `inputPlaceholder` | Placeholder text for input field |

#### Listen for Actions

```javascript
import { onAction } from '@tauri-apps/plugin-notification';

await onAction((notification) => {
  console.log('Action performed:', notification);
});
```

### Attachments

Attachments add media content to notifications. Support varies by platform.

```javascript
import { sendNotification } from '@tauri-apps/plugin-notification';

sendNotification({
  title: 'New Image',
  body: 'Check out this picture',
  attachments: [
    {
      id: 'image-1',
      url: 'asset:///notification-image.jpg',
    },
  ],
});
```

#### Attachment Properties

| Property | Description |
| --- | --- |
| `id` | Unique identifier |
| `url` | Content URL using asset:// or file:// protocol |

### Channels

Channels organize notifications into categories with different behaviors. While primarily used on Android, they provide a consistent API across platforms.

#### Create a Channel

```javascript
import {
  createChannel,
  Importance,
  Visibility,
} from '@tauri-apps/plugin-notification';

await createChannel({
  id: 'messages',
  name: 'Messages',
  description: 'Notifications for new messages',
  importance: Importance.High,
  visibility: Visibility.Private,
  lights: true,
  lightColor: '#ff0000',
  vibration: true,
  sound: 'notification_sound',
});
```

#### Channel Properties

| Property | Description |
| --- | --- |
| `id` | Unique identifier |
| `name` | Display name |
| `description` | Purpose description |
| `importance` | Priority level (None, Min, Low, Default, High) |
| `visibility` | Privacy setting (Secret, Private, Public) |
| `lights` | Enable notification LED (Android) |
| `lightColor` | LED color (Android) |
| `vibration` | Enable vibrations |
| `sound` | Custom sound filename |

#### Managing Channels

List existing channels:

```javascript
import { channels } from '@tauri-apps/plugin-notification';

const existingChannels = await channels();
```

Remove a channel:

```javascript
import { removeChannel } from '@tauri-apps/plugin-notification';

await removeChannel('messages');
```

#### Using Channels

Send a notification using a channel:

```javascript
import { sendNotification } from '@tauri-apps/plugin-notification';

sendNotification({
  title: 'New Message',
  body: 'You have a new message',
  channelId: 'messages',
});
```

## Security Considerations

Aside from normal sanitization procedures of user input there are currently no known security considerations.

## Default Permission

This permission set configures which notification features are by default exposed.

#### Granted Permissions

It allows all notification related features.

- `allow-is-permission-granted`
- `allow-request-permission`
- `allow-notify`
- `allow-register-action-types`
- `allow-register-listener`
- `allow-cancel`
- `allow-get-pending`
- `allow-remove-active`
- `allow-get-active`
- `allow-check-permissions`
- `allow-show`
- `allow-batch`
- `allow-list-channels`
- `allow-delete-channel`
- `allow-create-channel`
- `allow-permission-state`

## Permission Table

| Identifier | Description |
| --- | --- |
| `notification:allow-batch` | Enables the batch command without any pre-configured scope. |
| `notification:deny-batch` | Denies the batch command without any pre-configured scope. |
| `notification:allow-cancel` | Enables the cancel command without any pre-configured scope. |
| `notification:deny-cancel` | Denies the cancel command without any pre-configured scope. |
| `notification:allow-check-permissions` | Enables the check_permissions command without any pre-configured scope. |
| `notification:deny-check-permissions` | Denies the check_permissions command without any pre-configured scope. |
| `notification:allow-create-channel` | Enables the create_channel command without any pre-configured scope. |
| `notification:deny-create-channel` | Denies the create_channel command without any pre-configured scope. |
| `notification:allow-delete-channel` | Enables the delete_channel command without any pre-configured scope. |
| `notification:deny-delete-channel` | Denies the delete_channel command without any pre-configured scope. |
| `notification:allow-get-active` | Enables the get_active command without any pre-configured scope. |
| `notification:deny-get-active` | Denies the get_active command without any pre-configured scope. |
| `notification:allow-get-pending` | Enables the get_pending command without any pre-configured scope. |
| `notification:deny-get-pending` | Denies the get_pending command without any pre-configured scope. |
| `notification:allow-is-permission-granted` | Enables the is_permission_granted command without any pre-configured scope. |
| `notification:deny-is-permission-granted` | Denies the is_permission_granted command without any pre-configured scope. |
| `notification:allow-list-channels` | Enables the list_channels command without any pre-configured scope. |
| `notification:deny-list-channels` | Denies the list_channels command without any pre-configured scope. |
| `notification:allow-notify` | Enables the notify command without any pre-configured scope. |
| `notification:deny-notify` | Denies the notify command without any pre-configured scope. |
| `notification:allow-permission-state` | Enables the permission_state command without any pre-configured scope. |
| `notification:deny-permission-state` | Denies the permission_state command without any pre-configured scope. |
| `notification:allow-register-action-types` | Enables the register_action_types command without any pre-configured scope. |
| `notification:deny-register-action-types` | Denies the register_action_types command without any pre-configured scope. |
| `notification:allow-register-listener` | Enables the register_listener command without any pre-configured scope. |
| `notification:deny-register-listener` | Denies the register_listener command without any pre-configured scope. |
| `notification:allow-remove-active` | Enables the remove_active command without any pre-configured scope. |
| `notification:deny-remove-active` | Denies the remove_active command without any pre-configured scope. |
| `notification:allow-request-permission` | Enables the request_permission command without any pre-configured scope. |
| `notification:deny-request-permission` | Denies the request_permission command without any pre-configured scope. |
| `notification:allow-show` | Enables the show command without any pre-configured scope. |
| `notification:deny-show` | Denies the show command without any pre-configured scope. |

## Window State | Tauri
[https://v2.tauri.app/plugin/window-state/](https://v2.tauri.app/plugin/window-state/)

# Window State

Save window positions and sizes and restore them when the app is reopened.

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

Install the window-state plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add window-state
```

```
yarn run tauri add window-state
```

```
pnpm tauri add window-state
```

```
deno task tauri add window-state
```

```
bun tauri add window-state
```

```
cargo tauri add window-state
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-window-state --target 'cfg(any(target_os = "macos", windows, target_os = "linux"))'
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_window_state::Builder::default().build());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-window-state
```

```
yarn add @tauri-apps/plugin-window-state
```

```
pnpm add @tauri-apps/plugin-window-state
```

```
deno add npm:@tauri-apps/plugin-window-state
```

```
bun add @tauri-apps/plugin-window-state
```

## Usage

After adding the window-state plugin, all windows will remember their state when the app is being closed and will restore to their previous state on the next launch.

You can also access the window-state plugin in both JavaScript and Rust.

### JavaScript

You can use `saveWindowState` to manually save the window state:

```javascript
import { saveWindowState, StateFlags } from '@tauri-apps/plugin-window-state';
saveWindowState(StateFlags.ALL);
```

Similarly, you can manually restore a window’s state from disk:

```javascript
import { restoreStateCurrent, StateFlags } from '@tauri-apps/plugin-window-state';
restoreStateCurrent(StateFlags.ALL);
```

### Rust

You can use the `save_window_state()` method exposed by the `AppHandleExt` trait:

```rust
use tauri_plugin_window_state::{AppHandleExt, StateFlags};
app.save_window_state(StateFlags::all()); // will save the state of all open windows to disk
```

Similarly, you can manually restore a window’s state from disk using the `restore_state()` method exposed by the `WindowExt` trait:

```rust
use tauri_plugin_window_state::{WindowExt, StateFlags};
window.restore_state(StateFlags::all()); // will restore the window's state from disk
```

## Permissions

By default, all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```
{
  "permissions": [
    ...,
    "window-state:default",
  ]
}
```

## Default Permission

This permission set configures what kind of operations are available from the window state plugin.

### Granted Permissions

All operations are enabled by default.

- `allow-filename`
- `allow-restore-state`
- `allow-save-window-state`

## Permission Table

| Identifier | Description |
| --- | --- |
| `window-state:allow-filename` | Enables the filename command without any pre-configured scope. |
| `window-state:deny-filename` | Denies the filename command without any pre-configured scope. |
| `window-state:allow-restore-state` | Enables the restore_state command without any pre-configured scope. |
| `window-state:deny-restore-state` | Denies the restore_state command without any pre-configured scope. |
| `window-state:allow-save-window-state` | Enables the save_window_state command without any pre-configured scope. |
| `window-state:deny-save-window-state` | Denies the save_window_state command without any pre-configured scope. |

## Positioner | Tauri
[https://v2.tauri.app/plugin/positioner/](https://v2.tauri.app/plugin/positioner/)

# Positioner

Position your windows at well-known locations.

This plugin is a port of electron-positioner for Tauri.

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

Install the positioner plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add positioner
```

```
yarn run tauri add positioner
```

```
pnpm tauri add positioner
```

```
deno task tauri add positioner
```

```
bun tauri add positioner
```

```
cargo tauri add positioner
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-positioner --target 'cfg(any(target_os = "macos", windows, target_os = "linux"))'
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_positioner::init());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-positioner
```

```
yarn add @tauri-apps/plugin-positioner
```

```
pnpm add @tauri-apps/plugin-positioner
```

```
deno add npm:@tauri-apps/plugin-positioner
```

```
bun add @tauri-apps/plugin-positioner
```

Additional setup is required to get tray-relative positions to work.

1. Add `tray-icon` feature to your `Cargo.toml` file:

```toml
[dependencies]
tauri-plugin-positioner = { version = "2.0.0", features = ["tray-icon"] }
```

2. Setup `on_tray_event` for positioner plugin:

```rust
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.handle().plugin(tauri_plugin_positioner::init());
                tauri::tray::TrayIconBuilder::new()
                    .on_tray_icon_event(|tray_handle, event| {
                        tauri_plugin_positioner::on_tray_event(tray_handle.app_handle(), &event);
                    })
                    .build(app)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Usage

The plugin’s APIs are available through the JavaScript guest bindings:

```javascript
import { moveWindow, Position } from '@tauri-apps/plugin-positioner';
moveWindow(Position.TopRight);
```

You can import and use the Window trait extension directly through Rust:

```rust
use tauri_plugin_positioner::{WindowExt, Position};

let mut win = app.get_webview_window("main").unwrap();
let _ = win.as_ref().window().move_window(Position::TopRight);
```

## Permissions

By default all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```
{
  "permissions": [
    ...,
    "positioner:default",
  ]
}
```

## Default Permission

Allows the moveWindow and handleIconState APIs

- `allow-move-window`
- `allow-move-window-constrained`
- `allow-set-tray-icon-state`

## Permission Table

| Identifier | Description |
| --- | --- |
| `positioner:allow-move-window` | Enables the move_window command without any pre-configured scope. |
| `positioner:deny-move-window` | Denies the move_window command without any pre-configured scope. |
| `positioner:allow-move-window-constrained` | Enables the move_window_constrained command without any pre-configured scope. |
| `positioner:deny-move-window-constrained` | Denies the move_window_constrained command without any pre-configured scope. |
| `positioner:allow-set-tray-icon-state` | Enables the set_tray_icon_state command without any pre-configured scope. |
| `positioner:deny-set-tray-icon-state` | Denies the set_tray_icon_state command without any pre-configured scope. |

## Global Shortcut | Tauri
[https://v2.tauri.app/plugin/global-shortcut/](https://v2.tauri.app/plugin/global-shortcut/)

# Global Shortcut

Register global shortcuts.

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

Install the global-shortcut plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add global-shortcut
```

```
yarn run tauri add global-shortcut
```

```
pnpm tauri add global-shortcut
```

```
deno task tauri add global-shortcut
```

```
bun tauri add global-shortcut
```

```
cargo tauri add global-shortcut
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-global-shortcut --target 'cfg(any(target_os = "macos", windows, target_os = "linux"))'
```

2. Modify `lib.rs` to initialize the plugin:

```rust
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_global_shortcut::Builder::new().build());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-global-shortcut
```

```
yarn add @tauri-apps/plugin-global-shortcut
```

```
pnpm add @tauri-apps/plugin-global-shortcut
```

```
deno add npm:@tauri-apps/plugin-global-shortcut
```

```
bun add @tauri-apps/plugin-global-shortcut
```

## Usage

The global-shortcut plugin is available in both JavaScript and Rust.

### JavaScript

```javascript
import { register } from '@tauri-apps/plugin-global-shortcut';

await register('CommandOrControl+Shift+C', () => {
  console.log('Shortcut triggered');
});
```

### Rust

```rust
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

                let ctrl_n_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyN);

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new().with_handler(move |_app, shortcut, event| {
                        println!("{:?}", shortcut);
                        if shortcut == &ctrl_n_shortcut {
                            match event.state() {
                                ShortcutState::Pressed => {
                                    println!("Ctrl-N Pressed!");
                                }
                                ShortcutState::Released => {
                                    println!("Ctrl-N Released!");
                                }
                            }
                        }
                    })
                    .build(),
                )?;

                app.global_shortcut().register(ctrl_n_shortcut)?;
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
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "global-shortcut:allow-is-registered",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister"
  ]
}
```

## Default Permission

No features are enabled by default, as we believe the shortcuts can be inherently dangerous and it is application specific if specific shortcuts should be registered or unregistered.

## Permission Table

| Identifier | Description |
| --- | --- |
| `global-shortcut:allow-is-registered` | Enables the is_registered command without any pre-configured scope. |
| `global-shortcut:deny-is-registered` | Denies the is_registered command without any pre-configured scope. |
| `global-shortcut:allow-register` | Enables the register command without any pre-configured scope. |
| `global-shortcut:deny-register` | Denies the register command without any pre-configured scope. |
| `global-shortcut:allow-register-all` | Enables the register_all command without any pre-configured scope. |
| `global-shortcut:deny-register-all` | Denies the register_all command without any pre-configured scope. |
| `global-shortcut:allow-unregister` | Enables the unregister command without any pre-configured scope. |
| `global-shortcut:deny-unregister` | Denies the unregister command without any pre-configured scope. |
| `global-shortcut:allow-unregister-all` | Enables the unregister_all command without any pre-configured scope. |
| `global-shortcut:deny-unregister-all` | Denies the unregister_all command without any pre-configured scope. |

