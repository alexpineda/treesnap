# General Security

## Security | Tauri
[https://v2.tauri.app/security/](https://v2.tauri.app/security/)

# Security

This page is designed to explain the high-level concepts and security features at the core of Tauri’s design and ecosystem that make you, your applications, and your users more secure by default. It also includes advice on best practices, how to report vulnerabilities, and references to detailed concept explanations.

## Trust Boundaries

Trust boundary is a term used in computer science and security which describes a boundary where program data or execution changes its level of “trust,” or where two principals with different capabilities exchange data or commands.

Tauri’s security model differentiates between Rust code written for the application’s core and frontend code written in any framework or language understood by the system WebView.

Inspecting and strongly defining all data passed between boundaries is very important to prevent trust boundary violations. If data is passed without access control between these boundaries, then it’s easy for attackers to elevate and abuse privileges.

The IPC layer is the bridge for communication between these two trust groups and ensures that boundaries are not broken.

Any code executed by the plugins or the application core has full access to all available system resources and is not constrained. Any code executed in the WebView has only access to exposed system resources via the well-defined IPC layer. Access to core application commands is configured and restricted by capabilities defined in the application configuration. The individual command implementations enforce the optional fine-grained access levels also defined in the capabilities configuration.

Learn more about the individual components and boundary enforcement:

- Permissions
- Scopes
- Capabilities
- Runtime Authority

Tauri allows developers to choose their own frontend stack and framework. This means that we cannot provide a hardening guide for every frontend stack of choice, but Tauri provides generic features to control and contain the attack surface.

- Content Security Policy (CSP)
- Isolation Pattern

## (Not) Bundling WebViews

Tauri’s approach is to rely on the operating system WebView and not bundling the WebView into the application binary. This has a multitude of reasons, but from a security perspective, the most important reason is the average time it takes from publication of a security patched version of a WebView to being rolled out to the application end user.

We have observed that WebView packet maintainers and operating system packet maintainers are, on average, significantly faster to patch and roll out security patched WebView releases than application developers who bundle the WebView directly with their application.

There are exceptions from this observation, and in theory, both paths can be taken in a similar time frame, but this involves a larger overhead infrastructure for each application. Bundling has its drawbacks from a Tauri application developer experience, and we do not think it is inherently insecure, but the current design is a trade-off that significantly reduces known vulnerabilities in the wild.

## Ecosystem

The Tauri organization provides and maintains more than just the Tauri repository, and to ensure we provide a reasonably secure multi-platform application framework, we make sure to go some extra miles.

To learn more about how we secure our development process, what you could adapt and implement, what known threats your application can face, and what we plan to improve or harden in the future, you can check out the following documents:

- Ecosystem Security
- Application Lifecycle Threats
- Future Work

## Coordinated Disclosure

If you feel that there is a security concern or issue with anything in Tauri or other repositories in our organization, please do not publicly comment on your findings. Instead, reach out directly to our security team.

The preferred disclosure method is via GitHub Vulnerability Disclosure on the affected repository. Most of our repositories have this feature enabled, but if in doubt, please submit via the Tauri repository.

Alternatively, you can contact us via email at: security@tauri.app.

Although we do not currently have a budget for security bounties, in some cases, we will consider rewarding coordinated disclosure with our limited resources.

# Ecosystem Security

## Tauri Ecosystem Security | Tauri
[https://v2.tauri.app/security/ecosystem/](https://v2.tauri.app/security/ecosystem/)

# Tauri Ecosystem Security

Our Tauri organization ecosystem is hosted on GitHub and facilitates several features to make our repositories more resilient against adversaries targeting our source code and releases.

To reduce risk and to comply with commonly adopted best practices we have the following methods in place.

### Build Pipelines

The process of releasing our source-code artifacts is highly automated in GitHub build pipelines using GitHub actions, yet mandates kickoff and review from real humans.

### Signed Commits

Our core repositories require signed commits to reduce risk of impersonation and to allow identification of attributed commits after detection of possible compromise.

### Code Review

All Pull Requests (PRs) merged into our repositories need approval from at least one maintainer of the project, which in most cases is the working group. Code is generally reviewed in PRs and default security workflows and checks are run to ensure the code adheres to common standards.

### Release Process

Our working group reviews code changes, tags PRs with scope, and makes sure that everything stays up to date. We strive to internally audit all security relevant PRs before publishing minor and major releases.

When it's time to publish a new version, one of the maintainers tags a new release on dev, which:

- Validates core
- Runs tests
- Audits security for crates and npm
- Generates changelogs
- Creates artifacts
- Creates a draft release

Then the maintainer reviews the release notes, edits if necessary, and a new release is forged.

# Command Scopes

## Command Scopes | Tauri
[https://v2.tauri.app/security/scope/](https://v2.tauri.app/security/scope/)

# Command Scopes

A scope is a granular way to define (dis)allowed behavior of a Tauri command.

Scopes are categorized into `allow` or `deny` scopes, where `deny` always supersedes the `allow` scope.

The scope type needs to be of any serializable type. These types are plugin-specific in general. For scoped commands implemented in a Tauri application, the scope type needs to be defined in the application and then enforced in the command implementation.

For instance, the `Fs` plugin allows you to use scopes to allow or deny certain directories and files, and the `http` plugin uses scopes to filter URLs that are allowed to be reached.

The scope is passed to the command, and handling or properly enforcing is implemented by the command itself.

## Examples

These examples are taken from the `Fs` plugin permissions:

The scope type in this plugin for all commands is a string, which contains a glob compatible path.

```
[[permission]]
identifier = "scope-applocaldata-recursive"
description = '''
This scope recursive access to the complete `$APPLOCALDATA` folder,
including sub directories and files.
'''
[[permission.scope.allow]]
path = "$APPLOCALDATA/**"
```

```
[[permission]]
identifier = "deny-webview-data-linux"
description = '''
This denies read access to the
`$APPLOCALDATA` folder on linux as the webview data and
configuration values are stored here.
Allowing access can lead to sensitive information disclosure and
should be well considered.
'''
platforms = ["linux"]
[[scope.deny]]
path = "$APPLOCALDATA/**"

[[permission]]
identifier = "deny-webview-data-windows"
description = '''
This denies read access to the
`$APPLOCALDATA/EBWebView` folder on windows as the webview data and
configuration values are stored here.
Allowing access can lead to sensitive information disclosure and
should be well considered.
'''
platforms = ["windows"]
[[scope.deny]]
path = "$APPLOCALDATA/EBWebView/**"
```

The above scopes can be used to allow access to the `APPLOCALDATA` folder while preventing access to the `EBWebView` subfolder on windows, which contains sensitive webview data.

These can be merged into a set, which reduces duplicate configuration and makes it more understandable for anyone looking into the application configuration.

First, the deny scopes are merged into `deny-default`:

```
[[set]]
identifier = "deny-default"
description = '''
This denies access to dangerous Tauri relevant files and
folders by default.
'''
permissions = ["deny-webview-data-linux", "deny-webview-data-windows"]
```

Afterwards, deny and allow scopes are merged:

```
[[set]]
identifier = "scope-applocaldata-reasonable"
description = '''
This scope set allows access to the `APPLOCALDATA` folder and
subfolders except for linux,
while it denies access to dangerous Tauri relevant files and
folders by default on windows.
'''
permissions = ["scope-applocaldata-recursive", "deny-default"]
```

These scopes can be either used for all commands, by extending the global scope of the plugin, or for only selected commands when they are used in combination with an enabled command inside a permission.

Reasonable read-only file access to files in the `APPLOCALDATA` could look like this:

```
[[set]]
identifier = "read-files-applocaldata"
description = '''
This set allows file read access to the `APPLOCALDATA` folder and
subfolders except for linux,
while it denies access to dangerous Tauri relevant files and
folders by default on windows.'''
permissions = ["scope-applocaldata-reasonable", "allow-read-file"]
```

These examples only highlight the scope functionality itself. Each plugin or application developer needs to consider reasonable combinations of scope depending on their use cases.

# Capabilities

## Capabilities | Tauri
[https://v2.tauri.app/security/capabilities/](https://v2.tauri.app/security/capabilities/)

# Capabilities

Tauri provides application and plugin developers with a capabilities system to granually enable and constrain the core exposure to the application frontend running in the system WebView.

Capabilities are a set of permissions mapped to application windows and webviews by their respective label. Capabilities can affect multiple windows and webviews and these can be referenced in multiple capabilities.

Capability files are either defined as a JSON or a TOML file inside the `src-tauri/capabilities` directory.

It is good practice to use individual files and only reference them by identifier in the `tauri.conf.json`, but it is also possible to define them directly in the `capabilities` field.

All capabilities inside the `capabilities` directory are automatically enabled by default. Once capabilities are explicitly enabled in the `tauri.conf.json`, only these are used in the application build.

The following example JSON defines a capability that enables default functionality for core plugins and the `window.setTitle` API.

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:path:default",
    "core:event:default",
    "core:window:default",
    "core:app:default",
    "core:resources:default",
    "core:menu:default",
    "core:tray:default",
    "core:window:allow-set-title"
  ]
}
```

This is likely the most common configuration method, where the individual capabilities are inlined and only permissions are referenced by identifier.

```json
{
  "app": {
    "security": {
      "capabilities": ["my-capability", "main-capability"]
    }
  }
}
```

Inline capabilities can be mixed with pre-defined capabilities.

```json
{
  "app": {
    "security": {
      "capabilities": [
        {
          "identifier": "my-capability",
          "description": "My application capability used for all windows",
          "windows": ["*"],
          "permissions": ["fs:default", "allow-home-read-extended"]
        },
        "my-second-capability"
      ]
    }
  }
}
```

By default, all commands that you registered in your app are allowed to be used by all the windows and webviews of the app. To change that, consider using `AppManifest::commands`.

```rust
fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&["your_command"])),
    )
    .unwrap();
}
```

Capabilities can be platform-specific by defining the `platforms` array. By default, the capability is applied to all targets, but you can select a subset of the `linux`, `macOS`, `windows`, `iOS`, and `android` targets.

For example, a capability for desktop operating systems:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "desktop-capability",
  "windows": ["main"],
  "platforms": ["linux", "macOS", "windows"],
  "permissions": ["global-shortcut:allow-register"]
}
```

