# Data Management

## Store | Tauri
[https://v2.tauri.app/plugin/store/](https://v2.tauri.app/plugin/store/)

# Store

This plugin provides a persistent key-value store. This is one of many options to handle state in your application. This store will allow you to persist state to a file which can be saved and loaded on demand including between app restarts. Note that this process is asynchronous which will require handling it within your code. It can be used both in the webview or within Rust.

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

Install the store plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add store
```

```
yarn run tauri add store
```

```
pnpm tauri add store
```

```
deno task tauri add store
```

```
bun tauri add store
```

```
cargo tauri add store
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-store
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-store
```

```
yarn add @tauri-apps/plugin-store
```

```
pnpm add @tauri-apps/plugin-store
```

```
deno add npm:@tauri-apps/plugin-store
```

```
bun add @tauri-apps/plugin-store
```

## Usage

### JavaScript

```javascript
import { load } from '@tauri-apps/plugin-store';

// Create a new store or load the existing one
const store = await load('store.json', { autoSave: false });

// Set a value.
await store.set('some-key', { value: 5 });

// Get a value.
const val = await store.get<{ value: number }>('some-key');
console.log(val); // { value: 5 }

// You can manually save the store after making changes.
await store.save();
```

### Rust

```rust
use tauri::Wry;
use tauri_plugin_store::StoreExt;
use serde_json::json;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let store = app.store("store.json")?;
            store.set("some-key", json!({ "value": 5 }));
            let value = store.get("some-key").expect("Failed to get value from store");
            println!("{}", value); // {"value":5}
            store.close_resource();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### LazyStore

There’s also a high level JavaScript API `LazyStore` which only loads the store on first access.

```javascript
import { LazyStore } from '@tauri-apps/plugin-store';
const store = new LazyStore('settings.json');
```

## Permissions

By default all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```json
{
  "permissions": [
    "store:default"
  ]
}
```

## Default Permission

This permission set configures what kind of operations are available from the store plugin.

### Granted Permissions

All operations are enabled by default.

- `allow-load`
- `allow-get-store`
- `allow-set`
- `allow-get`
- `allow-has`
- `allow-delete`
- `allow-clear`
- `allow-reset`
- `allow-keys`
- `allow-values`
- `allow-entries`
- `allow-length`
- `allow-reload`
- `allow-save`

## Permission Table

| Identifier | Description |
| --- | --- |
| `store:allow-clear` | Enables the clear command without any pre-configured scope. |
| `store:deny-clear` | Denies the clear command without any pre-configured scope. |
| `store:allow-delete` | Enables the delete command without any pre-configured scope. |
| `store:deny-delete` | Denies the delete command without any pre-configured scope. |
| `store:allow-entries` | Enables the entries command without any pre-configured scope. |
| `store:deny-entries` | Denies the entries command without any pre-configured scope. |
| `store:allow-get` | Enables the get command without any pre-configured scope. |
| `store:deny-get` | Denies the get command without any pre-configured scope. |
| `store:allow-get-store` | Enables the get_store command without any pre-configured scope. |
| `store:deny-get-store` | Denies the get_store command without any pre-configured scope. |
| `store:allow-has` | Enables the has command without any pre-configured scope. |
| `store:deny-has` | Denies the has command without any pre-configured scope. |
| `store:allow-keys` | Enables the keys command without any pre-configured scope. |
| `store:deny-keys` | Denies the keys command without any pre-configured scope. |
| `store:allow-length` | Enables the length command without any pre-configured scope. |
| `store:deny-length` | Denies the length command without any pre-configured scope. |
| `store:allow-load` | Enables the load command without any pre-configured scope. |
| `store:deny-load` | Denies the load command without any pre-configured scope. |
| `store:allow-reload` | Enables the reload command without any pre-configured scope. |
| `store:deny-reload` | Denies the reload command without any pre-configured scope. |
| `store:allow-reset` | Enables the reset command without any pre-configured scope. |
| `store:deny-reset` | Denies the reset command without any pre-configured scope. |
| `store:allow-save` | Enables the save command without any pre-configured scope. |
| `store:deny-save` | Denies the save command without any pre-configured scope. |
| `store:allow-set` | Enables the set command without any pre-configured scope. |
| `store:deny-set` | Denies the set command without any pre-configured scope. |
| `store:allow-values` | Enables the values command without any pre-configured scope. |
| `store:deny-values` | Denies the values command without any pre-configured scope. |

## SQL | Tauri
[https://v2.tauri.app/plugin/sql/](https://v2.tauri.app/plugin/sql/)

# SQL

Plugin providing an interface for the frontend to communicate with SQL databases through sqlx. It supports the SQLite, MySQL, and PostgreSQL drivers, enabled by a Cargo feature.

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

Install the SQL plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add sql
```

```
yarn run tauri add sql
```

```
pnpm tauri add sql
```

```
deno task tauri add sql
```

```
bun tauri add sql
```

```
cargo tauri add sql
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-sql
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-sql
```

```
yarn add @tauri-apps/plugin-sql
```

```
pnpm add @tauri-apps/plugin-sql
```

```
deno add npm:@tauri-apps/plugin-sql
```

```
bun add @tauri-apps/plugin-sql
```

After installing the plugin, you must select the supported database engine. The available engines are Sqlite, MySQL, and PostgreSQL. Run the following command in the `src-tauri` folder to enable your preferred engine:

```
cargo add tauri-plugin-sql --features sqlite
```

```
cargo add tauri-plugin-sql --features mysql
```

```
cargo add tauri-plugin-sql --features postgres
```

## Usage

All the plugin’s APIs are available through the JavaScript guest bindings:

```javascript
import Database from '@tauri-apps/plugin-sql';

const db = await Database.load('sqlite:test.db');
await db.execute('INSERT INTO ...');
```

```javascript
import Database from '@tauri-apps/plugin-sql';

const db = await Database.load('mysql://user:password@host/test');
await db.execute('INSERT INTO ...');
```

```javascript
import Database from '@tauri-apps/plugin-sql';

const db = await Database.load('postgres://user:password@host/test');
await db.execute('INSERT INTO ...');
```

## Syntax

We use sqlx as the underlying library and adopt their query syntax.

Use the ”$#” syntax when substituting query data:

```javascript
const result = await db.execute(
  "INSERT into todos (id, title, status) VALUES ($1, $2, $3)",
  [todos.id, todos.title, todos.status],
);
```

Use ”?” when substituting query data:

```javascript
const result = await db.execute(
  "INSERT into todos (id, title, status) VALUES (?, ?, ?)",
  [todos.id, todos.title, todos.status],
);
```

## Migrations

This plugin supports database migrations, allowing you to manage database schema evolution over time.

### Defining Migrations

Migrations are defined in Rust using the Migration struct. Each migration should include a unique version number, a description, the SQL to be executed, and the type of migration (Up or Down).

Example of a migration:

```rust
use tauri_plugin_sql::{Migration, MigrationKind};

let migration = Migration {
    version: 1,
    description: "create_initial_tables",
    sql: "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);",
    kind: MigrationKind::Up,
};
```

### Adding Migrations to the Plugin Builder

Migrations are registered with the Builder struct provided by the plugin. Use the `add_migrations` method to add your migrations to the plugin for a specific database connection.

Example of adding migrations:

```rust
use tauri_plugin_sql::{Builder, Migration, MigrationKind};

fn main() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mydatabase.db", migrations)
                .build(),
        )
        ...
}
```

### Applying Migrations

To apply the migrations when the plugin is initialized, add the connection string to the `tauri.conf.json` file:

```json
{
  "plugins": {
    "sql": {
      "preload": ["sqlite:mydatabase.db"]
    }
  }
}
```

Alternatively, the client side `load()` also runs the migrations for a given connection string:

```javascript
import Database from '@tauri-apps/plugin-sql';

