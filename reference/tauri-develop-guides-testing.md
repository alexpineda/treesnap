# Testing

## Tests | Tauri
[https://v2.tauri.app/develop/tests/](https://v2.tauri.app/develop/tests/)

# Tests

Tauri offers support for both unit and integration testing utilizing a mock runtime. Under the mock runtime, native webview libraries are not executed.

Tauri also provides support for end-to-end testing utilizing the WebDriver protocol. Both desktop and mobile work with it, except for macOS which does not provide a desktop WebDriver client.

We offer tauri-action to help run GitHub actions, but any sort of CI/CD runner can be used with Tauri as long as each platform has the required libraries installed to compile against.

## Mock Tauri APIs | Tauri
[https://v2.tauri.app/develop/tests/mocking/](https://v2.tauri.app/develop/tests/mocking/)

```markdown
# Mock Tauri APIs

When writing your frontend tests, having a “fake” Tauri environment to simulate windows or intercept IPC calls is common, so-called _mocking_. The `@tauri-apps/api/mocks` module provides some helpful tools to make this easier for you:

## IPC Requests

Most commonly, you want to intercept IPC requests; this can be helpful in a variety of situations:

- Ensure the correct backend calls are made
- Simulate different results from backend functions

Tauri provides the `mockIPC` function to intercept IPC requests.

```javascript
import { beforeAll, expect, test } from "vitest";
import { randomFillSync } from "crypto";
import { mockIPC } from "@tauri-apps/api/mocks";
import { invoke } from "@tauri-apps/api/core";

// jsdom doesn't come with a WebCrypto implementation
beforeAll(() => {
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (buffer) => {
        return randomFillSync(buffer);
      },
    },
  });
});

test("invoke simple", async () => {
  mockIPC((cmd, args) => {
    // simulated rust command called "add" that just adds two numbers
    if(cmd === "add") {
      return (args.a as number) + (args.b as number);
    }
  });
});
```

Sometimes you want to track more information about an IPC call; how many times was the command invoked? Was it invoked at all? You can use `mockIPC()` with other spying and mocking tools to test this:

```javascript
import { beforeAll, expect, test, vi } from "vitest";
import { randomFillSync } from "crypto";
import { mockIPC } from "@tauri-apps/api/mocks";
import { invoke } from "@tauri-apps/api/core";

// jsdom doesn't come with a WebCrypto implementation
beforeAll(() => {
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (buffer) => {
        return randomFillSync(buffer);
      },
    },
  });
});

test("invoke", async () => {
  mockIPC((cmd, args) => {
    // simulated rust command called "add" that just adds two numbers
    if(cmd === "add") {
      return (args.a as number) + (args.b as number);
    }
  });

  // we can use the spying tools provided by vitest to track the mocked function
  const spy = vi.spyOn(window.__TAURI_INTERNALS__, "invoke");
  expect(invoke("add", { a: 12, b: 15 })).resolves.toBe(27);
  expect(spy).toHaveBeenCalled();
});
```

To mock IPC requests to a sidecar or shell command you need to grab the ID of the event handler when `spawn()` or `execute()` is called and use this ID to emit events the backend would send back:

```javascript
mockIPC(async (cmd, args) => {
  if (args.message.cmd === 'execute') {
    const eventCallbackId = `_${args.message.onEventFn}`;
    const eventEmitter = window[eventCallbackId];

    // 'Stdout' event can be called multiple times
    eventEmitter({
      event: 'Stdout',
      payload: 'some data sent from the process',
    });

    // 'Terminated' event must be called at the end to resolve the promise
    eventEmitter({
      event: 'Terminated',
      payload: {
        code: 0,
        signal: 'kill',
      },
    });
  }
});
```

## Windows

Sometimes you have window-specific code (a splash screen window, for example), so you need to simulate different windows. You can use the `mockWindows()` method to create fake window labels. The first string identifies the “current” window (i.e., the window your JavaScript believes itself in), and all other strings are treated as additional windows.

```javascript
import { beforeAll, expect, test } from 'vitest';
import { randomFillSync } from 'crypto';
import { mockWindows } from '@tauri-apps/api/mocks';

