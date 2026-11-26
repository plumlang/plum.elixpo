---
title: Editors, packages and integrations
nav: Editors and packages
metaTitle: Plumlang editors, packages and integrations
description: Use Plumlang in VS Code, Zed, Helix and any LSP editor, highlight it with Tree-sitter, highlight.js or Pygments, install it from Homebrew, aqua, mise or Nix, and run it in GitHub Actions.
lead: Where Plumlang works today, outside the plum binary itself.
---

Every integration here talks to the same `plum` binary, so install it first
([Install](/docs/install/)). Items marked *in review* are submitted and waiting
for the other project's maintainers.

## Editors

| Editor | How |
|---|---|
| VS Code | Install [Plumlang](https://marketplace.visualstudio.com/items?itemName=plum-lang.plum-lang) from the Marketplace, or search for "Plumlang" in the Extensions view. Highlighting, errors as you type, hover, go to definition, completion and formatting. Also on [Open VSX](https://open-vsx.org/extension/plum-lang/plum-lang) for VSCodium, Cursor and other editors that use it. |
| Zed | [zed-plum](https://github.com/plumlang/zed-plum), *in review* for Zed's extension gallery. Until then: **zed: install dev extension** and pick a clone of the repository. |
| Helix | Built-in support is *in review* ([helix#16493](https://github.com/helix-editor/helix/pull/16493)). |
| Any LSP editor | Run `plum lsp` over standard input and output; see [the language server](/docs/tools/lsp/). |

## Syntax highlighting

| Package | Install | For |
|---|---|---|
| [tree-sitter-plum](https://github.com/plumlang/tree-sitter-plum) | `npm install @plumlang/tree-sitter-plum` | The grammar used by Neovim, Helix, Zed and other Tree-sitter tools; listed in Tree-sitter's [List of parsers](https://github.com/tree-sitter/tree-sitter/wiki/List-of-parsers). |
| [highlightjs-plum](https://github.com/plumlang/highlightjs-plum) | `npm install @plumlang/highlightjs-plum` | [highlight.js](https://highlightjs.org) on web pages, docs sites and blogs. |
| [pygments-plum](https://github.com/plumlang/pygments-plum) | `pip install pygments-plum` | [Pygments](https://pygments.org): Sphinx, MkDocs, Jupyter, `pygmentize`. |

With highlight.js from a CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@plumlang/highlightjs-plum/dist/plum.min.js"></script>
```

With Pygments, a fenced block marked `plum` highlights once the plugin is
installed (MkDocs with `pymdownx.highlight`, Sphinx, and others).

## Plumlang in JavaScript

`@plumlang/plumlang` is the WebAssembly build of `plum` as an npm package: run,
check and format Plumlang from Node or the browser, as the
[playground](/playground/) does. It is published with each release ([npm](https://www.npmjs.com/package/@plumlang/plumlang));
see [the WebAssembly guide](/docs/tools/wasm/).

## Continuous integration

[setup-plum](https://github.com/plumlang/setup-plum) installs a checksum-verified
`plum` in GitHub Actions on Linux, macOS and Windows:

```yaml
- uses: plumlang/setup-plum@v1
- run: plum check main.plum
```

## Packages

[Orchard](/packages/) is the package index: `plum add <name>` adds a package to
your project and `plum publish` publishes one.

## Plumlang elsewhere

| Where | What |
|---|---|
| [Rosetta Code](https://rosettacode.org/wiki/Category:Plumlang) | Plumlang solutions next to other languages, starting with [Hello world](https://rosettacode.org/wiki/Hello_world/Text#Plumlang) and [FizzBuzz](https://rosettacode.org/wiki/FizzBuzz#Plumlang). |
| [PLDB](https://pldb.io/concepts/plumlang.html) | The Programming Language DataBase entry. |
| [Tree-sitter](https://github.com/tree-sitter/tree-sitter/wiki/List-of-parsers) | `tree-sitter-plum` in the official list of parsers. |

## Install channels

| Channel | Command |
|---|---|
| Linux and macOS | `curl -fsSL https://plum.elixpo.com/install.sh \| sh` |
| Windows | `irm https://plum.elixpo.com/install.ps1 \| iex` |
| Homebrew | `brew install plumlang/tap/plum` |
| winget | `winget install Elixpo.Plumlang` (*in review*) |
| aqua | `aqua g -i plumlang/plumlang` |
| mise | `mise use aqua:plumlang/plumlang` |
| Nix / NixOS | `nix profile install nixpkgs#plum` (*in review*; [build from source with Nix](/docs/install/#package-managers) today) |
