---
title: Using Plumlang with coding agents
nav: Coding agents
metaTitle: Using Plumlang with coding agents
description: Give a coding agent Plumlang's documentation, with llms.txt, llms-full.txt and a Markdown copy of every docs page, plus an AGENTS.md snippet for your project.
lead: Give a coding agent the whole language with llms.txt, llms-full.txt and an AGENTS.md snippet.
---

Plumlang is new, so coding agents have not learned it. Give the agent the
documentation, and have it run `plum check` before it runs anything.

## The documentation in Markdown

| What | Where |
|---|---|
| Index of the docs ([llmstxt.org](https://llmstxt.org) format), each page with one line and a link to its Markdown | [/llms.txt](/llms.txt) |
| All of the documentation in one Markdown file: reference, tour, specification, standard library and error codes | [/llms-full.txt](/llms-full.txt) |
| One docs page as Markdown: add `index.md` to its URL | [/docs/tour/functions/index.md](/docs/tour/functions/index.md) |
| One docs page on the clipboard, with its URL on the first line | "Copy for LLM", at the top of every docs page |

An agent that can't fetch URLs can read a copy kept in your project:

```bash
curl -fsSL https://plum.elixpo.com/llms-full.txt -o plumlang.md
```

## An AGENTS.md snippet

Paste this into your project's `AGENTS.md`, or into the instructions file
your agent reads:

```markdown
## Plumlang

This project is written in Plumlang (`.plum` files): a small, statically
typed language that compiles to bytecode and runs in the `plum` VM. It is
not Python; don't guess its syntax. Read the language first:
https://plum.elixpo.com/llms-full.txt

- `plant` declares a variable, `root` a constant, `branch` a function,
  `tree` a class, `seed` imports a module, `drop(...)` prints.
  `good` / `bad` are true / false. Blocks use `{ }`; no semicolons.
- Types are static and mostly inferred. `T?` may be `none`: use `??`,
  `?.` or `if plant x = ...` before using the value.
- After every change, run `plum check <file>` and fix every error before
  running anything. Error codes are explained at
  https://plum.elixpo.com/docs/errors/ (for example #E0408).
- Run a program with `plum run <file>`, or `plum run <folder>` for a
  package with a `plum.toml`.
- `plum stdlib <module>` lists a module's functions.
```