And another example of a capability for mobile:

```json
{
  "$schema": "../gen/schemas/mobile-schema.json",
  "identifier": "mobile-capability",
  "windows": ["main"],
  "platforms": ["iOS", "android"],
  "permissions": [
    "nfc:allow-scan",
    "biometric:allow-authenticate",
    "barcode-scanner:allow-scan"
  ]
}
```

By default, the API is only accessible to bundled code shipped with the Tauri App. To allow remote sources access to certain Tauri Commands, it is possible to define this in the capability configuration file.

This example would allow scanning for NFC tags and using the barcode scanner from all subdomains of `tauri.app`.

```json
{
  "$schema": "../gen/schemas/remote-schema.json",
  "identifier": "remote-tag-capability",
  "windows": ["main"],
  "remote": {
    "urls": ["https://*.tauri.app"]
  },
  "platforms": ["iOS", "android"],
  "permissions": ["nfc:allow-scan", "barcode-scanner:allow-scan"]
}
```

Depending on the permissions and capabilities, it is able to:

- Minimize impact of frontend compromise
- Prevent or reduce (accidental) exposure of local system interfaces and data
- Prevent or reduce possible privilege escalation from frontend to backend/system

What it does **not** protect against:

- Malicious or insecure Rust code
- Too lax scopes and configuration
- Incorrect scope checks in the command implementation
- Intentional bypasses from Rust code
- Anything which was written in the rust core of an application
- 0-days or unpatched 1-days in the system WebView
- Supply chain attacks or otherwise compromised developer systems

