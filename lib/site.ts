// Facts about the site and the project, in one place.

export const SITE_URL = "https://plum.elixpo.com";
export const SITE_NAME = "Plumlang";
export const SITE_TAGLINE = "A small, fast, memory-safe programming language";
export const SITE_DESCRIPTION =
  "Plumlang is a small, fast, memory-safe programming language with easy syntax, static types, tasks and a built-in HTTP server, shipped as one binary. An Elixpo production.";

export const REPO_URL = "https://github.com/plumlang/plumlang";
export const SITE_REPO_URL = "https://github.com/plumlang/plum.elixpo";
export const BRANDING_REPO_URL = "https://github.com/plumlang/branding";
export const RELEASES_URL = `${REPO_URL}/releases`;
export const ROADMAP_URL = `${REPO_URL}/issues/36`;
export const INSTALLERS_ISSUE_URL = `${REPO_URL}/issues/33`;
export const BENCH_URL = `${REPO_URL}/blob/main/bench/README.md`;
export const EXAMPLES_URL = `${REPO_URL}/tree/main/examples`;
export const CONTRIBUTING_URL = `${REPO_URL}/blob/main/CONTRIBUTING.md`;
export const PLAYGROUND_ISSUE_URL = `${REPO_URL}/issues/32`;
export const PLAYGROUND_DOCS_URL = `${REPO_URL}/blob/main/docs/playground.md`;
export const DISCUSSIONS_URL = `${REPO_URL}/discussions`;
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;
export const ELIXPO_URL = "https://elixpo.com";
export const CONTACT_EMAIL = "hello@elixpo.com";

/** Plumlang's creators, in this order (as in plumlang's CITATION.cff). */
export const CREATORS = ["Ayushman Bhattacharya", "Subhro Koley", "Rohan Hudati"] as const;

/** "A, B and C". */
export const CREATORS_TEXT = `${CREATORS.slice(0, -1).join(", ")} and ${CREATORS[CREATORS.length - 1]}`;

/** The absolute URL of a site path. */
export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

/** A GitHub link that edits a file of the plumlang repository on main. */
export const editUrl = (path: string) => `${REPO_URL}/edit/main/${path}`;

/** A GitHub link that edits a file of this website's repository on main. */
export const siteEditUrl = (path: string) => `${SITE_REPO_URL}/edit/main/${path}`;

/** The one-line installers, served by this site (public/, synced from plumlang). */
export const INSTALL_SH_URL = `${SITE_URL}/install.sh`;
export const INSTALL_PS1_URL = `${SITE_URL}/install.ps1`;
export const INSTALL_COMMANDS = {
  unix: `curl -fsSL ${INSTALL_SH_URL} | sh`,
  windows: `irm ${INSTALL_PS1_URL} | iex`,
  source: `git clone ${REPO_URL}\ncd plumlang && make`,
  /** Not published yet: shown as "coming soon", never as working. */
  homebrew: "brew install plumlang/tap/plum",
  winget: "winget install Elixpo.Plumlang",
} as const;

/** The documentation for language models (llmstxt.org). */
export const LLMS_TXT_PATH = "/llms.txt";
export const LLMS_FULL_PATH = "/llms-full.txt";

export const PRIMARY_NAV = [
  { href: "/docs/install/", label: "Install" },
  { href: "/docs/tour/", label: "Tour" },
  { href: "/docs/", label: "Docs" },
  { href: "/docs/stdlib/", label: "Library" },
  { href: "/playground/", label: "Playground" },
  { href: "/packages/", label: "Packages" },
] as const;
