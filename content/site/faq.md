---
title: Plumlang FAQ
nav: FAQ
metaTitle: "What is Plumlang? The Plum programming language, FAQ"
description: "Plumlang (Plum) is a statically typed, memory-safe programming language that reads like English and ships as one binary. Answers about what it is, who makes it, its speed, licence, platforms and how to start."
lead: Short answers to what people ask first about Plumlang.
---

## What is Plumlang?

Plumlang, or Plum for short, is a statically typed, memory-safe programming
language whose code reads like English. Programs are checked before they run,
compiled to bytecode, and run on a small virtual machine. The compiler, the
virtual machine, a formatter, a test runner, a REPL and a language server ship
together as one `plum` binary with no dependencies, for Linux, macOS and
Windows. It is made by [Elixpo](https://elixpo.com) and developed in the open
on [GitHub](https://github.com/plumlang/plumlang).

## Is Plum a programming language?

Yes. Plumlang, often called Plum, is a general-purpose programming language:
the `.plum` files it runs are programs, and `plum` is its compiler and
runtime. A first program:

```plum
plant name = "world"
drop("Hello, {name}!")
```

Other, unrelated projects share similar names (several hobby languages called
Plum or Plume, and PLUM from 1978). This site is about Plumlang, the language
of `plum.elixpo.com` and `github.com/plumlang`.

## Who makes Plumlang?

Plumlang is an [Elixpo](https://elixpo.com) production, created by Ayushman
Bhattacharya, Subhro Koley and Rohan Hudati. Anyone can contribute: see
[CONTRIBUTING.md](https://github.com/plumlang/plumlang/blob/main/CONTRIBUTING.md).

## Is Plumlang free and open source?

Yes. Plumlang is open source under the Apache License 2.0. The Plumlang
Commercial License is available as an alternative for organisations that want
a written agreement. Programs you write in Plumlang are yours, under any
licence you choose.

## What does Plumlang code look like?

Variables are `plant`, constants `root`, functions `branch`, classes `tree`
and imports `seed`; `drop` prints, and the booleans are `good` and `bad`:

```plum
tree Greeter {
    name: str
    branch greet() -> str => "Hello, {self.name}!"
}

root TEAM = ["Ada", "Grace"]
for person in TEAM {
    drop(Greeter(person).greet())
}
```

The [tour](/docs/tour/) teaches the language step by step, and every example
runs in the [playground](/playground/).

## What can I build with Plumlang?

Command-line tools, scripts, web services and APIs (an HTTP server and client
are built in), network programs over TCP, UDP and TLS, and programs that read
and write JSON, CSV and TOML. Lightweight tasks and channels run work
concurrently. Packages come from [Orchard](/packages/), the package registry.

## How fast is Plumlang?

The type checker knows every value's type before the program runs, so the
compiler picks specialised bytecode and the virtual machine does no type
checks of its own. On the project's benchmark suite, the current development
version (2.3) is about 3 times faster than CPython 3.14 and about 1.6 times
faster than Node.js with its JIT turned off. The method and every number are
in the [benchmarks](https://github.com/plumlang/plumlang/blob/main/bench/README.md).

## Does Plumlang have a garbage collector?

No. Memory is freed by reference counting as soon as nothing refers to it, so
there are no collection pauses. Strings, lists and maps are values with
copy-on-write; objects that refer to each other in a cycle use `weak`
fields, and `plum run --check-leaks` reports any cycle left alive.

## How is Plumlang different from Python?

Plumlang reads as plainly as Python, but it is statically typed: every error a
checker can find is reported by `plum check` before the program runs, with the
line, column and a hint. Integer overflow is an error rather than a silent
wrap. Programs run on one dependency-free binary, and there is no garbage
collector.

## Which platforms does Plumlang run on?

Linux (x86-64, arm64 and riscv64), macOS (Apple silicon and Intel) and
Windows (x86-64 and arm64). It also runs in the browser and in Node.js as
WebAssembly: the [playground](/playground/) uses it, and it is on npm as
`@plumlang/plumlang`.

## How do I install Plumlang?

```sh
curl -fsSL https://plum.elixpo.com/install.sh | sh     # Linux and macOS
irm https://plum.elixpo.com/install.ps1 | iex          # Windows (PowerShell)
brew install plumlang/tap/plum                         # Homebrew
```

aqua, mise, Nix and building from source are on the [install page](/docs/install/).
Then `plum new my-app` starts a project with a test and CI.

## Can I try Plumlang without installing it?

Yes: the [playground](/playground/) runs the real `plum`, compiled to
WebAssembly, in your browser. Write a program, run it, see its errors as you
type, and share it as a link.

## Which editors support Plumlang?

VS Code (the Plumlang extension on the Marketplace and Open VSX), Zed, Helix,
and any editor that speaks the Language Server Protocol through `plum lsp`:
errors as you type, hover, go to definition, completion, rename and
formatting. Grammars exist for Tree-sitter, highlight.js and Pygments. See
[Editors and packages](/docs/ecosystem/).

## Is Plumlang ready for production?

Plumlang is in early access. The 2.x releases are used for scripts, tools and
services, with every release tested on Linux, macOS and Windows, but the
language may still change between minor versions, with notes in the
[changelog](https://github.com/plumlang/plumlang/blob/main/CHANGELOG.md). The
3.0 release freezes the specification and adds a native compiler; the
[roadmap](https://github.com/plumlang/plumlang/issues/36) has the plan.

## Where can I ask questions or report a bug?

In [GitHub Discussions](https://github.com/plumlang/plumlang/discussions) for
questions and ideas, and in [GitHub Issues](https://github.com/plumlang/plumlang/issues)
for bugs. Security problems go through the
[security policy](https://github.com/plumlang/plumlang/blob/main/docs/SECURITY.md).