const db = await Database.load('sqlite:mydatabase.db');
```

### Migration Management

- **Version Control**: Each migration must have a unique version number. This is crucial for ensuring the migrations are applied in the correct order.
- **Idempotency**: Write migrations in a way that they can be safely re-run without causing errors or unintended consequences.
- **Testing**: Thoroughly test migrations to ensure they work as expected and do not compromise the integrity of your database.

## Permissions

By default, all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```json
{
  "permissions": [
    ...,
    "sql:default",
    "sql:allow-execute"
  ]
}
```

## Default Permission

This permission set configures what kind of database operations are available from the sql plugin.

### Granted Permissions

All reading related operations are enabled. Also allows to load or close a connection.

- `allow-close`
- `allow-load`
- `allow-select`

## Permission Table

| Identifier | Description |
| --- | --- |
| `sql:allow-close` | Enables the close command without any pre-configured scope. |
| `sql:deny-close` | Denies the close command without any pre-configured scope. |
| `sql:allow-execute` | Enables the execute command without any pre-configured scope. |
| `sql:deny-execute` | Denies the execute command without any pre-configured scope. |
| `sql:allow-load` | Enables the load command without any pre-configured scope. |
| `sql:deny-load` | Denies the load command without any pre-configured scope. |
| `sql:allow-select` | Enables the select command without any pre-configured scope. |
| `sql:deny-select` | Denies the select command without any pre-configured scope. |

## Persisted Scope | Tauri
[https://v2.tauri.app/plugin/persisted-scope/](https://v2.tauri.app/plugin/persisted-scope/)

# Persisted Scope

Save filesystem and asset scopes and restore them when the app is reopened.

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

Install the persisted-scope plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add persisted-scope
```

