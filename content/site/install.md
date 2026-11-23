---
title: Install Plumlang
nav: Install
metaTitle: Install Plumlang
description: Install Plumlang with one command, curl | sh on Linux and macOS or irm | iex on Windows, or build plum from source with a C11 compiler and make.
lead: Put the plum binary on your PATH with one command on Linux, macOS or Windows.
---

Plumlang is one program, `plum`, with no dependencies: the compiler, the
virtual machine and the standard library are all inside it.

## Linux and macOS

```bash
curl -fsSL https://github.com/plumlang/plumlang/releases/latest/download/install.sh | sh
```

The script installs `plum` into `~/.plum/bin` and prints the line to add to
your shell profile if that folder isn't on your `PATH`. Builds: Linux x86_64,
arm64 and riscv64 (static, any distribution), and macOS 11 or later (one
universal binary for Apple silicon and Intel).

## Windows

In PowerShell:

```powershell
irm https://github.com/plumlang/plumlang/releases/latest/download/install.ps1 | iex
```

The script installs `plum.exe` into `%LOCALAPPDATA%\Plumlang\bin` and adds
that folder to your user `PATH`; open a new terminal to use it. Builds: x64
and ARM64.

## Check it

```bash
plum version
```

Both installers check the download against the release's `SHA256SUMS` before
installing anything, and change nothing outside the install folder (on
Windows, they also add it to your `PATH`). The same scripts are served from
this site, at [plum.elixpo.com/install.sh](/install.sh) and
[plum.elixpo.com/install.ps1](/install.ps1).

## Settings

Set these environment variables before running an installer:

| Variable | Default | What it sets |
|---|---|---|
| `PLUM_VERSION` | the newest release | The version to install, such as `0.1.0`. |
| `PLUM_INSTALL` | `~/.plum`; on Windows `%LOCALAPPDATA%\Plumlang` | Where to install. The binary goes in its `bin` folder. |

```bash
curl -fsSL https://github.com/plumlang/plumlang/releases/latest/download/install.sh | PLUM_VERSION=0.1.0 PLUM_INSTALL=/opt/plum sh
```

```powershell
$env:PLUM_VERSION = "0.1.0"; irm https://github.com/plumlang/plumlang/releases/latest/download/install.ps1 | iex
```

To uninstall, delete the install folder.

## Package managers

| Manager | Command | Status |
|---|---|---|
| Homebrew | `brew install plumlang/tap/plum` | Coming soon, not published yet |
| winget | `winget install Elixpo.Plumlang` | Coming soon, not published yet |

## Build from source

You need a C11 compiler (GCC, Clang or MSVC) and `make`. Nothing else: the
TLS library used for HTTPS is included in the source.

```bash
git clone https://github.com/plumlang/plumlang
cd plumlang
make                 # builds ./plum
make test            # optional: the test suite
./plum version
```

With MSVC on Windows, use CMake:

```bat
cmake -B build && cmake --build build --config Release
```

Then copy `plum` to a folder on your `PATH`.

## Your first program

Save this as `hello.plum`:

```plum
drop("Hello, world!")
```

Check it, then run it:

```bash
plum check hello.plum
plum run hello.plum
```

```text output
Hello, world!
```

## Licence

Plumlang is source-available under the
[Plumlang Commercial License 1.0](https://github.com/plumlang/plumlang/blob/main/LICENSE):
free for personal, educational, research and other non-commercial use, and
free to evaluate for 60 days. Commercial use needs a licence:
[hello@elixpo.com](mailto:hello@elixpo.com). Programs you write in Plumlang
are yours.