// jsdom doesn't come with a WebCrypto implementation
beforeAll(() => {
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (buffer) => {
        return randomFillSync(buffer);
      },
    },
  });
});

test('invoke', async () => {
  mockWindows('main', 'second', 'third');
  const { getCurrent, getAll } = await import('@tauri-apps/api/webviewWindow');
  expect(getCurrent()).toHaveProperty('label', 'main');
  expect(getAll().map((w) => w.label)).toEqual(['main', 'second', 'third']);
});
``` 
```

## WebDriver | Tauri
[https://v2.tauri.app/develop/tests/webdriver/](https://v2.tauri.app/develop/tests/webdriver/)

# WebDriver

WebDriver is a standardized interface to interact with web documents primarily intended for automated testing. Tauri supports the WebDriver interface by leveraging the native platform’s WebDriver server underneath a cross-platform wrapper `tauri-driver`. On desktop, only Windows and Linux are supported due to macOS not having a WKWebView driver tool available. iOS and Android work through Appium 2, but the process is not currently streamlined.

## System Dependencies

Install the latest `tauri-driver` or update an existing installation by running:

```
cargo install tauri-driver --locked
```

Because we currently utilize the platform’s native WebDriver server, there are some requirements for running `tauri-driver` on supported platforms.

### Linux

We use `WebKitWebDriver` on Linux platforms. Check if this binary exists already (command `which WebKitWebDriver`) as some distributions bundle it with the regular WebKit package. Other platforms may have a separate package for them, such as `webkit2gtk-driver` on Debian-based distributions.

### Windows

Make sure to grab the version of Microsoft Edge Driver that matches your Windows Edge version that the application is being built and tested on. This should almost always be the latest stable version on up-to-date Windows installs. If the two versions do not match, you may experience your WebDriver testing suite hanging while trying to connect.

The download contains a binary called `msedgedriver.exe`. `tauri-driver` looks for that binary in the `$PATH` so make sure it’s either available on the path or use the `--native-driver` option on `tauri-driver`. You may want to download this automatically as part of the CI setup process to ensure the Edge and Edge Driver versions stay in sync on Windows CI machines.

## Example Applications

Below are step-by-step guides to show how to create a minimal example application that is tested with WebDriver.

If you prefer to see the result of the guide and look over a finished minimal codebase that utilizes it, you can look at the GitHub repository.

## Continuous Integration (CI)

The above examples also come with a CI script to test with GitHub Actions, but you may still be interested in the WebDriver CI guide as it explains the concept a bit more.

## Setup | Tauri
[https://v2.tauri.app/develop/tests/webdriver/example/](https://v2.tauri.app/develop/tests/webdriver/example/)

# Setup

This example application solely focuses on adding WebDriver testing to an already existing project. To have a project to test in the following two sections, we will set up an extremely minimal Tauri application for use in our testing. We will not use the Tauri CLI, any frontend dependencies or build steps, and not be bundling the application afterward. This is to showcase exactly a minimal suite to show off adding WebDriver testing to an existing application.

## Initializing a Cargo Project

We want to create a new binary Cargo project to house this example application. We can easily do this from the command line with `cargo new hello-tauri-webdriver --bin`, which will scaffold a minimal binary Cargo project for us. This directory will serve as the working directory for the rest of this guide, so make sure the commands you run are inside this new `hello-tauri-webdriver/` directory.

## Creating a Minimal Frontend

We will create a minimal HTML file to act as our example application’s front end. We will also be using a few things from this frontend later during our WebDriver tests.

First, let’s create our Tauri `distDir` that we know we will need once building the Tauri portion of the application. `mkdir dist` should create a new directory called `dist/` in which we will be placing the following `index.html` file.

`dist/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Hello Tauri!</title>
    <style>
      body {
        background-color: #222831;
        color: #ececec;
        margin: 0;
        height: 100vh;
        width: 100vw;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    </style>
  </head>
  <body>
    <h1>Hello, Tauri!</h1>
  </body>
</html>
```

## Adding Tauri to the Cargo Project

Next, we will add the necessary items to turn our Cargo project into a Tauri project. First, is adding the dependencies to the Cargo Manifest (`Cargo.toml`) so that Cargo knows to pull in our dependencies while building.

`Cargo.toml`:

```toml
[package]
name = "hello-tauri-webdriver"
version = "0.1.0"
edition = "2021"
rust-version = "1.56"

[build-dependencies]
tauri-build = "1"

[dependencies]
tauri = { version = "1", features = ["custom-protocol"] }

[profile.release]
incremental = false
codegen-units = 1
panic = "abort"
opt-level = "s"
lto = true
```

We added a `[build-dependency]` as you may have noticed. To use the build dependency, we must use it from a build script. We will create one now at `build.rs`.

`build.rs`:

```rust
fn main() {
    println!("cargo:rerun-if-changed=dist");
    tauri_build::build()
}
```

Our Cargo Project now knows how to pull in and build our Tauri dependencies with all that setup. Let’s finish making this minimal example a Tauri application by setting up Tauri in the actual project code. We will be editing the `src/main.rs` file to add this Tauri functionality.

`src/main.rs`:

```rust
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("unable to run Tauri application");
}
```

## Tauri Configuration

We are going to need 2 things to successfully build the application. First, we need an icon file. You can use any PNG for this next part and copy it into `icon.png`. 

We will need a `tauri.conf.json` to set some important configuration values for Tauri. 

`tauri.conf.json`:

```json
{
  "build": {
    "distDir": "dist"
  },
  "tauri": {
    "bundle": {
      "identifier": "studio.tauri.hello_tauri_webdriver",
      "icon": ["icon.png"]
    },
    "allowlist": {
      "all": false
    },
    "windows": [
      {
        "width": 800,
        "height": 600,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

At this point, we have a basic Hello World application that should display a simple greeting when run.

## Running the Example Application

To make sure we did it right, let’s build this application! We will run this as a `--release` application because we will also run our WebDriver tests with a release profile. Run `cargo run --release`, and after some compiling, we should see the application pop up.

_Note: If you are modifying the application and want to use the Devtools, then run it without `--release` and “Inspect Element” should be available in the right-click menu._

We should now be ready to start testing this application with some WebDriver frameworks. This guide will go over both WebdriverIO and Selenium in that order.

## WebdriverIO | Tauri
[https://v2.tauri.app/develop/tests/webdriver/example/webdriverio/](https://v2.tauri.app/develop/tests/webdriver/example/webdriverio/)

# WebdriverIO

This WebDriver testing example will use WebdriverIO and its testing suite. It is expected to have Node.js already installed, along with `npm` or `yarn`.

## Create a Directory for the Tests

Let’s create a space to write these tests in our project. Create the directory we will use with `mkdir -p webdriver/webdriverio`. The rest of this guide assumes you are inside the `webdriver/webdriverio` directory.

## Initializing a WebdriverIO Project

We will be using a pre-existing `package.json` to bootstrap this test suite. 

`package.json`:

```json
{
  "name": "webdriverio",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "wdio run wdio.conf.js"
  },
  "dependencies": {
    "@wdio/cli": "^7.9.1"
  },
  "devDependencies": {
    "@wdio/local-runner": "^7.9.1",
    "@wdio/mocha-framework": "^7.9.1",
    "@wdio/spec-reporter": "^7.9.0"
  }
}
```

We have a script that runs a WebdriverIO config as a test suite exposed as the `test` command. 

To add the WebdriverIO CLI to this npm project, run:

```
npm install @wdio/cli
```

or 

```
yarn add @wdio/cli
```

To run the interactive config command to set up a WebdriverIO test suite, you can then run:

```
npx wdio config
```

or 

```
yarn wdio config
```

## Config

The `test` script in our `package.json` mentions a file `wdio.conf.js`. That’s the WebdriverIO config file which controls most aspects of our testing suite.

`wdio.conf.js`:

```javascript
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

let tauriDriver;

exports.config = {
  specs: ['./develop/tests/specs/**/*.js'],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      'tauri:options': {
        application: '../../target/release/hello-tauri-webdriver',
      },
    },
  ],
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
  onPrepare: () => spawnSync('cargo', ['build', '--release']),
  beforeSession: () =>
    (tauriDriver = spawn(
      path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver'),
      [],
      { stdio: [null, process.stdout, process.stderr] }
    )),
  afterSession: () => tauriDriver.kill(),
};
```

## Spec

A spec contains the code that is testing your actual application. 

`test/specs/example.e2e.js`:

```javascript
function luma(hex) {
  if (hex.startsWith('#')) {
    hex = hex.substring(1);
  }
  const rgb = parseInt(hex, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe('Hello Tauri', () => {
  it('should be cordial', async () => {
    const header = await $('body > h1');
    const text = await header.getText();
    expect(text).toMatch(/^[hH]ello/);
  });

  it('should be excited', async () => {
    const header = await $('body > h1');
    const text = await header.getText();
    expect(text).toMatch(/!$/);
  });

  it('should be easy on the eyes', async () => {
    const body = await $('body');
    const backgroundColor = await body.getCSSProperty('background-color');
    expect(luma(backgroundColor.parsed.hex)).toBeLessThan(100);
  });
});
```

## Running the Test Suite

Now that we are all set up with config and a spec let’s run it!

```
npm test
```

or 

```
yarn test
```

We should see output indicating that all tests have passed. 

Using the WebdriverIO test suite, we just easily enabled e2e testing for our Tauri application from just a few lines of configuration and a single command to run it! Even better, we didn’t have to modify the application at all.

## Selenium | Tauri
[https://v2.tauri.app/develop/tests/webdriver/example/selenium/](https://v2.tauri.app/develop/tests/webdriver/example/selenium/)

# Selenium

This WebDriver testing example will use Selenium and a popular Node.js testing suite. You are expected to already have Node.js installed, along with `npm` or `yarn`.

## Create a Directory for the Tests

Let’s create a space to write these tests in our project. Create the directory we will use with `mkdir -p webdriver/selenium`. The rest of this guide will assume you are inside the `webdriver/selenium` directory.

## Initializing a Selenium Project

We will be using a pre-existing `package.json` to bootstrap this test suite. 

`package.json`:

```json
{
  "name": "selenium",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "mocha"
  },
  "dependencies": {
    "chai": "^4.3.4",
    "mocha": "^9.0.3",
    "selenium-webdriver": "^4.0.0-beta.4"
  }
}
```

We have a script that runs Mocha as a test framework exposed as the `test` command. We also have various dependencies that we will be using to run the tests.

To install the dependencies from scratch, just run the following command:

```
npm install mocha chai selenium-webdriver
```

or

```
yarn add mocha chai selenium-webdriver
```

I suggest also adding a `"test": "mocha"` item in the `package.json` `"scripts"` key so that running Mocha can be called simply with:

```
npm test
```

or

```
yarn test
```

## Testing

Unlike other testing suites, Selenium does not come out of the box with a Test Suite and leaves it up to the developer to build those out. We chose Mocha, which is pretty neutral, so our script will need to do a bit of work to set up everything for us in the correct order. Mocha expects a testing file at `test/test.js` by default, so let’s create that file now.

`test/test.js`:

```javascript
const os = require('os');
const path = require('path');
const { expect } = require('chai');
const { spawn, spawnSync } = require('child_process');
const { Builder, By, Capabilities } = require('selenium-webdriver');

// create the path to the expected application binary
const application = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'target',
  'release',
  'hello-tauri-webdriver'
);