```
yarn run tauri add persisted-scope
```

```
pnpm tauri add persisted-scope
```

```
deno task tauri add persisted-scope
```

```
bun tauri add persisted-scope
```

```
cargo tauri add persisted-scope
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-persisted-scope
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_persisted_scope::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Usage

After setup, the plugin will automatically save and restore filesystem and asset scopes.

## Stronghold | Tauri
[https://v2.tauri.app/plugin/stronghold/](https://v2.tauri.app/plugin/stronghold/)

# Stronghold

Store secrets and keys using the IOTA Stronghold secret management engine.

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

Install the stronghold plugin to get started.

Use your project’s package manager to add the dependency:

```
npm run tauri add stronghold
```

```
yarn run tauri add stronghold
```

```
pnpm tauri add stronghold
```

```
deno task tauri add stronghold
```

```
bun tauri add stronghold
```

```
cargo tauri add stronghold
```

1. Run the following command in the `src-tauri` folder to add the plugin to the project’s dependencies in `Cargo.toml`:

```
cargo add tauri-plugin-stronghold
```

2. Modify `lib.rs` to initialize the plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_stronghold::Builder::new(|password| {}).build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Install the JavaScript Guest bindings using your preferred JavaScript package manager:

```
npm install @tauri-apps/plugin-stronghold
```

```
yarn add @tauri-apps/plugin-stronghold
```

```
pnpm add @tauri-apps/plugin-stronghold
```

```
deno add npm:@tauri-apps/plugin-stronghold
```

```
bun add @tauri-apps/plugin-stronghold
```

## Usage

The plugin must be initialized with a password hash function, which takes the password string and must return a 32 bytes hash derived from it.

### Initialize with argon2 password hash function

The Stronghold plugin offers a default hash function using the argon2 algorithm.

```rust
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let salt_path = app
                .path()
                .app_local_data_dir()
                .expect("could not resolve app local data path")
                .join("salt.txt");

            app.handle().plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Initialize with custom password hash function

Alternatively, you can provide your own hash algorithm by using the `tauri_plugin_stronghold::Builder::new` constructor.

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_stronghold::Builder::new(|password| {
                use argon2::{hash_raw, Config, Variant, Version};

                let config = Config {
                    lanes: 4,
                    mem_cost: 10_000,
                    time_cost: 10,
                    variant: Variant::Argon2id,
                    version: Version::Version13,
                    ..Default::default()
                };

                let salt = "your-salt".as_bytes();
                let key = hash_raw(password.as_ref(), salt, &config).expect("failed to hash password");
                key.to_vec()
            })
            .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Usage from JavaScript

