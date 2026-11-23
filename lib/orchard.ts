// Orchard, Plumlang's package registry (plumlang/registry), for the
// /packages/ pages.
//
// scripts/sync-orchard.mjs reads the registry into content/orchard.json
// before every build (npm's prebuild): from GitHub, else from a ../registry
// checkout. The file is build output, not tracked; without it the site
// builds with no packages.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TOOL_PAGES } from "@/lib/docs";

export const ORCHARD_REPO_URL = "https://github.com/plumlang/registry";
export const ORCHARD_RAW_URL = "https://raw.githubusercontent.com/plumlang/registry/main";
export const PUBLISH_URL = `${ORCHARD_REPO_URL}#publishing-a-package`;

/** The Orchard guide on this site (docs/orchard.md), if the docs snapshot has it. */
export const ORCHARD_GUIDE = TOOL_PAGES.find((page) => page.slug.at(-1) === "orchard")?.path;

export type PackageVersion = {
  version: string;
  sha256: string;
  dependencies: Record<string, string>;
  /** The Plumlang versions it supports, like ">=2.1". */
  plum: string;
  /** ISO 8601, UTC. */
  published: string;
  yanked: boolean;
};

export type OrchardPackage = {
  name: string;
  description: string;
  /** https://github.com/OWNER/REPO, or "" if the index has none. */
  repository: string;
  /** GitHub logins. */
  owners: string[];
  keywords: string[];
  /** The newest version that isn't yanked (the newest, if all are). */
  latest: string;
  /** Every version is yanked. */
  yanked: boolean;
  license?: string;
  /** README.md from the latest version's bundle. */
  readme?: string;
  /** Newest first. */
  versions: PackageVersion[];
};

/** What the search on /packages/ needs of each package. */
export type PackageSummary = Pick<OrchardPackage, "name" | "description" | "keywords" | "latest" | "yanked"> & {
  published: string;
};

function load(): OrchardPackage[] {
  const file = join(process.cwd(), "content", "orchard.json");
  if (!existsSync(file)) return [];
  try {
    const data = JSON.parse(readFileSync(file, "utf8")) as { packages?: OrchardPackage[] };
    return Array.isArray(data.packages) ? data.packages : [];
  } catch {
    return [];
  }
}

export const PACKAGES: OrchardPackage[] = load();

const byName = new Map(PACKAGES.map((pkg) => [pkg.name, pkg]));

export const getPackage = (name: string) => byName.get(name);

export const latestVersion = (pkg: OrchardPackage) => pkg.versions.find((v) => v.version === pkg.latest) ?? pkg.versions[0];

export const summarizePackage = (pkg: OrchardPackage): PackageSummary => ({
  name: pkg.name,
  description: pkg.description,
  keywords: pkg.keywords,
  latest: pkg.latest,
  yanked: pkg.yanked,
  published: latestVersion(pkg)?.published ?? "",
});

/** The page of a package. */
export const packagePath = (name: string) => `/packages/${name}/`;

/** In code a `-` is written `_`: `seed hello_orchard`. */
export const seedName = (name: string) => name.replace(/-/g, "_");

/** "2026-11-16T08:28:11Z" -> "16 Nov 2026"; "" if it isn't a date. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** YYYY-MM-DD, for the sitemap; undefined if it isn't a date. */
export const isoDay = (iso: string) => (/^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : undefined);

/** The newest publish date in the registry, YYYY-MM-DD. */
export const REGISTRY_DATE: string | undefined =
  PACKAGES.flatMap((pkg) => pkg.versions.map((v) => isoDay(v.published) ?? ""))
    .sort()
    .pop() || undefined;