// keep track of the webdriver instance we create
let driver;

// keep track of the tauri-driver process we start
let tauriDriver;

before(async function () {
  // set timeout to 2 minutes to allow the program to build if it needs to
  this.timeout(120000);
  // ensure the program has been built
  spawnSync('cargo', ['build', '--release']);
  // start tauri-driver
  tauriDriver = spawn(
    path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver'),
    [],
    { stdio: [null, process.stdout, process.stderr] }
  );

  const capabilities = new Capabilities();
  capabilities.set('tauri:options', { application });
  capabilities.setBrowserName('wry');

  // start the webdriver client
  driver = await new Builder()
    .withCapabilities(capabilities)
    .usingServer('http://127.0.0.1:4444/')
    .build();
});

after(async function () {
  // stop the webdriver session
  await driver.quit();
  // kill the tauri-driver process
  tauriDriver.kill();
});

describe('Hello Tauri', () => {
  it('should be cordial', async () => {
    const text = await driver.findElement(By.css('body > h1')).getText();
    expect(text).to.match(/^[hH]ello/);
  });

  it('should be excited', async () => {
    const text = await driver.findElement(By.css('body > h1')).getText();
    expect(text).to.match(/!$/);
  });

  it('should be easy on the eyes', async () => {
    const text = await driver.findElement(By.css('body')).getCssValue('background-color');
    const rgb = text.match(/^rgb\((?<r>\d+), (?<g>\d+), (?<b>\d+)\)$/).groups;
    expect(rgb).to.have.all.keys('r', 'g', 'b');
    const luma = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    expect(luma).to.be.lessThan(100);
  });
});
```

If you are familiar with JS testing frameworks, `describe`, `it`, and `expect` should look familiar. We also have semi-complex `before()` and `after()` callbacks to set up and teardown mocha.

## Running the Test Suite

Now that we are all set up with our dependencies and our test script, let’s run it!

```
npm test
```

or

```
yarn test
```

We should see output indicating that all tests have passed:

```
➜  selenium git:(main) ✗ yarn test