The stronghold plugin is available in JavaScript.

```javascript
import { Client, Stronghold } from '@tauri-apps/plugin-stronghold';
import { appDataDir } from '@tauri-apps/api/path';

const initStronghold = async () => {
  const vaultPath = `${await appDataDir()}/vault.hold`;
  const vaultPassword = 'vault password';
  const stronghold = await Stronghold.load(vaultPath, vaultPassword);
  let client;
  const clientName = 'name your client';

  try {
    client = await stronghold.loadClient(clientName);
  } catch {
    client = await stronghold.createClient(clientName);
  }

  return {
    stronghold,
    client,
  };
};

// Insert a record to the store
async function insertRecord(store, key, value) {
  const data = Array.from(new TextEncoder().encode(value));
  await store.insert(key, data);
}

// Read a record from store
async function getRecord(store, key) {
  const data = await store.get(key);
  return new TextDecoder().decode(new Uint8Array(data));
}

const { stronghold, client } = await initStronghold();
const store = client.getStore();
const key = 'my_key';

// Insert a record to the store
insertRecord(store, key, 'secret value');

// Read a record from store
const value = await getRecord(store, key);
console.log(value); // 'secret value'

// Save your updates
await stronghold.save();

// Remove a record from store
await store.remove(key);
```

## Permissions

By default, all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

```json
{
  "...": "...",
  "permissions": [
    "stronghold:default"
  ]
}
```

## Default Permission

This permission set configures what kind of operations are available from the stronghold plugin.

### Granted Permissions

All non-destructive operations are enabled by default.

- `allow-create-client`
- `allow-get-store-record`
- `allow-initialize`
- `allow-execute-procedure`
- `allow-load-client`
- `allow-save-secret`
- `allow-save-store-record`
- `allow-save`

## Permission Table

| Identifier | Description |
| --- | --- |
| `stronghold:allow-create-client` | Enables the create_client command without any pre-configured scope. |
| `stronghold:deny-create-client` | Denies the create_client command without any pre-configured scope. |
| `stronghold:allow-destroy` | Enables the destroy command without any pre-configured scope. |
| `stronghold:deny-destroy` | Denies the destroy command without any pre-configured scope. |
| `stronghold:allow-execute-procedure` | Enables the execute_procedure command without any pre-configured scope. |
| `stronghold:deny-execute-procedure` | Denies the execute_procedure command without any pre-configured scope. |
| `stronghold:allow-get-store-record` | Enables the get_store_record command without any pre-configured scope. |
| `stronghold:deny-get-store-record` | Denies the get_store_record command without any pre-configured scope. |
| `stronghold:allow-initialize` | Enables the initialize command without any pre-configured scope. |
| `stronghold:deny-initialize` | Denies the initialize command without any pre-configured scope. |
| `stronghold:allow-load-client` | Enables the load_client command without any pre-configured scope. |
| `stronghold:deny-load-client` | Denies the load_client command without any pre-configured scope. |
| `stronghold:allow-remove-secret` | Enables the remove_secret command without any pre-configured scope. |
| `stronghold:deny-remove-secret` | Denies the remove_secret command without any pre-configured scope. |
| `stronghold:allow-remove-store-record` | Enables the remove_store_record command without any pre-configured scope. |
| `stronghold:deny-remove-store-record` | Denies the remove_store_record command without any pre-configured scope. |
| `stronghold:allow-save` | Enables the save command without any pre-configured scope. |
| `stronghold:deny-save` | Denies the save command without any pre-configured scope. |
| `stronghold:allow-save-secret` | Enables the save_secret command without any pre-configured scope. |
| `stronghold:deny-save-secret` | Denies the save_secret command without any pre-configured scope. |
| `stronghold:allow-save-store-record` | Enables the save_store_record command without any pre-configured scope. |
| `stronghold:deny-save-store-record` | Denies the save_store_record command without any pre-configured scope. |

