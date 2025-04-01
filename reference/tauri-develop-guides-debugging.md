# Debugging

## Debug | Tauri
[https://v2.tauri.app/develop/debug/](https://v2.tauri.app/develop/debug/)

# Debug

With all the moving pieces in Tauri, you may run into a problem that requires debugging. There are many locations where error details are printed, and Tauri includes some tools to make the debugging process more straightforward.

## Development Only Code

One of the most useful tools in your toolkit for debugging is the ability to add debugging statements in your code. However, you generally don’t want these to end up in production, which is where the ability to check whether you’re running in development mode or not comes in handy.

### In Rust

```rust
fn main() {
  // Whether the current instance was started with `tauri dev` or not.
  #[cfg(dev)]
  {
    // `tauri dev` only code
  }

  if cfg!(dev) {
    // `tauri dev` only code
  } else {
    // `tauri build` only code
  }

  let is_dev: bool = tauri::is_dev();

  // Whether debug assertions are enabled or not. This is true for `tauri dev` and `tauri build --debug`.
  #[cfg(debug_assertions)]
  {
    // Debug only code
  }

  if cfg!(debug_assertions) {
    // Debug only code
  } else {
    // Production only code
  }
}
```

## Rust Console

The first place to look for errors is in the Rust Console. This is in the terminal where you ran, e.g., `tauri dev`. You can use the following code to print something to that console from within a Rust file:

```rust
println!("Message from Rust: {}", msg);
```

Sometimes you may have an error in your Rust code, and the Rust compiler can give you lots of information. If, for example, `tauri dev` crashes, you can rerun it like this on Linux and macOS:

```bash
RUST_BACKTRACE=1 tauri dev
```

or like this on Windows (PowerShell):

```powershell
$env:RUST_BACKTRACE=1
tauri dev
```

This command gives you a granular stack trace. Generally speaking, the Rust compiler helps you by giving you detailed information about the issue, such as:

```
error[E0425]: cannot find value `sun` in this scope
  --> src/main.rs:11:5
   |
11 |     sun += i.to_string().parse::<u64>().unwrap();
   |     ^^^ help: a local variable with a similar name exists: `sum`
error: aborting due to previous error
For more information about this error, try `rustc --explain E0425`.
```

## WebView Console

Right-click in the WebView, and choose `Inspect Element`. This opens up a web-inspector similar to the Chrome or Firefox dev tools you are used to. You can also use the `Ctrl + Shift + i` shortcut on Linux and Windows, and `Command + Option + i` on macOS to open the inspector.

The inspector is platform-specific, rendering the webkit2gtk WebInspector on Linux, Safari’s inspector on macOS and the Microsoft Edge DevTools on Windows.

### Opening Devtools Programmatically

You can control the inspector window visibility by using the `WebviewWindow::open_devtools` and `WebviewWindow::close_devtools` functions:

```rust
tauri::Builder::default()
  .setup(|app| {
    #[cfg(debug_assertions)] // only include this code on debug builds
    {
      let window = app.get_webview_window("main").unwrap();
      window.open_devtools();
      window.close_devtools();
    }
    Ok(())
  });
```

### Using the Inspector in Production

By default, the inspector is only enabled in development and debug builds unless you enable it with a Cargo feature.

#### Create a Debug Build

To create a debug build, run the `tauri build --debug` command.

```bash
npm run tauri build -- --debug
```

```bash
yarn tauri build --debug
```

```bash
pnpm tauri build --debug
```

```bash
deno task tauri build --debug
```

```bash
bun tauri build --debug
```

```bash
cargo tauri build --debug
```

Like the normal build and dev processes, building takes some time the first time you run this command but is significantly faster on subsequent runs. The final bundled app has the development console enabled and is placed in `src-tauri/target/debug/bundle`.

You can also run a built app from the terminal, giving you the Rust compiler notes (in case of errors) or your `println` messages. Browse to the file `src-tauri/target/(release|debug)/[app name]` and run it directly in your console or double-click the executable itself in the filesystem (note: the console closes on errors with this method).

##### Enable Devtools Feature

To enable the devtools in production builds, you must enable the `devtools` Cargo feature in the `src-tauri/Cargo.toml` file:

```toml
[dependencies]
tauri = { version = "...", features = ["...", "devtools"] }
```

## Debugging the Core Process

The Core process is powered by Rust so you can use GDB or LLDB to debug it. You can follow the guide to learn how to use the LLDB VS Code Extension to debug the Core Process of Tauri applications.

## CrabNebula DevTools | Tauri
[https://v2.tauri.app/develop/debug/crabnebula-devtools/](https://v2.tauri.app/develop/debug/crabnebula-devtools/)

# CrabNebula DevTools

CrabNebula provides a free DevTools application for Tauri as part of its partnership with the Tauri project. This application allows you to instrument your Tauri app by capturing its embedded assets, Tauri configuration file, logs, and spans, providing a web frontend to seamlessly visualize data in real time.

With the CrabNebula DevTools, you can inspect your app’s log events (including logs from dependencies), track down the performance of your command calls, and overall Tauri API usage, with a special interface for Tauri events and commands, including payload, responses, and inner logs and execution spans.

To enable the CrabNebula DevTools, install the devtools crate:

```
cargo add tauri-plugin-devtools@2.0.0
```

And initialize the plugin as soon as possible in your main function:

```rust
fn main() {
    // This should be called as early in the execution of the app as possible
    #[cfg(debug_assertions)] // only enable instrumentation in development builds
    let devtools = tauri_plugin_devtools::init();

    let mut builder = tauri::Builder::default();

    #[cfg(debug_assertions)] {
        builder = builder.plugin(devtools);
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

And then run your app as usual. If everything is set up correctly, devtools will print a message indicating that it is running.

## Debug in VS Code | Tauri
[https://v2.tauri.app/develop/debug/vscode/](https://v2.tauri.app/develop/debug/vscode/)

# Debug in VS Code

This guide will walk you through setting up VS Code for debugging the Core Process of your Tauri app.

## All platforms with vscode-lldb extension

### Prerequisites

Install the `vscode-lldb` extension.

### Configure launch.json

Create a `.vscode/launch.json` file and paste the below JSON contents into it:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Development Debug",
      "cargo": {
        "args": [
          "build",
          "--manifest-path=./src-tauri/Cargo.toml",
          "--no-default-features"
        ]
      },
      "preLaunchTask": "ui:dev"
    },
    {
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Production Debug",
      "cargo": {
        "args": ["build", "--release", "--manifest-path=./src-tauri/Cargo.toml"]
      },
      "preLaunchTask": "ui:build"
    }
  ]
}
```

This uses `cargo` directly to build the Rust application and load it in both development and production modes. Note that it does not use the Tauri CLI, so exclusive CLI features are not executed. The `beforeDevCommand` and `beforeBuildCommand` scripts must be executed beforehand or configured as a task in the `preLaunchTask` field. Below is an example `.vscode/tasks.json` file that has two tasks:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "ui:dev",
      "type": "shell",
      "isBackground": true,
      "command": "yarn",
      "args": ["dev"]
    },
    {
      "label": "ui:build",
      "type": "shell",
      "command": "yarn",
      "args": ["build"]
    }
  ]
}
```

Now you can set breakpoints in `src-tauri/src/main.rs` or any other Rust file and start debugging by pressing `F5`.

## With Visual Studio Windows Debugger on Windows

Visual Studio Windows Debugger is a Windows-only debugger that is generally faster than `vscode-lldb` with better support for some Rust features such as enums.

### Prerequisites

Install the C/C++ extension and follow the instructions to install Visual Studio Windows Debugger.

### Configure launch.json and tasks.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch App Debug",
      "type": "cppvsdbg",
      "request": "launch",
      "program": "${workspaceRoot}/src-tauri/target/debug/your-app-name-here.exe",
      "cwd": "${workspaceRoot}",
      "preLaunchTask": "ui:dev"
    }
  ]
}
```