yarn run v1.22.11

$ Mocha

  Hello Tauri

    ✔ should be cordial (120ms)
    ✔ should be excited
    ✔ should be easy on the eyes

  3 passing (588ms)

Done in 0.93s.
```

With Selenium and some hooking up to a test suite, we just enabled e2e testing without modifying our Tauri application at all!

## Continuous Integration | Tauri
[https://v2.tauri.app/develop/tests/webdriver/ci/](https://v2.tauri.app/develop/tests/webdriver/ci/)

# Continuous Integration

Utilizing Linux and some programs to create a fake display, it is possible to run WebDriver tests with `tauri-driver` on your CI. The following example uses the WebdriverIO example and GitHub Actions.

This means the following assumptions:

1. The Tauri application is in the repository root and the binary builds when running `cargo build --release`.
2. The WebDriverIO test runner is in the `webdriver/webdriverio` directory and runs when `yarn test` is used in that directory.

The following is a commented GitHub Actions workflow file at `.github/workflows/webdriver.yml`

```
# run this action when the repository is pushed to
on: [push]

# the name of our workflow
name: WebDriver

jobs:
  # a single job named test
  test:
    # the display name of the test job
    name: WebDriverIO Test Runner
    # we want to run on the latest linux environment
    runs-on: ubuntu-22.04

    # the steps our job runs **in order**
    steps:
      # checkout the code on the workflow runner
      - uses: actions/checkout@v4

      # install system dependencies that Tauri needs to compile on Linux.
      # note the extra dependencies for `tauri-driver` to run which are: `webkit2gtk-driver` and `xvfb`
      - name: Tauri dependencies
        run: |
          sudo apt update && sudo apt install -y \
            libwebkit2gtk-4.1-dev \
            build-essential \
            curl \
            wget \
            file \
            libxdo-dev \
            libssl-dev \
            libayatana-appindicator3-dev \
            librsvg2-dev \
            webkit2gtk-driver \
            xvfb

      - name: Setup rust-toolchain stable
        id: rust-toolchain
        uses: dtolnay/rust-toolchain@stable

      # we run our rust tests before the webdriver tests to avoid testing a broken application
      - name: Cargo test
        run: cargo test

      # build a release build of our application to be used during our WebdriverIO tests
      - name: Cargo build
        run: cargo build --release

      # install the latest stable node version at the time of writing
      - name: Node 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'yarn'

      # install our Node.js dependencies with Yarn
      - name: Yarn install
        run: yarn install --frozen-lockfile
        working-directory: webdriver/webdriverio

      # install the latest version of `tauri-driver`.
      # note: the tauri-driver version is independent of any other Tauri versions
      - name: Install tauri-driver
        run: cargo install tauri-driver --locked

      # run the WebdriverIO test suite.
      # we run it through `xvfb-run` (the dependency we installed earlier) to have a fake
      # display server which allows our application to run headless without any changes to the code
      - name: WebdriverIO
        run: xvfb-run yarn test
        working-directory: webdriver/webdriverio
```

