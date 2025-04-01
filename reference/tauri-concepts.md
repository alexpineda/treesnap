# Core Concepts

## Core Concepts | Tauri
[https://v2.tauri.app/concept/](https://v2.tauri.app/concept/)

# Core Concepts

Tauri has a variety of topics that are considered to be core concepts, things any developer should be aware of when developing their applications. Here’s a variety of topics that you should get more intimately familiar with if you want to get the most out of the framework.

## Tauri Architecture
Architecture and ecosystem.

## Inter-Process Communication (IPC)
The inner workings on the IPC.

## Security
How Tauri enforces security practices.

## Process Model
Which processes Tauri manages and why.

## App Size
How to make your app as small as possible.

# Inter-Process Communication

## Inter-Process Communication | Tauri
[https://v2.tauri.app/concept/inter-process-communication/](https://v2.tauri.app/concept/inter-process-communication/)

# Inter-Process Communication

Inter-Process Communication (IPC) allows isolated processes to communicate securely and is key to building more complex applications.

Tauri uses a particular style of Inter-Process Communication called Asynchronous Message Passing, where processes exchange requests and responses serialized using some simple data representation. Message Passing should sound familiar to anyone with web development experience, as this paradigm is used for client-server communication on the internet.

Message passing is a safer technique than shared memory or direct function access because the recipient is free to reject or discard requests as it sees fit. For example, if the Tauri Core process determines a request to be malicious, it simply discards the requests and never executes the corresponding function.

In the following, we explain Tauri’s two IPC primitives - `Events` and `Commands` - in more detail.

## Events

Events are fire-and-forget, one-way IPC messages that are best suited to communicate lifecycle events and state changes. Unlike Commands, Events can be emitted by both the Frontend and the Tauri Core.

## Commands

Tauri also provides a foreign function interface-like abstraction on top of IPC messages. The primary API, `invoke`, is similar to the browser’s `fetch` API and allows the Frontend to invoke Rust functions, pass arguments, and receive data.

Because this mechanism uses a JSON-RPC like protocol under the hood to serialize requests and responses, all arguments and return data must be serializable to JSON.

## Isolation Pattern | Tauri
[https://v2.tauri.app/concept/inter-process-communication/isolation/](https://v2.tauri.app/concept/inter-process-communication/isolation/)

# Isolation Pattern

The Isolation pattern is a way to intercept and modify Tauri API messages sent by the frontend before they get to Tauri Core, all with JavaScript. The secure JavaScript code that is injected by the Isolation pattern is referred to as the Isolation application.

## Why

The Isolation pattern’s purpose is to provide a mechanism for developers to help protect their application from unwanted or malicious frontend calls to Tauri Core. The need for the Isolation pattern rose out of threats coming from untrusted content running on the frontend, a common case for applications with many dependencies. 

The largest threat model that the Isolation pattern was designed with in mind was Development Threats. Many frontend build-time tools consist of numerous dependencies, and a complex application may also have a large amount of dependencies that are bundled into the final output.

## When

Tauri highly recommends using the isolation pattern whenever it can be used. Because the Isolation application intercepts all messages from the frontend, it can always be used.

Tauri also strongly suggests locking down your application whenever you use external Tauri APIs. As the developer, you can utilize the secure Isolation application to verify IPC inputs, ensuring they are within expected parameters. For example, you may want to check that a call to read or write a file is not trying to access a path outside your application’s expected locations.

## How

The Isolation pattern is about injecting a secure application in between your frontend and Tauri Core to intercept and modify incoming IPC messages. It does this by using the sandboxing feature of `<iframe>`s to run the JavaScript securely alongside the main frontend application. Tauri enforces the Isolation pattern while loading the page, routing all IPC calls to Tauri Core through the sandboxed Isolation application first. Once the message is ready to be passed to Tauri Core, it is encrypted using the browser’s SubtleCrypto implementation and passed back to the main frontend application. 

To ensure that someone cannot manually read the keys for a specific version of your application and use that to modify the messages after being encrypted, new keys are generated each time your application is run.

### Approximate Steps of an IPC Message

To make it easier to follow, here’s an ordered list with the approximate steps an IPC message will go through when being sent to Tauri Core with the Isolation pattern:

1. Tauri’s IPC handler receives a message
2. IPC handler -> Isolation application
3. Isolation application hook runs and potentially modifies the message
4. Message is encrypted with AES-GCM using a runtime-generated key
5. Isolation application -> IPC handler
6. IPC handler -> Tauri Core

### Performance Implications

Because encryption of the message occurs, there are additional overhead costs compared to the Brownfield pattern, even if the secure Isolation application doesn’t do anything. Most applications should not notice the runtime costs of encrypting/decrypting the IPC messages, as they are relatively small and AES-GCM is relatively fast. 

There is also a cryptographically secure key generated each time the Tauri application is started. It is not generally noticeable if the system already has enough entropy to immediately return enough random numbers, which is common for desktop environments.

### Limitations

There are a few limitations in the Isolation pattern that arose out of platform inconsistencies. The most significant limitation is due to external files not loading correctly inside sandboxed `<iframes>` on Windows. A simple script inlining step during build time takes the content of scripts relative to the Isolation application and injects them inline.

## Recommendations

Because the point of the Isolation application is to protect against Development Threats, we highly recommend keeping your Isolation application as simple as possible. Strive to keep dependencies minimal and consider keeping required build steps minimal to avoid supply chain attacks.

## Creating the Isolation Application

In this example, we will make a small hello-world style Isolation application and hook it up to an existing Tauri application. It will do no verification of the messages passing through it, only print the contents to the WebView console.

For the purposes of this example, let’s imagine we are in the same directory as `tauri.conf.json`. The existing Tauri application has its `distDir` set to `../dist`.

`../dist-isolation/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Isolation Secure Script</title>
  </head>
  <body>
    <script src="index.js"></script>
  </body>
</html>
```

`../dist-isolation/index.js`:

```javascript
window.__TAURI_ISOLATION_HOOK__ = (payload) => {
  console.log('hook', payload);
  return payload;
};
```

Now, all we need to do is set up our `tauri.conf.json` configuration to use the Isolation pattern.

## Configuration

Let’s assume that our main frontend `distDir` is set to `../dist`. We also output our Isolation application to `../dist-isolation`.

```json
{
  "build": {
    "distDir": "../dist"
  },
  "app": {
    "security": {
      "pattern": {
        "use": "isolation",
        "options": {
          "dir": "../dist-isolation"
        }
      }
    }
  }
}
```

## Brownfield Pattern | Tauri
[https://v2.tauri.app/concept/inter-process-communication/brownfield/](https://v2.tauri.app/concept/inter-process-communication/brownfield/)

# Brownfield Pattern

**This is the default pattern.**

This is the simplest and most straightforward pattern to use Tauri with, because it tries to be as compatible as possible with existing frontend projects. In short, it tries to require nothing additional to what an existing web frontend might use inside a browser. Not **everything** that works in existing browser applications will work out-of-the-box.

If you are unfamiliar with Brownfield software development in general, the Brownfield Wikipedia article provides a nice summary. For Tauri, the existing software is current browser support and behavior, instead of legacy systems.

## Configuration

Because the Brownfield pattern is the default pattern, it doesn’t require a configuration option to be set. To explicitly set it, you can use the `tauri > pattern` object in the `tauri.conf.json` configuration file.

```
{
  "tauri": {
    "pattern": {
      "use": "brownfield"
    }
  }
}
```

**There are no additional configuration options for the brownfield pattern.**

# Process Model

## Process Model | Tauri
[https://v2.tauri.app/concept/process-model/](https://v2.tauri.app/concept/process-model/)

# Process Model

Tauri employs a multi-process architecture similar to Electron or many modern web browsers. This guide explores the reasons behind the design choice and why it is key to writing secure applications.

## Why Multiple Processes?

In the early days of GUI applications, it was common to use a single process to perform computation, draw the interface and react to user input. This meant that a long-running, expensive computation would leave the user interface unresponsive, or worse, a failure in one app component would bring the whole app crashing down.

It became clear that a more resilient architecture was needed, and applications began running different components in different processes. This makes much better use of modern multi-core CPUs and creates far safer applications. A crash in one component doesn’t affect the whole system anymore, as components are isolated on different processes. If a process gets into an invalid state, we can easily restart it.

We can also limit the blast radius of potential exploits by handing out only the minimum amount of permissions to each process, just enough so they can get their job done. This pattern is known as the Principle of Least Privilege. The less access we give to computer programs, the less harm they can do if they get compromised.

## The Core Process

Each Tauri application has a core process, which acts as the application’s entry point and is the only component with full access to the operating system.

The Core’s primary responsibility is to use that access to create and orchestrate application windows, system-tray menus, or notifications. Tauri implements the necessary cross-platform abstractions to make this easy. It also routes all Inter-Process Communication (IPC) through the Core process, allowing you to intercept, filter, and manipulate IPC messages in one central place.

The Core process should also be responsible for managing global state, such as settings or database connections. This allows you to easily synchronize state between windows and protect your business-sensitive data from prying eyes in the Frontend.

We chose Rust to implement Tauri because of its concept of Ownership, which guarantees memory safety while retaining excellent performance.

## The WebView Process

The Core process doesn’t render the actual user interface (UI) itself; it spins up WebView processes that leverage WebView libraries provided by the operating system. A WebView is a browser-like environment that executes your HTML, CSS, and JavaScript.

This means that most of your techniques and tools used in traditional web development can be used to create Tauri applications. For example, many Tauri examples are written using the Svelte frontend framework and the Vite bundler.

Security best practices apply as well; for example, you must always sanitize user input, never handle secrets in the Frontend, and ideally defer as much business logic as possible to the Core process to keep your attack surface small.

Unlike other similar solutions, the WebView libraries are not included in your final executable but dynamically linked at runtime. This makes your application significantly smaller, but it also means that you need to keep platform differences in mind, just like traditional web development.

# Architecture

## Tauri Architecture | Tauri
[https://v2.tauri.app/concept/architecture/](https://v2.tauri.app/concept/architecture/)

# Tauri Architecture

## Introduction

Tauri is a polyglot and generic toolkit that is very composable and allows engineers to make a wide variety of applications. It is used for building applications for desktop computers using a combination of Rust tools and HTML rendered in a Webview. Apps built with Tauri can ship with any number of pieces of an optional JS API and Rust API so that webviews can control the system via message passing. Developers can extend the default API with their own functionality and bridge the Webview and Rust-based backend easily.

Tauri apps can have tray-type interfaces. They can be updated and are managed by the user’s operating system as expected. They are very small because they use the OS’s webview. They do not ship a runtime since the final binary is compiled from Rust. This makes the reversing of Tauri apps not a trivial task.

### What Tauri is Not

Tauri is not a lightweight kernel wrapper. Instead, it directly uses WRY and TAO to do the heavy lifting in making system calls to the OS.

Tauri is not a VM or virtualized environment. Instead, it is an application toolkit that allows making Webview OS applications.

## Core Ecosystem

Simplified representation of the Tauri architecture.

### tauri

This is the major crate that holds everything together. It brings the runtimes, macros, utilities, and API into one final product. It reads the `tauri.conf.json` file at compile time to bring in features and undertake the actual configuration of the app (and even the `Cargo.toml` file in the project’s folder). It handles script injection (for polyfills / prototype revision) at runtime, hosts the API for systems interaction, and even manages the updating process.

### tauri-runtime

The glue layer between Tauri itself and lower-level webview libraries.

### tauri-macros

Creates macros for the context, handler, and commands by leveraging the `tauri-codegen` crate.

### tauri-utils

Common code that is reused in many places and offers useful utilities like parsing configuration files, detecting platform triples, injecting the CSP, and managing assets.

### tauri-build

Applies the macros at build-time to rig some special features needed by `cargo`.

### tauri-codegen

Embeds, hashes, and compresses assets, including icons for the app as well as the system tray. Parses `tauri.conf.json` at compile time and generates the Config struct.

### tauri-runtime-wry

This crate opens up direct systems-level interactions specifically for WRY, such as printing, monitor detection, and other windowing-related tasks.

## Tauri Tooling

### API (JavaScript / TypeScript)

A typescript library that creates `cjs` and `esm` JavaScript endpoints for you to import into your frontend framework so that the Webview can call and listen to backend activity. Also ships in pure typescript, because for some frameworks this is more optimal. It uses the message passing of webviews to their hosts.

### Bundler (Rust / Shell)

A library that builds a Tauri app for the platform it detects or is told. Currently supports macOS, Windows, and Linux - but in the near future will support mobile platforms as well. May be used outside of Tauri projects.

### cli.rs (Rust)

This Rust executable provides the full interface to all of the required activities for which the CLI is required. It runs on macOS, Windows, and Linux.

### cli.js (JavaScript)

Wrapper around `cli.rs` using `napi-rs` to produce npm packages for each platform.

### create-tauri-app (JavaScript)

A toolkit that will enable engineering teams to rapidly scaffold out a new `tauri-apps` project using the frontend framework of their choice (as long as it has been configured).

## Upstream Crates

The Tauri-Apps organization maintains two “upstream” crates from Tauri, namely TAO for creating and managing application windows, and WRY for interfacing with the Webview that lives within the window.

### TAO

Cross-platform application window creation library in Rust that supports all major platforms like Windows, macOS, Linux, iOS, and Android. Written in Rust, it is a fork of winit that we have extended for our own needs - like menu bar and system tray.

### WRY

WRY is a cross-platform WebView rendering library in Rust that supports all major desktop platforms like Windows, macOS, and Linux. Tauri uses WRY as the abstract layer responsible to determine which webview is used (and how interactions are made).

## Additional Tooling

### tauri-action

GitHub workflow that builds Tauri binaries for all platforms. Even allows creating a (very basic) Tauri app even if Tauri is not set up.

### tauri-vscode

This project enhances the Visual Studio Code interface with several nice-to-have features.

### vue-cli-plugin-tauri

Allows you to very quickly install Tauri in a vue-cli project.

## Plugins

Generally speaking, plugins are authored by third parties (even though there may be official, supported plugins). A plugin generally does 3 things:

1. Enables Rust code to do “something”.
2. Provides interface glue to make it easy to integrate into an app.
3. Provides a JavaScript API for interfacing with the Rust code.

Here are some examples of Tauri Plugins:

- tauri-plugin-fs
- tauri-plugin-sql
- tauri-plugin-stronghold

## License

Tauri itself is licensed under MIT or Apache-2.0. If you repackage it and modify any source code, it is your responsibility to verify that you are complying with all upstream licenses. Tauri is provided AS-IS with no explicit claim for suitability for any purpose.

# App Size

## App Size | Tauri
[https://v2.tauri.app/concept/size/](https://v2.tauri.app/concept/size/)

# App Size

While Tauri by default provides very small binaries, it doesn’t hurt to push the limits a bit. Here are some tips and tricks for reaching optimal results.

## Cargo Configuration

One of the simplest frontend agnostic size improvements you can do to your project is adding a Cargo profile to it.

Dependent on whether you use the stable or nightly Rust toolchain, the options available to you differ a bit. It’s recommended you stick to the stable toolchain unless you’re an advanced user.

### Stable Configuration

```
[profile.dev]
incremental = true # Compile your binary in smaller steps.

[profile.release]
codegen-units = 1 # Allows LLVM to perform better optimization.
lto = true # Enables link-time-optimizations.
opt-level = "s" # Prioritizes small binary size. Use `3` if you prefer speed.
panic = "abort" # Higher performance by disabling panic handlers.
strip = true # Ensures debug symbols are removed.
```

### Nightly Configuration

```
[profile.dev]
incremental = true # Compile your binary in smaller steps.
rustflags = ["-Zthreads=8"] # Better compile performance.

[profile.release]
codegen-units = 1 # Allows LLVM to perform better optimization.
lto = true # Enables link-time-optimizations.
opt-level = "s" # Prioritizes small binary size. Use `3` if you prefer speed.
panic = "abort" # Higher performance by disabling panic handlers.
strip = true # Ensures debug symbols are removed.
trim-paths = "all" # Removes potentially privileged information from your binaries.
rustflags = ["-Cdebuginfo=0", "-Zthreads=8"] # Better compile performance.
```

## Remove Unused Commands

In a recent update, a new option was added in the Tauri config file to remove commands that are never allowed in your capability files (ACL), so you don’t have to pay for what you don’t use.

```
{
  "build": {
    "removeUnusedCommands": true
  }
}
```

How does it work under the hood? `tauri-cli` will communicate with `tauri-build` and the build script of `tauri`, `tauri-plugin` through an environment variable and let them generate a list of allowed commands from the ACL. This will then be used by the `generate_handler` macro to remove unused commands based on that.

An internal detail is that this environment variable is currently `REMOVE_UNUSED_COMMANDS`, and it’s set to the project’s directory, usually the `src-tauri` directory. This is used for the build scripts to find the capability files. Although it’s not encouraged, you can still set this environment variable yourself if you can’t or don’t want to use `tauri-cli` to get this to work. 

**Note:** As this is an implementation detail, we don’t guarantee the stability of it.