Note that it does not use the Tauri CLI, so exclusive CLI features are not executed. The `tasks.json` is the same as with `lldb`, except you need to add a config group and target your `preLaunchTask` from `launch.json` to it if you want it to always compile before launching. Here is an example of running a dev server and the compilation as a group:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build:debug",
      "type": "cargo",
      "command": "build"
    },
    {
      "label": "ui:dev",
      "type": "shell",
      "isBackground": true,
      "command": "yarn",
      "args": ["dev"]
    },
    {
      "label": "dev",
      "dependsOn": ["build:debug", "ui:dev"],
      "group": {
        "kind": "build"
      }
    }
  ]
}
```

## Debug in Neovim | Tauri
[https://v2.tauri.app/develop/debug/neovim/](https://v2.tauri.app/develop/debug/neovim/)

```markdown
# Debug in Neovim

There are many different plugins that can be used to debug Rust code in Neovim. This guide will show you how to set up `nvim-dap` and some additional plugins to debug Tauri application.

### Prerequisites

`nvim-dap` extension requires `codelldb` binary. Download the version for your system and unzip it. We will point to it later in the `nvim-dap` configuration.

### Configuring nvim-dap

Install `nvim-dap` and `nvim-dap-ui` plugins. Note that `nvim-dap-ui` requires `nvim-nio` plugin.

