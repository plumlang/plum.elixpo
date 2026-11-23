# plum.elixpo.com

The website and documentation of [Plumlang](https://github.com/plumlang/plumlang),
a small, fast, memory-safe programming language. An Elixpo production, created
by Ayushman Bhattacharya, Subhro Koley and Rohan Hudati.

The site is fully static: Next.js exports it to `out/`, and Cloudflare Pages
serves it at <https://plum.elixpo.com>. There is no server code, no API route
and no server action.

## What is here

| Path | Contents |
|---|---|
| `/` | The story, one idea per section, each ending in its next step: what Plumlang is, why (three properties with proof), install, learn, build, reference, contribute. |
| `/docs/` | The documentation in reading order. |
| `/docs/install/` | One-line installers, settings, build from source. |
| `/docs/tour/` | A beginner's tour in eleven steps, written for this site. |
| `/docs/language/` | The language reference: `docs/spec.md`, one page per section. |
| `/docs/stdlib/` | The standard library: one page per module from `docs/stdlib/`. |
| `/docs/reference/` | The whole language on one page: `docs/reference.md` ([plumlang#87](https://github.com/plumlang/plumlang/issues/87)), only once the snapshot has it. |
| `/docs/errors/` | Every error code, each with its own anchor (`/docs/errors/#E0401`). |
| `/docs/agents/` | Using Plumlang with coding agents, with an `AGENTS.md` snippet. |
| `/docs/tools/` | Orchard, the language server, the REPL and the WebAssembly build: plumlang's `docs/orchard.md`, `lsp.md`, `repl.md` and `playground.md`, one page each. |
| `/packages/` | Orchard's packages, searchable, and a page per package (`/packages/NAME/`): install command, README, versions, repository. Read from [plumlang/registry](https://github.com/plumlang/registry) at build time. |
| `/playground/` | The playground: plum compiled to WebAssembly runs programs in the browser, with the examples and the tour in a menu, errors as you type, Format, and share links ([plumlang#32](https://github.com/plumlang/plumlang/issues/32)). |

Every docs page opens with its one-line purpose, a link to the next page,
"Copy for LLM" and a link to `llms-full.txt`, and ends with previous / next.

### Files for language models and installers

| Path | Contents |
|---|---|
| `/llms.txt` | Index of the docs in the [llmstxt.org](https://llmstxt.org) format: H1, summary, sections of links to each page's Markdown with one line each. |
| `/llms-full.txt` | All of the docs as one Markdown file: the one-page reference (when present), the tour, the specification, the standard library, the error codes. |
| `/docs/<page>/index.md` | The Markdown of every docs page: its URL plus `index.md` (`/docs/tour/functions/index.md`). The first line is `Source: <page URL>`; links are absolute. "Copy for LLM" copies the same text, which is embedded in the page. |
| `/install.sh`, `/install.ps1` | The installers from plumlang's `tools/install/`, the same files each release publishes. |

These come from `lib/llm.ts`, through static route handlers
(`app/llms.txt/`, `app/llms-full.txt/`, `app/[...markdown]/`), so the export
writes them as files. The Markdown copies are written by `npm run build`;
`npm run dev` serves `/docs/...` URLs to the docs pages first, so preview
them with a build (`npx serve out`). They are not in the sitemap.
`public/_headers` serves the installers and the llms files as
`text/plain; charset=utf-8`.

## Source of truth

The language, its specification and its library documentation live in
[plumlang/plumlang](https://github.com/plumlang/plumlang). This repository
keeps a reviewed snapshot of that `docs/` folder in `content/docs/`, so a
build never fetches anything and is reproducible from this tree.
`content/docs/source.json` records the commit the snapshot came from and a
hash of each file.

To update the snapshot, with a plumlang checkout next to this repository:

```bash
node scripts/sync-docs.mjs ../plumlang          # or: npm run docs:sync -- ../plumlang
node scripts/sync-docs.mjs ../plumlang --check  # or: npm run docs:check -- ../plumlang
```

The script copies `docs/spec.md`, `docs/errors.md`, `docs/stdlib/*.md` and,
when plumlang has it, `docs/reference.md`, and `examples/*.plum` into
`content/docs/examples/` (the playground's menu); removes files deleted
upstream; copies `tools/install/install.sh` and `install.ps1` byte for byte
into `public/` when the checkout has them (a checkout without them leaves
`public/` alone); copies the WebAssembly build, `build/wasm/plum.js` and
`plum.wasm`, into `public/playground/` when the checkout has built it (run
`make wasm` there first; without it `public/playground/` is left alone);
and refuses a checkout whose `docs/`, `examples/` or `tools/install/` has
uncommitted changes (`--allow-dirty` previews them locally). Commit the
result as its own change, and review it like any other: the diff is the
docs' diff.

Corrections to the reference go to plumlang; every reference page links to
its source with "Edit this page on GitHub". The tour (`content/tour/`), the
install and agents pages (`content/site/`) and the landing page's samples
(`content/samples/`) belong to this repository. Every runnable sample in the
tour is run against `plum` before it is committed, and its output is shown
exactly as printed. The landing page reads its programs from
`content/samples/`, next to the output `plum run` printed (`.out`) or the
error `plum check` printed (`.err`); `npm run samples:check -- path/to/plum`
checks them again.

Brand assets come from
[plumlang/branding](https://github.com/plumlang/branding) at commit
`ee17223`, following its `docs/brand-system.md`: the Open Field mark
(`app/icon.svg`, `public/plum-mark.svg`), the rendered icons
(`app/favicon.ico`, `app/apple-icon.png`, `public/icon-192.png`,
`public/icon-512.png`), the social cards (`public/og.png` from
`og/plum.elixpo/default.png`, and `public/og-docs.png` from `docs.png`, used by
every `/docs/` page), and the pixel plum (`public/plum-pixel.svg`, on the 404
page only). The colours in `app/globals.css` are branding's
`brand/palette.json`. Copy new renders from branding rather than editing
them here.

## How it is built

| Part | Where |
|---|---|
| Pages and layouts | `app/` (Next.js 16 App Router, React 19) |
| Components | `components/` (Tailwind CSS v4, shadcn) |
| Docs registry: pages, order, navigation, links | `lib/docs.ts` |
| Markdown rendering ([marked](https://marked.js.org)) | `lib/markdown.ts` |
| Plumlang syntax highlighting | `lib/highlight.ts` |
| Metadata, Open Graph, JSON-LD | `lib/seo.ts`, `lib/site.ts` |
| Sitemap, robots, web manifest | `app/sitemap.ts`, `app/robots.txt/route.ts`, `app/manifest.ts` |
| llms.txt, llms-full.txt, Markdown copies | `lib/llm.ts`, `app/llms.txt/`, `app/llms-full.txt/`, `app/[...markdown]/` |
| Cloudflare Pages headers | `public/_headers` |
| Orchard packages | `scripts/sync-orchard.mjs`, `lib/orchard.ts`, `app/packages/` |

The spec is split at its numbered `##` sections; headings get GitHub's slugs,
so anchors written for GitHub keep working, and "section 9.4" in the text
links to that part of the spec. Links between docs files become site links,
and links to other files of the plumlang repository go to GitHub.

### Packages (Orchard)

`/packages/` is built from [plumlang/registry](https://github.com/plumlang/registry):
`search.json`, `index/NA/NAME.json`, and each package's newest bundle for its
README and licence. `scripts/sync-orchard.mjs` reads them into
`content/orchard.json` (not tracked) before every `npm run build` and
`npm run dev` (npm's `prebuild` and `predev`), from
`https://raw.githubusercontent.com/plumlang/registry/main` (or
`PLUM_ORCHARD`), else from a `../registry` checkout (or `ORCHARD_LOCAL`).
If neither can be read, the site builds with an empty list.
`npm run orchard:sync -- --offline` reads only the local checkout.

The pages are as fresh as the last deploy, so a publish to Orchard should
redeploy the site: see "Redeploying on a publish" below.

### The playground

`/playground/` runs the real `plum`, compiled to WebAssembly by plumlang's
`make wasm` (plumlang's `docs/playground.md` has its API). The two files are
committed in `public/playground/` (`plum.wasm` is about 480 KB, 190 KB
gzipped; `plum.js` 23 KB), so a build needs nothing from outside this tree;
`content/docs/source.json` records the plumlang commit and the hash of each.
Every plumlang release also publishes them as `plum-X.Y.Z-wasm.tar.gz`. To
update them, build them in the plumlang checkout and sync:

```bash
(cd ../plumlang && make wasm)      # emcc, or Docker with the pinned emsdk image
node scripts/sync-docs.mjs ../plumlang
```

| Part | Where |
|---|---|
| The page (one-line purpose, next link) | `app/playground/page.tsx` |
| The editor, Run / Format / Share, the output | `components/playground.tsx`: a textarea over two layers, the text highlighted by `lib/highlight.ts` and the diagnostics marked |
| plum itself | `public/playground/worker.js`, a module Web Worker that loads `plum.js`; Stop terminates it |
| The examples menu | `lib/playground.ts`: plumlang's `examples/` and the first runnable program of each tour step, without those that need files or the network |
| Share links | `lib/share.ts`: the program in the URL's hash, deflate-compressed with `CompressionStream` and base64url (`#code=z...`), so no server stores anything |
| Headers | `public/_headers`: `application/wasm`, and revalidation on every load, since the three files must match. No threads, so no COOP/COEP is needed. |

Runs are sandboxed with plum's limits: no files, network or commands, input
always at its end, and a stop after 50 million steps (about a second), 64 MB
or 5 seconds of sleeping.

`next.config.ts` sets `output: "export"` and `trailingSlash: true`: every page
is `out/<path>/index.html` and has exactly one URL, ending in `/`. Canonical
URLs, the sitemap and internal links all use that form.

## Development

Node.js 22 or later.

```bash
npm install
npm run dev          # http://localhost:3000
```

Before a pull request:

```bash
npm run lint
npm run typecheck
npm run build        # the static site, in out/
npm run site:check   # python3 scripts/check_site.py out
npm run samples:check -- path/to/plum   # the landing page's programs
```

`scripts/check_site.py` (Python standard library only) checks the exported
site: one `<h1>`, a title, a description, a canonical URL and social cards on
every page; every internal link and `#anchor`; the sitemap against the pages;
`robots.txt`; the files Cloudflare Pages needs; and, for every docs page, the
docs social card, the Markdown copy and its `<link rel="alternate">`, and the
text for "Copy for LLM". It checks `llms.txt` against the llmstxt.org shape
(and every link in it), that `llms-full.txt` holds every reference page, and
that `_headers` serves the installers and llms files as text.

## Deployment

Pushing to `main` deploys: `.github/workflows/deploy.yml` builds the site
with `npm run build` and publishes `out/` to the `plum-elixpo` Cloudflare
Pages project, which serves `plum.elixpo.com`. The CI and deploy workflows
are shared Elixpo workflows, synced from plumlang; change them there.

After a deploy, `.github/workflows/search-console.yml` submits the sitemap to
Google Search Console.

### Redeploying on a publish

The deploy workflow also runs on `workflow_dispatch`, so plumlang/registry's
publish and yank workflows can start it once they commit to `main`, with a
token that may run workflows here (a fine-grained token with Actions:
write on plumlang/plum.elixpo):

```sh
gh workflow run deploy.yml -R plumlang/plum.elixpo
```

### Deploying by hand with wrangler

`wrangler.toml` names the same Pages project (`plum-elixpo`, output `out/`),
so a maintainer can deploy from a checkout:

```sh
npm ci && npm run build && npm run site:check
npm run pages:dev          # serve out/ locally, with public/_headers applied
npm run deploy:preview     # a preview deployment (branch "preview")
npm run deploy             # production: plum.elixpo.com
```

The deploy scripts read `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`
from `.env.local` (`--env-file .env.local`), which git ignores. The committed
`.env` is the same file encrypted with sops for the keys in `.sops.yaml`;
decrypt it into `.env.local` with `sops decrypt .env > .env.local`.
`public/_headers` serves `/install.sh` and `/install.ps1` as `text/plain`
and `/playground/plum.wasm` as `application/wasm`.

## Related repositories

- [plumlang/plumlang](https://github.com/plumlang/plumlang): the language,
  its compiler and runtime, the specification and the library docs.
- [plumlang/branding](https://github.com/plumlang/branding): the brand system,
  the logo, icons and social cards, and editor support.

## Licence

Plumlang is licensed under the
[Apache License 2.0](https://github.com/plumlang/plumlang/blob/main/LICENSE),
with the
[Plumlang Commercial License 1.0](https://github.com/plumlang/plumlang/blob/main/LICENSES/preferred/LicenseRef-Plumlang-Commercial-1.0)
as an option (`Apache-2.0 OR LicenseRef-Plumlang-Commercial-1.0`).
"Plumlang", "Plum" and the Plumlang logo are trademarks of Elixpo, and
neither licence grants rights to them. Questions:
[hello@elixpo.com](mailto:hello@elixpo.com).
