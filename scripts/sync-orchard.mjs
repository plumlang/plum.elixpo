#!/usr/bin/env node
// Reads Orchard, Plumlang's package registry (plumlang/registry), into
// content/orchard.json for the /packages/ pages. It runs before every build
// and dev server (npm's prebuild and predev), so a deploy shows the registry
// as it is at that moment.
//
//   node scripts/sync-orchard.mjs              the registry on GitHub, else ../registry
//   node scripts/sync-orchard.mjs --offline    ../registry only
//
// Where it reads, in order:
//   1. PLUM_ORCHARD (the same variable plum reads), else
//      https://raw.githubusercontent.com/plumlang/registry/main;
//   2. a local checkout: ORCHARD_LOCAL, else ../registry.
// If neither answers, it writes an empty list and the site builds without
// packages: it never fails the build. Node built-ins only.
//
// The registry's layout (registry/README.md, plumlang docs/orchard.md):
//   search.json                       every package's name and newest version
//   index/NA/NAME.json                one package: owners, keywords, versions
//   packages/NAME/VERSION.plumpkg     a bundle: {"files": {...}, "format": 1, ...}
// The README and licence shown on a package's page come from the bundle of
// its newest version that isn't yanked.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(SITE_ROOT, "content", "orchard.json");
const DEFAULT_BASE = "https://raw.githubusercontent.com/plumlang/registry/main";
const BASE = (process.env.PLUM_ORCHARD || DEFAULT_BASE).replace(/\/+$/, "");
const LOCAL = resolve(process.env.ORCHARD_LOCAL || join(SITE_ROOT, "..", "registry"));
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;

// The registry's own rules (tools/orchard.py): what a name and a version look like.
const NAME = /^[a-z](?:[a-z0-9]|-(?=[a-z0-9])){1,39}$/;
const VERSION = /^\d+\.\d+\.\d+$/;

const offline = process.argv.includes("--offline");

const log = (message) => console.log(`sync-orchard: ${message}`);

async function fetchText(path) {
  try {
    const response = await fetch(`${BASE}/${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}

function readLocal(path) {
  const full = join(LOCAL, ...path.split("/"));
  try {
    return existsSync(full) ? readFileSync(full, "utf8") : null;
  } catch {
    return null;
  }
}

function parseJson(text) {
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const versionKey = (v) => v.split(".").map(Number);
const compareVersions = (a, b) => {
  const [x, y] = [versionKey(a), versionKey(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};

const strings = (value) => (Array.isArray(value) ? value.filter((s) => typeof s === "string") : []);
const text = (value) => (typeof value === "string" ? value : "");

/** The `license` in a plum.toml's [package] table, if it has one. */
function licenseOf(toml) {
  let inPackage = false;
  for (const line of toml.split("\n")) {
    const table = /^\s*\[([^\]]+)\]\s*$/.exec(line);
    if (table) {
      inPackage = table[1].trim() === "package";
      continue;
    }
    const match = inPackage && /^\s*license\s*=\s*"([^"]*)"/.exec(line);
    if (match) return match[1];
  }
  return undefined;
}

/** One package from its index file, newest version first; null if the file is unusable. */
async function readPackage(name, read) {
  const index = parseJson(await read(`index/${name.slice(0, 2)}/${name}.json`));
  if (!index || index.name !== name || !Array.isArray(index.versions)) return null;
  const versions = index.versions
    .filter((v) => v && typeof v.version === "string" && VERSION.test(v.version))
    .map((v) => ({
      version: v.version,
      sha256: text(v.sha256),
      dependencies: Object.fromEntries(
        Object.entries(v.dependencies && typeof v.dependencies === "object" ? v.dependencies : {}).filter(
          ([dep, range]) => NAME.test(dep) && typeof range === "string",
        ),
      ),
      plum: text(v.plum),
      published: text(v.published),
      yanked: v.yanked === true,
    }))
    .sort((a, b) => compareVersions(b.version, a.version));
  if (versions.length === 0) return null;
  const latest = versions.find((v) => !v.yanked) ?? versions[0];

  let readme;
  let license;
  const bundle = parseJson(await read(`packages/${name}/${latest.version}.plumpkg`));
  if (bundle && bundle.files && typeof bundle.files === "object") {
    if (typeof bundle.files["README.md"] === "string") readme = bundle.files["README.md"];
    if (typeof bundle.files["plum.toml"] === "string") license = licenseOf(bundle.files["plum.toml"]);
  }

  return {
    name,
    description: text(index.description),
    repository: /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(text(index.repository)) ? text(index.repository) : "",
    owners: strings(index.owners).filter((o) => /^[A-Za-z0-9-]{1,39}$/.test(o)),
    keywords: strings(index.keywords),
    latest: latest.version,
    yanked: versions.every((v) => v.yanked),
    license,
    readme,
    versions,
  };
}

async function main() {
  const sources = [];
  if (!offline) sources.push({ name: BASE, read: fetchText });
  sources.push({ name: LOCAL, read: async (path) => readLocal(path) });

  for (const source of sources) {
    const search = parseJson(await source.read("search.json"));
    if (!search || !Array.isArray(search.packages)) {
      log(`no search.json at ${source.name}`);
      continue;
    }
    const names = [...new Set(search.packages.map((p) => p && p.name).filter((n) => typeof n === "string" && NAME.test(n)))].sort();
    const packages = [];
    for (let i = 0; i < names.length; i += CONCURRENCY) {
      const batch = await Promise.all(names.slice(i, i + CONCURRENCY).map((name) => readPackage(name, source.read)));
      for (const [j, pkg] of batch.entries()) {
        if (pkg) packages.push(pkg);
        else log(`skipped ${names[i + j]}: its index file is missing or unreadable`);
      }
    }
    write({ source: source.name, packages });
    log(`${packages.length} package${packages.length === 1 ? "" : "s"} from ${source.name}`);
    return;
  }
  write({ source: null, packages: [] });
  log("the registry could not be read: /packages/ will list no packages");
}

function write(data) {
  writeFileSync(OUT_FILE, `${JSON.stringify(data, null, 2)}\n`);
}

main().catch((error) => {
  // Never fail the build over the registry.
  log(`failed: ${error instanceof Error ? error.message : error}`);
  write({ source: null, packages: [] });
});