Next, setup the plugin in your Neovim configuration:

```lua
local dap = require("dap")

dap.adapters.codelldb = {
  type = 'server',
  port = "${port}",
  executable = {
    command = '/opt/codelldb/adapter/codelldb',
    args = {"--port", "${port}"},
  }
}

dap.configurations.rust = {
  {
    name = "Launch file",
    type = "codelldb",
    request = "launch",
    program = function()
      return vim.fn.input('Path to executable: ', vim.fn.getcwd() .. '/target/debug/', 'file')
    end,
    cwd = '${workspaceFolder}',
    stopOnEntry = false
  },
}
```

This setup will ask you to point to the Tauri App binary you want to debug each time you launch the debugger.

Optionally, you can setup `nvim-dap-ui` plugin to toggle debugger view automatically each time debugging session starts and stops:

```lua
local dapui = require("dapui")

dapui.setup()

dap.listeners.before.attach.dapui_config = function()
  dapui.open()
end

dap.listeners.before.launch.dapui_config = function()
  dapui.open()
end

dap.listeners.before.event_terminated.dapui_config = function()
  dapui.close()
end

dap.listeners.before.event_exited.dapui_config = function()
  dapui.close()
end
```

Lastly, you can change the default way the breakpoints are displayed in the editor:

```lua
vim.fn.sign_define('DapBreakpoint', { text ='🟥', texthl ='', linehl ='', numhl =''})
vim.fn.sign_define('DapStopped', { text ='▶️', texthl ='', linehl ='', numhl =''})
```

### Starting the dev server

Since we’re not using Tauri CLI to launch the app, the development server will not start automatically. To control the state of the development server from Neovim, you can use the overseer plugin.

Best way to control tasks running in the background is to use VS Code style task configuration. To do this, create a `.vscode/tasks.json` file in the project's directory.