Tauri generates JSON schemas with all the permissions available to your application, allowing autocompletion in your IDE. To use a schema, set the `$schema` property in your configuration to one of the platform-specific schemas located in the `gen/schemas` directory.

Simplified example of a Tauri application directory structure:

```
tauri-app
├── index.html
├── package.json
├── src
├── src-tauri
│   ├── Cargo.toml
│   ├── capabilities
│      └── <identifier>.json/toml
│   ├── src
│   ├── tauri.conf.json
```

Everything can be inlined into the `tauri.conf.json`, but even a little more advanced configuration would bloat this file, and the goal of this approach is that the permissions are abstracted away whenever possible and simple to understand.

A list of all core permissions can be found on the Core Permissions page.

# Permissions

## Permissions | Tauri
[https://v2.tauri.app/security/permissions/](https://v2.tauri.app/security/permissions/)

# Permissions

Permissions are descriptions of explicit privileges of commands.

```
[[permission]]
identifier = "my-identifier"
description = "This describes the impact and more."
commands.allow = ["read_file"]

[[scope.allow]]
my-scope = "$HOME/*"

[[scope.deny]]
my-scope = "$HOME/secret"
```

It can enable commands to be accessible in the frontend of a Tauri application. It can map scopes to commands and defines which commands are enabled. Permissions can enable or deny certain commands, define scopes or combine both.

Permissions can be grouped as a set under a new identifier. This is called a permission set. This allows you to combine scope related permissions with command related permissions. It also allows to group or bundle operating specific permissions into more usable sets.

As a plugin developer you can ship multiple, pre-defined, well named permissions for all of your exposed commands. As an application developer you can extend existing plugin permissions or define them for your own commands. They can be grouped or extended in a set to be re-used or to simplify the main configuration files later.

## Permission Identifier

The permissions identifier is used to ensure that permissions can be re-used and have unique names.

- `<name>:default` Indicates the permission is the default for a plugin or application
- `<name>:<command-name>` Indicates the permission is for an individual command

The plugin prefix `tauri-plugin-` will be automatically prepended to the identifier of plugins at compile time and is not required to be manually specified.

Identifiers are limited to ASCII lower case alphabetic characters `[a-z]` and the maximum length of the identifier is currently limited to `116` due to the following constants:

```
const IDENTIFIER_SEPARATOR: u8 = b':';
const PLUGIN_PREFIX: &str = "tauri-plugin-";
const MAX_LEN_PREFIX: usize = 64 - PLUGIN_PREFIX.len();
const MAX_LEN_BASE: usize = 64;
const MAX_LEN_IDENTIFIER: usize = MAX_LEN_PREFIX + 1 + MAX_LEN_BASE;
```

## Configuration Files

Simplified example of an example Tauri **plugin** directory structure:

```
tauri-plugin
├── README.md
├── src
│  └── lib.rs
├── build.rs
├── Cargo.toml
├── permissions
│  └── <identifier>.json/toml
│  └── default.json/toml
```

The default permission is handled in a special way, as it is automatically added to the application configuration, as long as the Tauri CLI is used to add plugins to a Tauri application.

For **application** developers the structure is similar:

```
tauri-app
├── index.html
├── package.json
├── src
├── src-tauri
│   ├── Cargo.toml
│   ├── permissions
│      └── <identifier>.toml
│   ├── capabilities
│      └── <identifier>.json/.toml
│   ├── src
│   ├── tauri.conf.json
```

## Examples

Example permissions from the `File System` plugin.

```
[[permission]]
identifier = "scope-home"
description = """This scope permits access to all files and
list content of top level directories in the `$HOME` folder."""
[[scope.allow]]
path = "$HOME/*"
```

```
[[permission]]
identifier = "read-files"
description = """This enables all file read related
commands without any pre-configured accessible paths."""
commands.allow = [
    "read_file",
    "read",
    "open",
    "read_text_file",
    "read_text_file_lines",
    "read_text_file_lines_next"
]
```

```
[[permission]]
identifier = "allow-mkdir"
description = "This enables the mkdir command."
commands.allow = ["mkdir"]
```

Example implementation extending above plugin permissions in your app:

```
[[set]]
identifier = "allow-home-read-extended"
description = """ This allows non-recursive read access to files and to create directories
in the `$HOME` folder."""
permissions = [
    "fs:read-files",
    "fs:scope-home",
    "fs:allow-mkdir"
]
```

# Content Security Policy

## Content Security Policy (CSP) | Tauri
[https://v2.tauri.app/security/csp/](https://v2.tauri.app/security/csp/)

# Content Security Policy (CSP)

Tauri restricts the Content Security Policy (CSP) of your HTML pages. This can be used to reduce or prevent the impact of common web-based vulnerabilities like cross-site scripting (XSS).

Local scripts are hashed, styles and external scripts are referenced using a cryptographic nonce, which prevents unallowed content from being loaded.

The CSP protection is only enabled if set in the Tauri configuration file. You should make it as restricted as possible, only allowing the webview to load assets from hosts you trust, and preferably own. At compile time, Tauri appends its nonces and hashes to the relevant CSP attributes automatically to bundled code and assets, so you only need to worry about what is unique to your application.

This is an example CSP configuration:

```json
"csp": {
    "default-src": "'self' customprotocol: asset:",
    "connect-src": "ipc: http://ipc.localhost",
    "font-src": ["https://fonts.gstatic.com"],
    "img-src": "'self' asset: http://asset.localhost blob: data:",
    "style-src": "'unsafe-inline' 'self' https://fonts.googleapis.com"
},
```

For more information about this protection, refer to the documentation on `script-src`, `style-src`, and CSP Sources.

# Future Work

## Future Work | Tauri
[https://v2.tauri.app/security/future/](https://v2.tauri.app/security/future/)

# Future Work

This section describes topics we started or would like to tackle in the future to make Tauri apps even more secure. If you feel interested in these topics or have pre-existing knowledge, we are always happy to welcome new contributors and advice.

### Binary Analysis

To allow pentesters, auditors, and automated security checks to do their job properly, it is very valuable to provide insight even from compiled binaries. Not all companies are open source or provide source code for audits, red-teams, and other security testing.

Another often overlooked point is that providing inbuilt metadata empowers users of your application to audit their systems for known vulnerabilities at scale without dedicating their lifetime and efforts into it.

If your threat model depends on security by obscurity, this section will be providing some tools and points which hopefully will make you reconsider.

For Rust, there is `cargo-auditable` to create Software Bill of Materials (SBOMs) and provide exact crate versions and dependencies of a binary without breaking reproducible builds.

For the frontend stack, we are not aware of similar solutions, so extracting the frontend assets from the binary should be a straightforward process. Afterwards, it should be possible to use tooling like `npm audit` or similar. There are already blog posts about the process, but no simple tooling is available.

We are planning to provide such tooling or make it easier to extract assets when compiling a Tauri app with certain features.

To use pentesting tools like Burpsuite, Zap, or Caido, it is necessary to intercept traffic from the webview and pass it through the testing proxy. Currently, Tauri has no inbuilt method to do so, but there is ongoing work to ease this process.

All of these tools allow proper testing and inspection of Tauri applications without source code access and should be considered when building a Tauri application. We are planning to further support and implement related features in the future.

### WebView Hardening

In Tauri’s current threat model and boundaries, we are not able to add more security constraints to the WebView itself. Since it is the biggest part of our stack, which is written in a memory unsafe language, we are planning to research and consider ways to further sandbox and isolate the webview processes.

Inbuilt and external sandboxing methods will be evaluated to reduce attack impact and to enforce the IPC bridge for system access. We believe that this part of our stack is the weak link, but current generation WebViews are improving in their hardening and exploit resilience.

### Fuzzing

To allow more efficient and simplify the process of fuzzing Tauri applications, we aim to further implement our mock runtimes and other tooling to make it easier to configure and build for individual Tauri applications.

Tauri supports a multitude of Operating Systems and CPU architectures; usually, apps have only a few or no possible memory unsafe code. No pre-existing fuzzing tooling and libraries support these uncommon fuzzing use cases, so we need to implement it and support existing libraries like libAFL to build Tauri fuzzing frameworks.

The goal is to make fuzzing accessible and efficient for Tauri application developers.

# Application Lifecycle Threats

## Application Lifecycle Threats | Tauri
[https://v2.tauri.app/security/lifecycle/](https://v2.tauri.app/security/lifecycle/)

# Application Lifecycle Threats

Tauri applications are composed of many pieces at different points in time of the application lifecycle. Here we describe classical threats and what you SHOULD do about them.

## Upstream Threats

Tauri is a direct dependency on your project, and we maintain strict authorial control of commits, reviews, pull requests, and releases. We do our best to maintain up-to-date dependencies and take action to either update or fork and fix. Other projects may not be so well maintained, and may not even have ever been audited.

Please consider their health when integrating them, otherwise, you may have adopted architectural debt without even knowing it.

### Keep Your Applications Up-To-Date

When releasing your app into the wild, you are also shipping a bundle that has Tauri in it. Vulnerabilities affecting Tauri may impact the security of your application. By updating Tauri to the latest version, you ensure that critical vulnerabilities are already patched and cannot be exploited in your application. Also be sure to keep your compiler (`rustc`) and transpilers (`nodejs`) up to date, because there are often security issues that are resolved. This also is true for your development system in general.

### Evaluate Your Dependencies

While NPM and Crates.io provide many convenient packages, it is your responsibility to choose trustworthy third-party libraries - or rewrite them in Rust. If you do use outdated libraries which are affected by known vulnerabilities or are unmaintained, your application security and good night’s sleep could be in jeopardy.

Use tooling like `npm audit` and `cargo audit` to automate this process, and lean on the security community’s important work.

Recent trends in the rust ecosystem like `cargo-vet` or `cargo crev` can help to further reduce likelihood of supply chain attacks. To find out on whose shoulders you stand, you can use the `cargo supply chain` tool.

One practice that we highly recommend is to only ever consume critical dependencies from git using hash revisions at best or named tags as second best. This holds for Rust as well as the Node ecosystem.

## Development Threats

We assume that you, the developer, care for your development environment. It is on you to make sure that your operating system, build toolchains, and associated dependencies are kept up to date and reasonably secured.

A genuine risk all of us face is what is known as “supply-chain attacks”, which are usually considered to be attacks on direct dependencies of your project. However, a growing class of attacks in the wild directly target development machines, and you would be well off to address this head-on.

### Development Server

Tauri application frontends can be developed using a number of web frameworks. Each of these frameworks usually ship their own development server, which is exposing the frontend assets via an open port to the local system or network. This allows the frontend to be hot-reloaded and debugged in the WebView or Browser.

In practice, this connection is often neither encrypted nor authenticated by default. This is also the case for the built-in Tauri development server and exposes your frontend and assets to the local network. Additionally, this allows attackers to push their own frontend code to development devices in the same network as the attacker. Depending on what kind of functionality is exposed this could lead to device compromise in the worst case.

You should only develop on trusted networks where you can safely expose your development device. If this is not possible you MUST ensure that your development server uses **mutual** authentication and encryption (e.g. mTLS) for connections with your development devices.

### Harden Development Machines

Hardening your development systems depends on various factors and on your personal threat model but some generic advice we recommend to follow:

- Never use administrative accounts for day-to-day tasks like coding
- Never use production secrets on development machines
- Prevent secrets from being checked into source code version control
- Use security hardware tokens or similar to reduce the impact of compromised systems
- Keep your system up to date
- Keep your installed applications to a minimum

A more practical collection of procedures can be found in an awesome security hardening collection.

You can of course virtualize your development environment to keep attackers at bay, but this won’t protect you from attacks that target your project rather than just your machine.

### Ensure Source Control Authentication and Authorization

If you are working like the majority of developers, using source code version control tools and service providers is an essential step during development.

To ensure that your source code cannot be modified by unauthorized actors it is important to understand and correctly set up access control for your source code version control system.

Also, consider requiring all (regular) contributors to sign their commits to prevent situations where malicious commits are attributed to non-compromised or non-malicious contributors.

## Buildtime Threats

Modern organizations use CI/CD to manufacture binary artifacts.

You need to be able to fully trust these remote (and third-party owned) systems, as they have access to source code, secrets and are able to modify builds without you being able to verifiably prove that the produced binaries are the same as your local code. This means either you trust a reputable provider or host these systems on your own and controlled hardware.

At Tauri, we provide a GitHub Workflow for building on multiple platforms. If you create your own CI/CD and depend on third-party tooling, be wary of actions whose versions you have not explicitly pinned.

You should sign your binaries for the platform you are shipping to. While this can be complicated and somewhat costly to set up, end users expect that your app is verifiably from you.

If cryptographic secrets are properly stored on hardware tokens, a compromised build system won’t be able to leak involved signing keys, but could use them to sign malicious releases.

### Reproducible Builds

To combat backdoor injection at build time, you need your builds to be reproducible, so that you can verify that the build assets are exactly the same when you build them locally or on another independent provider.

The first problem is that Rust is by default not fully reliably producing reproducible builds. It supports this in theory, but there are still bugs, and it recently broke on a release.

The next problem you will encounter is that many common frontend bundlers do not produce reproducible output either, so the bundled assets may also break reproducible builds.

This means that you cannot fully rely on reproducible builds by default, and sadly need to fully trust your build systems.

## Distribution Threats

We have done our best to make shipping hot updates to the app as straightforward and secure as possible. However, all bets are off if you lose control of the manifest server, the build server, or the binary hosting service.

If you build your own system, consult a professional OPS architect and build it properly.

## Runtime Threats

We assume the webview is insecure, which has led Tauri to implement several protections regarding webview access to system APIs in the context of loading untrusted userland content.

Using the Content Security Policy will lockdown types of communication that the Webview can undertake. Furthermore, Capabilities can prevent untrusted content or scripts from accessing the API within the Webview.

We also recommend setting up an easy and secure way to report vulnerabilities.

# HTTP Headers

## HTTP Headers | Tauri
[https://v2.tauri.app/security/http-headers/](https://v2.tauri.app/security/http-headers/)

# HTTP Headers

A header defined in the configuration gets sent along the responses to the webview. This doesn’t include IPC messages and error responses. To be more specific, every response sent via the `get_response` function will include those headers.

### Header Names

The header names are limited to:

- Access-Control-Allow-Credentials
- Access-Control-Allow-Headers
- Access-Control-Allow-Methods
- Access-Control-Expose-Headers
- Access-Control-Max-Age
- Cross-Origin-Embedder-Policy
- Cross-Origin-Opener-Policy
- Cross-Origin-Resource-Policy
- Permissions-Policy
- Timing-Allow-Origin
- X-Content-Type-Options
- Tauri-Custom-Header

### How to Configure Headers

- with a string
- with an Array of strings
- with an Object/Key-Value, where the values must be strings
- with null

The header values are always converted to strings for the actual response. Depending on how the configuration file looks, some header values need to be composed. Those are the rules on how a composite gets created:

- `string`: stays the same for the resulting header value
- `Array`: items are joined by `, ` for the resulting header value
- `key-value`: items are composed from: key + space + value. Items are then joined by `; ` for the resulting header value
- `null`: header will be ignored

### Example

```json
{
  "app": {
    "security": {
      "headers": {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Timing-Allow-Origin": [
          "https://developer.mozilla.org",
          "https://example.com"
        ],
        "X-Content-Type-Options": null,
        "Access-Control-Expose-Headers": "Tauri-Custom-Header",
        "Tauri-Custom-Header": {
          "key1": "'value1' 'value2'",
          "key2": "'value3'"
        }
      },
      "csp": "default-src 'self'; connect-src ipc: http://ipc.localhost"
    }
  }
}
```

In this example, `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` are set to allow for the use of `SharedArrayBuffer`. `Timing-Allow-Origin` grants scripts loaded from the listed websites to access detailed network timing data via the Resource Timing API.

For the helloworld example, this config results in:

```
access-control-allow-origin:  http://tauri.localhost
access-control-expose-headers: Tauri-Custom-Header
content-security-policy: default-src 'self'; connect-src ipc: http://ipc.localhost; script-src 'self' 'sha256-Wjjrs6qinmnr+tOry8x8PPwI77eGpUFR3EEGZktjJNs='
content-type: text/html
cross-origin-embedder-policy: require-corp
cross-origin-opener-policy: same-origin
tauri-custom-header: key1 'value1' 'value2'; key2 'value3'
timing-allow-origin: https://developer.mozilla.org, https://example.com
```

### Frameworks

Some development environments require extra settings to emulate the production environment.

#### JavaScript/TypeScript

For setups running the build tool **Vite** (those include **Qwik, React, Solid, Svelte, and Vue**) add the wanted headers to `vite.config.ts`.

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Timing-Allow-Origin': 'https://developer.mozilla.org, https://example.com',
      'Access-Control-Expose-Headers': 'Tauri-Custom-Header',
      'Tauri-Custom-Header': "key1 'value1' 'value2'; key2 'value3'"
    }
  }
});
```

In case of **Angular**, add them to `angular.json`.

```json
{
  "projects": {
    "insert-project-name": {
      "architect": {
        "serve": {
          "options": {
            "headers": {
              "Cross-Origin-Opener-Policy": "same-origin",
              "Cross-Origin-Embedder-Policy": "require-corp",
              "Timing-Allow-Origin": "https://developer.mozilla.org, https://example.com",
              "Access-Control-Expose-Headers": "Tauri-Custom-Header",
              "Tauri-Custom-Header": "key1 'value1' 'value2'; key2 'value3'"
            }
          }
        }
      }
    }
  }
}
```

And in case of **Nuxt** to `nuxt.config.ts`.

```javascript
export default defineNuxtConfig({
  vite: {
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Timing-Allow-Origin': 'https://developer.mozilla.org, https://example.com',
        'Access-Control-Expose-Headers': 'Tauri-Custom-Header',
        'Tauri-Custom-Header': "key1 'value1' 'value2'; key2 'value3'"
      }
    }
  }
});
```

**Next.js** doesn’t rely on Vite, so the approach is different. The headers are defined in `next.config.js`.

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Timing-Allow-Origin',
            value: 'https://developer.mozilla.org, https://example.com'
          },
          {
            key: 'Access-Control-Expose-Headers',
            value: 'Tauri-Custom-Header'
          },
          {
            key: 'Tauri-Custom-Header',
            value: "key1 'value1' 'value2'; key2 'value3'"
          }
        ]
      }
    ]
  }
}
```

#### Rust

For **Yew** and **Leptos**, add the headers to `Trunk.toml`.

```toml
[serve]
headers = {
  "Cross-Origin-Opener-Policy" = "same-origin",
  "Cross-Origin-Embedder-Policy" = "require-corp",
  "Timing-Allow-Origin" = "https://developer.mozilla.org, https://example.com",
  "Access-Control-Expose-Headers" = "Tauri-Custom-Header",
  "Tauri-Custom-Header" = "key1 'value1' 'value2'; key2 'value3'"
}
```

# Runtime Authority

## Runtime Authority | Tauri
[https://v2.tauri.app/security/runtime-authority/](https://v2.tauri.app/security/runtime-authority/)

# Runtime Authority

The runtime authority is part of the Tauri Core. It holds all permissions, capabilities, and scopes at runtime to enforce which window can access which command and passes scopes to commands.

Whenever a Tauri command is invoked from the webview, the runtime authority receives the invoke request, makes sure that the origin is allowed to actually use the requested command, checks if the origin is part of capabilities, and if scopes are defined for the command and applicable, then they are injected into the invoke request, which is then passed to the proper Tauri command.

If the origin is not allowed to call the command, the runtime authority will deny the request, and the Tauri command is never invoked.

