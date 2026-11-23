#!/usr/bin/env node
// Copies Plumlang's documentation from a plumlang checkout into content/docs/
// as a reviewed snapshot, and records the commit it came from. When the
// checkout has them, it also copies docs/reference.md (the whole language on
// one page) and the installers in tools/install/ into public/, so the site
// serves them at /install.sh and /install.ps1.
//
//   node scripts/sync-docs.mjs [path-to-plumlang]          refresh the snapshot
//   node scripts/sync-docs.mjs [path-to-plumlang] --check  fail if it is stale
//
// The path defaults to ../plumlang. Node built-ins only; the site build never
// fetches documentation itself, so a build is reproducible from this tree.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY = "https://github.com/plumlang/plumlang";
const SITE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(SITE_ROOT, "content", "docs");
const PUBLIC_DIR = join(SITE_ROOT, "public");

const args = process.argv.slice(2);
const check = args.includes("--check");
const allowDirty = args.includes("--allow-dirty");
const unknown = args.filter((a) => a.startsWith("-") && a !== "--check" && a !== "--allow-dirty");
if (unknown.length > 0) {
  fail(`unknown option ${unknown.join(", ")}\nusage: node scripts/sync-docs.mjs [path-to-plumlang] [--check] [--allow-dirty]`);
}
const source = resolve(args.find((a) => !a.startsWith("-")) ?? join(SITE_ROOT, "..", "plumlang"));

function fail(message) {
  console.error(`sync-docs: ${message}`);
  process.exit(1);
}

function git(...gitArgs) {
  return execFileSync("git", ["-C", source, ...gitArgs], { encoding: "utf8" }).trim();
}

if (!existsSync(join(source, "docs", "spec.md"))) {
  fail(`${source} does not look like a plumlang checkout (no docs/spec.md)`);
}

// The tool guides (Orchard, the language server, the REPL, WebAssembly),
// copied when the checkout has them; lib/docs.ts makes each a page.
const TOOL_DOCS = ["docs/orchard.md", "docs/lsp.md", "docs/repl.md", "docs/playground.md"];

// Which files make up the snapshot, relative to the plumlang repository.
// docs/reference.md arrives with plumlang#87; until then it is skipped.
function sourceFiles() {
  const files = ["docs/spec.md", "docs/errors.md"];
  if (existsSync(join(source, "docs", "reference.md"))) files.push("docs/reference.md");
  for (const path of TOOL_DOCS) if (existsSync(join(source, path))) files.push(path);
  const stdlib = join(source, "docs", "stdlib");
  for (const name of readdirSync(stdlib).sort()) {
    if (name.endsWith(".md")) files.push(`docs/stdlib/${name}`);
  }
  return files;
}

let commit;
let committedAt;
try {
  commit = git("rev-parse", "HEAD");
  committedAt = git("log", "-1", "--format=%cI", "HEAD");
} catch {
  fail(`${source} is not a git checkout; the snapshot must record a commit`);
}

// The installers (plumlang#33), copied byte for byte into public/. A checkout
// without tools/install/ leaves public/ as it is.
function installerFiles() {
  const dir = join(source, "tools", "install");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => /^install\.(sh|ps1)$/.test(name))
    .sort()
    .map((name) => `tools/install/${name}`);
}

const dirty = git("status", "--porcelain", "--", "docs", "tools/install");
if (dirty && !allowDirty) {
  fail(`docs/ in ${source} has uncommitted changes:\n${dirty}\nCommit them first, or pass --allow-dirty for a local preview.`);
}

const files = sourceFiles();
const expected = new Map();
const manifest = [];
for (const path of files) {
  const text = readFileSync(join(source, path), "utf8").replace(/\r\n/g, "\n");
  const target = path.replace(/^docs\//, "");
  expected.set(target, text);
  manifest.push({ path, sha256: createHash("sha256").update(text).digest("hex") });
}

/** public/ files from the checkout: site path -> bytes. */
const installers = installerFiles();
const expectedPublic = new Map();
for (const path of installers) {
  const bytes = readFileSync(join(source, path));
  expectedPublic.set(path.replace(/^tools\/install\//, ""), bytes);
  manifest.push({ path, sha256: createHash("sha256").update(bytes).digest("hex"), servedAt: `/${path.split("/").pop()}` });
}
const provenance = {
  sourceRepository: REPOSITORY,
  sourceCommit: commit,
  sourceCommittedAt: committedAt,
  dirty: Boolean(dirty),
  files: manifest,
};
expected.set("source.json", `${JSON.stringify(provenance, null, 2)}\n`);

// Files currently in content/docs/, relative to it, with forward slashes.
function currentFiles(dir = OUT_DIR) {
  if (!existsSync(dir)) return [];
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...currentFiles(full));
    else found.push(relative(OUT_DIR, full).split(sep).join("/"));
  }
  return found;
}

const stale = currentFiles().filter((path) => !expected.has(path));

if (check) {
  let problems = 0;
  for (const [path, text] of expected) {
    const full = join(OUT_DIR, path);
    const current = existsSync(full) ? readFileSync(full, "utf8") : null;
    if (current === null) {
      console.error(`missing:  content/docs/${path}`);
      problems++;
    } else if (current !== text) {
      console.error(`changed:  content/docs/${path}`);
      problems++;
    }
  }
  for (const path of stale) {
    console.error(`removed upstream: content/docs/${path}`);
    problems++;
  }
  for (const [name, bytes] of expectedPublic) {
    const full = join(PUBLIC_DIR, name);
    if (!existsSync(full) || !readFileSync(full).equals(bytes)) {
      console.error(`${existsSync(full) ? "changed: " : "missing: "} public/${name}`);
      problems++;
    }
  }
  if (problems > 0) {
    fail(`the snapshot differs from ${commit.slice(0, 12)}; run node scripts/sync-docs.mjs ${args.filter((a) => !a.startsWith("-")).join(" ") || "../plumlang"} and review the changes`);
  }
  console.log(`content/docs/ matches plumlang ${commit.slice(0, 12)} (${files.length} files, ${installers.length} installers)`);
} else {
  for (const path of stale) {
    rmSync(join(OUT_DIR, path));
    console.log(`removed  content/docs/${path}`);
  }
  for (const [path, text] of expected) {
    const full = join(OUT_DIR, path);
    mkdirSync(dirname(full), { recursive: true });
    const current = existsSync(full) ? readFileSync(full, "utf8") : null;
    if (current !== text) {
      writeFileSync(full, text);
      console.log(`${current === null ? "added   " : "updated "} content/docs/${path}`);
    }
  }
  for (const [name, bytes] of expectedPublic) {
    const full = join(PUBLIC_DIR, name);
    const current = existsSync(full) ? readFileSync(full) : null;
    if (current === null || !current.equals(bytes)) {
      writeFileSync(full, bytes);
      console.log(`${current === null ? "added   " : "updated "} public/${name}`);
    }
  }
  if (installers.length === 0) console.log("no tools/install/ in the checkout: public/install.* left as they are");
  console.log(`content/docs/ is plumlang ${commit.slice(0, 12)}${dirty ? " (with uncommitted changes)" : ""}`);
}