You can find example task configuration for a project using `trunk` below.

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "process",
      "label": "dev server",
      "command": "trunk",
      "args": ["serve"],
      "isBackground": true,
      "presentation": {
        "revealProblems": "onProblem"
      },
      "problemMatcher": {
        "pattern": {
          "regexp": "^error:.*",
          "file": 1,
          "line": 2
        },
        "background": {
          "activeOnStart": false,
          "beginsPattern": ".*Rebuilding.*",
          "endsPattern": ".*server listening at:.*"
        }
      }
    }
  ]
}
```

### Example key bindings

Below you can find example key bindings to start and control debugging sessions.

```lua
vim.keymap.set('n', '<F5>', function() dap.continue() end)
vim.keymap.set('n', '<F6>', function() dap.disconnect({ terminateDebuggee = true }) end)
vim.keymap.set('n', '<F10>', function() dap.step_over() end)
vim.keymap.set('n', '<F11>', function() dap.step_into() end)
vim.keymap.set('n', '<F12>', function() dap.step_out() end)
vim.keymap.set('n', '<Leader>b', function() dap.toggle_breakpoint() end)
vim.keymap.set('n', '<Leader>o', function() overseer.toggle() end)
vim.keymap.set('n', '<Leader>R', function() overseer.run_template() end)
```
```

## Debug in JetBrains IDEs | Tauri
[https://v2.tauri.app/develop/debug/rustrover/](https://v2.tauri.app/develop/debug/rustrover/)

# Debug in JetBrains IDEs

In this guide, we’ll be setting up JetBrains RustRover for debugging the Core Process of your Tauri app. It also mostly applies to IntelliJ and CLion.

## Setting up a Cargo project

Depending on which frontend stack is used in a project, the project directory may or may not be a Cargo project. By default, Tauri places the Rust project in a subdirectory called `src-tauri`. It creates a Cargo project in the root directory only if Rust is used for frontend development as well.

If there’s no `Cargo.toml` file at the top level, you need to attach the project manually. Open the Cargo tool window (in the main menu, go to **View | Tool Windows | Cargo**), click **+** ( **Attach Cargo Project**) on the toolbar, and select the `src-tauri/Cargo.toml` file.

Alternatively, you could create a top-level Cargo workspace manually by adding the following file to the project’s root directory:

```
[workspace]
members = ["src-tauri"]
```

Before you proceed, make sure that your project is fully loaded. If the Cargo tool window shows all the modules and targets of the workspace, you’re good to go.

## Setting up Run Configurations

You will need to set up two separate Run/Debug configurations:

- one for launching the Tauri app in debugging mode,
- another one for running your frontend development server of choice.

### Tauri App

1. In the main menu, go to **Run | Edit Configurations**.
2. In the **Run/Debug Configurations** dialog:

- To create a new configuration, click **+** on the toolbar and select **Cargo**.

With that created, we need to configure RustRover, so it instructs Cargo to build our app without any default features. This will tell Tauri to use your development server instead of reading assets from the disk. Normally this flag is passed by the Tauri CLI, but since we’re completely sidestepping that here, we need to pass the flag manually.

Now we can optionally rename the Run/Debug Configuration to something more memorable, in this example we called it “Run Tauri App”, but you can name it whatever you want.

### Development Server

The above configuration will use Cargo directly to build the Rust application and attach the debugger to it. This means we completely sidestep the Tauri CLI, so features like the `beforeDevCommand` and `beforeBuildCommand` will **not** be executed. We need to take care of that by running the development server manually.

To create the corresponding Run configuration, you need to check the actual development server in use. Look for the `src-tauri/tauri.conf.json` file and find the following line:

```
"beforeDevCommand": "pnpm dev"
```

For `npm`, `pnpm`, or `yarn`, you could use the **npm** Run Configuration.

Make sure you have the correct values in the **Command**, **Scripts**, and **Package Manager** fields.

If your development server is `trunk` for Rust-based WebAssembly frontend frameworks, you could use the generic **Shell Script** Run Configuration.

## Launching a Debugging Session

To launch a debugging session, you first need to run your development server, and then start debugging the Tauri App by clicking the **Debug** button next to the Run Configurations Switcher. RustRover will automatically recognize breakpoints placed in any Rust file in your project and stop on the first one hit.

From this point, you can explore the values of your variables, step further into the code, and check what’s going at runtime in detail.

