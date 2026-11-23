// The documentation's pages, built from content/ at build time.
//
// content/docs/ is the snapshot of plumlang's docs (scripts/sync-docs.mjs):
// the spec is split into one page per numbered section, each stdlib module
// is a page, the error codes are one page, and docs/reference.md (the whole
// language on one page) is /docs/reference/ once plumlang has it.
// content/tour/ and content/site/ are this site's own pages. Every page knows its file, so
// it can link to it for editing, and its neighbours, for previous / next.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, posix } from "node:path";
import { firstParagraph, githubSlug, plainText, summarize } from "@/lib/markdown";
import { REPO_URL } from "@/lib/site";

const CONTENT = join(process.cwd(), "content");

export type SectionId = "start" | "tour" | "language" | "stdlib" | "tools" | "reference";

export type DocPage = {
  /** Path segments under /docs/; [] is /docs/ itself. */
  slug: string[];
  /** The page's URL path, with its trailing slash. */
  path: string;
  /** The page's h1. */
  title: string;
  /** The <title>, before the site's " | Plumlang". */
  metaTitle: string;
  /** The label in the sidebar. */
  navTitle: string;
  description: string;
  section: SectionId;
  /** The small label above the title. */
  eyebrow: string;
  /** Where the page's text lives, for "Edit this page". */
  source: { repo: "plumlang" | "site"; path: string };
  /** The page's markdown, without its title. Empty for pages written in TSX. */
  markdown: string;
  /** Added to heading depths so the body starts at h2. */
  shift: number;
  /** The deepest heading level in "On this page". */
  tocDepth: 2 | 3;
  /** A note shown with the title, like "Stage 5". */
  badge?: string;
  /** One line under the title saying what the page is for. */
  lead?: string;
};

export type NavGroup = { id: SectionId; title: string; items: { title: string; path: string }[] };

export type Source = {
  sourceRepository: string;
  sourceCommit: string;
  sourceCommittedAt: string;
};

const read = (...parts: string[]) => readFileSync(join(CONTENT, ...parts), "utf8");

export const SOURCE: Source = JSON.parse(read("docs", "source.json"));

/** The snapshot's date, YYYY-MM-DD, for "last modified". */
export const SOURCE_DATE = SOURCE.sourceCommittedAt.slice(0, 10);

/** Splits `# Title` off the top of a markdown file. */
function splitTitle(markdown: string): { title: string; body: string } {
  const match = /^#\s+(.+)\n+/.exec(markdown);
  return match ? { title: match[1].trim(), body: markdown.slice(match[0].length) } : { title: "", body: markdown };
}

/** Simple front matter: `key: value` lines between --- fences. */
function frontMatter(markdown: string): { data: Record<string, string>; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n+/.exec(markdown);
  if (!match) return { data: {}, body: markdown };
  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const kv = /^([A-Za-z]+):\s*(.*)$/.exec(line);
    if (kv) data[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, "$1");
  }
  return { data, body: markdown.slice(match[0].length) };
}

/** Splits markdown at its `## ` headings, ignoring lines inside code fences. */
function splitSections(markdown: string): { intro: string; sections: { heading: string; body: string }[] } {
  const lines = markdown.split("\n");
  const sections: { heading: string; body: string[] }[] = [];
  const intro: string[] = [];
  let fence = false;
  for (const line of lines) {
    if (/^(```|~~~)/.test(line)) fence = !fence;
    if (!fence && line.startsWith("## ")) {
      sections.push({ heading: line.slice(3).trim(), body: [] });
    } else if (sections.length > 0) {
      sections[sections.length - 1].body.push(line);
    } else {
      intro.push(line);
    }
  }
  return {
    intro: intro.join("\n").trim(),
    sections: sections.map((s) => ({ heading: s.heading, body: s.body.join("\n").trim() })),
  };
}

const describe = (markdown: string, fallback: string) => summarize(firstParagraph(markdown) || fallback);

// ---------------------------------------------------------------------------
// Getting started

const overview: DocPage = {
  slug: [],
  path: "/docs/",
  title: "Plumlang documentation",
  metaTitle: "Documentation",
  navTitle: "Overview",
  description:
    "Plumlang's documentation: install, a beginner's tour, the language reference, the standard library and every error code, from the language's own specification.",
  section: "start",
  eyebrow: "Documentation",
  source: { repo: "site", path: "app/docs/page.tsx" },
  markdown: "",
  shift: 0,
  tocDepth: 2,
  lead: "Everything about Plumlang, in reading order: install it, learn it, then look things up.",
};

function sitePage(file: string, slug: string[], section: SectionId, eyebrow: string): DocPage {
  const { data, body } = frontMatter(read("site", file));
  const title = data.title ?? slug[slug.length - 1];
  return {
    slug,
    path: `/docs/${slug.join("/")}/`,
    title,
    metaTitle: data.metaTitle ?? title,
    navTitle: data.nav ?? title,
    description: data.description ?? describe(body, title),
    section,
    eyebrow,
    source: { repo: "site", path: `content/site/${file}` },
    markdown: body,
    shift: 0,
    tocDepth: 2,
    lead: data.lead,
  };
}

const install = sitePage("install.md", ["install"], "start", "Get started");
const agents = sitePage("agents.md", ["agents"], "reference", "Reference");

// ---------------------------------------------------------------------------
// The tour: content/tour/index.md, then NN-slug.md in order.

function tourPages(): DocPage[] {
  const dir = join(CONTENT, "tour");
  const files = readdirSync(dir).filter((f) => /^\d+-[a-z0-9-]+\.md$/.test(f)).sort();
  const pages: DocPage[] = [];
  const make = (file: string, slug: string[], step?: number): DocPage => {
    const { data, body } = frontMatter(read("tour", file));
    const title = data.title ?? slug[slug.length - 1];
    return {
      slug,
      path: `/docs/${slug.join("/")}/`,
      title,
      metaTitle: data.metaTitle ?? (step ? `${title} · Tour` : title),
      navTitle: data.nav ?? title,
      description: data.description ?? describe(body, title),
      section: "tour",
      eyebrow: step ? `Tour · Step ${step} of ${files.length}` : "Tour",
      source: { repo: "site", path: `content/tour/${file}` },
      markdown: body,
      shift: 0,
      tocDepth: 2,
      lead: data.lead,
    };
  };
  pages.push(make("index.md", ["tour"]));
  files.forEach((file, i) => pages.push(make(file, ["tour", file.replace(/^\d+-/, "").replace(/\.md$/, "")], i + 1)));
  return pages;
}

// ---------------------------------------------------------------------------
// The language reference: docs/spec.md, one page per "## N. Title" section.

const spec = splitTitle(read("docs", "spec.md"));
const specParts = splitSections(spec.body);

/** "8. Trees (Stage 5)" -> number "8", title "Trees", badge "Stage 5". */
function parseSpecHeading(heading: string) {
  const match = /^(\d+)\.\s+(.*?)(?:\s+\((Stage \d+)\))?$/.exec(heading);
  return match ? { number: match[1], title: match[2], badge: match[3] } : { number: "", title: heading, badge: undefined };
}

const languageIndex: DocPage = {
  slug: ["language"],
  path: "/docs/language/",
  title: "Language reference",
  metaTitle: "Language reference",
  navTitle: "Overview",
  description:
    "The Plumlang language specification, section by section: source text, types, expressions, statements, functions, trees, modules, errors, memory and tasks.",
  section: "language",
  eyebrow: spec.title || "The Plumlang Language Specification",
  source: { repo: "plumlang", path: "docs/spec.md" },
  markdown: specParts.intro,
  shift: 0,
  tocDepth: 2,
  lead: "The exact rules of the language: the specification, one section per page.",
};

const specPages: DocPage[] = specParts.sections.map(({ heading, body }) => {
  const { number, title, badge } = parseSpecHeading(heading);
  return {
    slug: ["language", githubSlug(title).replace(/-+/g, "-").replace(/^-|-$/g, "")],
    path: "",
    title,
    metaTitle: `${title} · Language reference`,
    navTitle: number ? `${number}. ${title}` : title,
    description: summarize(`${title}, section ${number} of the Plumlang language specification. ${firstParagraph(body)}`.trim()),
    section: "language" as const,
    eyebrow: number ? `Language reference · Section ${number}` : "Language reference",
    source: { repo: "plumlang" as const, path: "docs/spec.md" },
    markdown: body,
    shift: -1,
    tocDepth: 3 as const,
    badge,
  };
});
for (const page of specPages) page.path = `/docs/${page.slug.join("/")}/`;

// The overview ends with the list of sections.
languageIndex.markdown += `\n\n## Sections\n\n${specPages
  .map((page) => `- [${page.navTitle}](${page.path})${page.badge ? ` (${page.badge})` : ""}`)
  .join("\n")}\n`;

/** The page and anchor of each spec section number: "9" and "9.4". */
const sectionTargets = new Map<string, string>();
specParts.sections.forEach(({ heading, body }, i) => {
  const { number } = parseSpecHeading(heading);
  const page = specPages[i];
  if (number) sectionTargets.set(number, page.path);
  let fence = false;
  for (const line of body.split("\n")) {
    if (/^(```|~~~)/.test(line)) fence = !fence;
    const sub = !fence && /^###+\s+((\d+(?:\.\d+)+)\s.*)$/.exec(line);
    if (sub) sectionTargets.set(sub[2], `${page.path}#${githubSlug(sub[1])}`);
  }
});

/** The URL of a spec section ("9.4"), if there is one. */
export const specSectionUrl = (number: string) => sectionTargets.get(number);

// ---------------------------------------------------------------------------
// The standard library: docs/stdlib/README.md and one page per module, in
// the README's order; modules it doesn't list yet come after, by name.

const stdlibReadme = splitTitle(read("docs", "stdlib", "README.md"));
const stdlibFiles = readdirSync(join(CONTENT, "docs", "stdlib")).filter((f) => f.endsWith(".md") && f !== "README.md");

/** README order and descriptions: | [`math`](math.md) | what it is | */
const readmeRows = new Map<string, string>();
for (const line of stdlibReadme.body.split("\n")) {
  const row = /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/.exec(line);
  if (!row) continue;
  for (const link of row[1].matchAll(/\]\(([\w.-]+\.md)\)/g)) {
    if (!readmeRows.has(link[1])) readmeRows.set(link[1], plainText(row[2]));
  }
  for (const link of row[2].matchAll(/\]\(([\w.-]+\.md)\)/g)) {
    if (!readmeRows.has(link[1])) readmeRows.set(link[1], "");
  }
}
const stdlibOrder = [
  ...[...readmeRows.keys()].filter((f) => stdlibFiles.includes(f) && f !== "writing-a-module.md"),
  ...stdlibFiles.filter((f) => !readmeRows.has(f) && f !== "writing-a-module.md").sort(),
  ...(stdlibFiles.includes("writing-a-module.md") ? ["writing-a-module.md"] : []),
];

const stdlibIndex: DocPage = {
  slug: ["stdlib"],
  path: "/docs/stdlib/",
  title: stdlibReadme.title || "The standard library",
  metaTitle: "Standard library",
  navTitle: "Overview",
  description:
    "Plumlang's standard library: math, strings, io, os, time, files, JSON, tasks and channels, TCP and UDP networking, and an HTTP server and client.",
  section: "stdlib",
  eyebrow: "Standard library",
  source: { repo: "plumlang", path: "docs/stdlib/README.md" },
  markdown: stdlibReadme.body,
  shift: 0,
  tocDepth: 2,
  lead: "The modules built into plum: numbers, text, files, time, JSON, tasks, sockets and HTTP.",
};

const stdlibPages: DocPage[] = stdlibOrder.map((file) => {
  const name = file.replace(/\.md$/, "");
  const { title, body } = splitTitle(read("docs", "stdlib", file));
  const isModule = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(title) && !file.includes("methods");
  const summary = readmeRows.get(file);
  const shown = title || name;
  return {
    slug: ["stdlib", name.replace(/\./g, "-")],
    path: `/docs/stdlib/${name.replace(/\./g, "-")}/`,
    title: shown,
    metaTitle: summary?.startsWith("the methods of")
      ? `${shown} methods · Standard library`
      : `${isModule ? `${shown} module` : shown} · Standard library`,
    navTitle: name === "writing-a-module" ? "Writing a module" : shown,
    description: summary
      ? summarize(`The Plumlang ${shown}${isModule && !summary.startsWith("the methods of") ? " module" : ""}: ${summary}. ${firstParagraph(body)}`.trim())
      : describe(body, `${shown}, in the Plumlang standard library.`),
    section: "stdlib" as const,
    eyebrow: name === "writing-a-module" ? "Standard library · Contributing" : isModule ? "Standard library · Module" : "Standard library",
    source: { repo: "plumlang" as const, path: `docs/stdlib/${file}` },
    markdown: body,
    shift: 0,
    tocDepth: 2 as const,
  };
});

// ---------------------------------------------------------------------------
// Error codes: docs/errors.md, one page with an anchor per code.

const errors = splitTitle(read("docs", "errors.md"));
const errorsPage: DocPage = {
  slug: ["errors"],
  path: "/docs/errors/",
  title: "Error codes",
  metaTitle: "Error codes",
  navTitle: "Error codes",
  description:
    "Every Plumlang compiler error code, from E0101 on, with an example that causes it and the fix. Each code has its own anchor, like /docs/errors/#E0401.",
  section: "reference",
  eyebrow: "Reference",
  source: { repo: "plumlang", path: "docs/errors.md" },
  markdown: errors.body,
  shift: 0,
  tocDepth: 2,
  lead: "Every compiler error code, with an example that causes it and the fix.",
};

// ---------------------------------------------------------------------------
// The whole language on one page: docs/reference.md (plumlang#87), when the
// snapshot has it. Until then there is no /docs/reference/.

const REFERENCE_FILE = join(CONTENT, "docs", "reference.md");
const referencePage: DocPage | undefined = existsSync(REFERENCE_FILE)
  ? (() => {
      const { title, body } = splitTitle(read("docs", "reference.md"));
      return {
        slug: ["reference"],
        path: "/docs/reference/",
        title: title || "Plumlang on one page",
        metaTitle: "The whole language on one page",
        navTitle: "On one page",
        description: describe(body, "The whole Plumlang language on one page: syntax, types, functions, trees, modules, errors and tasks."),
        section: "reference" as const,
        eyebrow: "Reference",
        source: { repo: "plumlang" as const, path: "docs/reference.md" },
        markdown: body,
        shift: 0,
        tocDepth: 2 as const,
        lead: "The whole language on one page, for a quick read or for a coding agent.",
      };
    })()
  : undefined;

/** The one-page reference, if the snapshot has docs/reference.md. */
export const REFERENCE_PAGE = referencePage;

// ---------------------------------------------------------------------------
// Tools: the guides to Orchard, the language server, the REPL and the
// WebAssembly build, each one page, when the snapshot has them.

const TOOL_GUIDES: { file: string; slug: string; nav: string; metaTitle: string; lead: string }[] = [
  {
    file: "orchard.md",
    slug: "orchard",
    nav: "Packages (Orchard)",
    metaTitle: "Orchard packages",
    lead: "Find, add and publish packages with the plum command and the Orchard registry.",
  },
  {
    file: "lsp.md",
    slug: "lsp",
    nav: "Language server",
    metaTitle: "The language server",
    lead: "plum lsp: errors as you type, hover, go to definition and completion in any editor.",
  },
  { file: "repl.md", slug: "repl", nav: "REPL", metaTitle: "The REPL", lead: "Type Plumlang at a prompt and see each result at once." },
  {
    file: "playground.md",
    slug: "wasm",
    nav: "WebAssembly",
    metaTitle: "Plumlang in the browser",
    lead: "Run Plumlang in a web page with the WebAssembly build, as the playground does.",
  },
];

const toolPages: DocPage[] = TOOL_GUIDES.filter((guide) => existsSync(join(CONTENT, "docs", guide.file))).map((guide) => {
  const { title, body } = splitTitle(read("docs", guide.file));
  const shown = title || guide.nav;
  return {
    slug: ["tools", guide.slug],
    path: `/docs/tools/${guide.slug}/`,
    title: shown,
    metaTitle: `${guide.metaTitle} · Tools`,
    navTitle: guide.nav,
    description: describe(body, shown),
    section: "tools" as const,
    eyebrow: "Tools",
    source: { repo: "plumlang" as const, path: `docs/${guide.file}` },
    markdown: body,
    shift: 0,
    tocDepth: 2 as const,
    lead: guide.lead,
  };
});

// ---------------------------------------------------------------------------

const tour = tourPages();

/**
 * Every docs page, in reading order (previous / next follow it): install,
 * learn, then the reference, ending with the page for coding agents.
 */
export const DOC_PAGES: DocPage[] = [
  overview,
  install,
  ...tour,
  languageIndex,
  ...specPages,
  stdlibIndex,
  ...stdlibPages,
  ...toolPages,
  ...(referencePage ? [referencePage] : []),
  errorsPage,
  agents,
];

export const NAV: NavGroup[] = [
  {
    id: "start",
    title: "Get started",
    items: [
      { title: overview.navTitle, path: overview.path },
      { title: install.navTitle, path: install.path },
      { title: "Playground", path: "/playground/" },
    ],
  },
  { id: "tour", title: "Tour", items: tour.map((p) => ({ title: p.navTitle, path: p.path })) },
  {
    id: "language",
    title: "Language reference",
    items: [languageIndex, ...specPages].map((p) => ({ title: p.navTitle, path: p.path })),
  },
  {
    id: "stdlib",
    title: "Standard library",
    items: [stdlibIndex, ...stdlibPages].map((p) => ({ title: p.navTitle, path: p.path })),
  },
  ...(toolPages.length > 0
    ? [{ id: "tools" as const, title: "Tools", items: toolPages.map((p) => ({ title: p.navTitle, path: p.path })) }]
    : []),
  {
    id: "reference",
    title: "Reference",
    items: [...(referencePage ? [referencePage] : []), errorsPage, agents].map((p) => ({ title: p.navTitle, path: p.path })),
  },
];

export const SECTION_TITLES: Record<SectionId, { title: string; path: string }> = {
  start: { title: "Get started", path: "/docs/" },
  tour: { title: "Tour", path: "/docs/tour/" },
  language: { title: "Language reference", path: "/docs/language/" },
  stdlib: { title: "Standard library", path: "/docs/stdlib/" },
  tools: { title: "Tools", path: (toolPages[0] ?? stdlibIndex).path },
  reference: { title: "Reference", path: (referencePage ?? errorsPage).path },
};

export const SPEC_SECTIONS = specPages;
export const STDLIB_MODULES = stdlibPages;
export const TOUR_PAGES = tour;
export const ERRORS_PAGE = errorsPage;
export const AGENTS_PAGE = agents;
export const INSTALL_PAGE = install;
export const LANGUAGE_INDEX = languageIndex;
export const STDLIB_INDEX = stdlibIndex;
export const TOOL_PAGES = toolPages;

/** Where a page's Markdown copy is served: the page's URL plus index.md. */
export const markdownPath = (page: DocPage) => `${page.path}index.md`;

const byPath = new Map(DOC_PAGES.map((page) => [page.path, page]));

export function getDocPage(slug: string[]): DocPage | undefined {
  return byPath.get(slug.length === 0 ? "/docs/" : `/docs/${slug.join("/")}/`);
}

export function neighbours(page: DocPage): { previous?: DocPage; next?: DocPage } {
  const i = DOC_PAGES.indexOf(page);
  return { previous: i > 0 ? DOC_PAGES[i - 1] : undefined, next: i < DOC_PAGES.length - 1 ? DOC_PAGES[i + 1] : undefined };
}

/** When the page's text last changed, as far as the site knows. */
export const lastModified = (page: DocPage) => (page.source.repo === "plumlang" ? SOURCE_DATE : SITE_CONTENT_DATE);

/** The date the site's own pages (tour, install) were last revised. */
export const SITE_CONTENT_DATE = "2026-11-15";

// ---------------------------------------------------------------------------
// Links inside the snapshot are written for GitHub: `net.md#tls`,
// `../../AGENTS.md`. Pages of the site become site links; anything else
// links to the file on GitHub.

const repoPathToUrl = new Map<string, string>([
  ["docs/spec.md", languageIndex.path],
  ["docs/errors.md", errorsPage.path],
  ["docs/stdlib/README.md", stdlibIndex.path],
  ...(referencePage ? [["docs/reference.md", referencePage.path] as [string, string]] : []),
  ...stdlibPages.map((p) => [p.source.path, p.path] as [string, string]),
  ...toolPages.map((p) => [p.source.path, p.path] as [string, string]),
]);

/** Where a GitHub anchor in docs/spec.md lives on the site: "#52-if" is on the Statements page. */
const specAnchors = new Map<string, string>();
specParts.sections.forEach(({ heading, body }, i) => {
  specAnchors.set(githubSlug(heading), specPages[i].path);
  let fence = false;
  for (const line of body.split("\n")) {
    if (/^(```|~~~)/.test(line)) fence = !fence;
    const sub = !fence && /^###+\s+(.*)$/.exec(line);
    if (sub) specAnchors.set(githubSlug(sub[1]), specPages[i].path);
  }
});

export function resolveDocLink(href: string, fromRepoPath: string): string | null {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//") || href.startsWith("/")) return href;
  const [pathPart, hashPart] = href.split("#", 2);
  const hash = hashPart === undefined ? "" : `#${/^[ew]\d{4}$/i.test(hashPart) ? hashPart.toUpperCase() : hashPart}`;
  if (pathPart === "") {
    // The spec is split into pages, so its own anchors may be on another one.
    const page = fromRepoPath === "docs/spec.md" && hashPart ? specAnchors.get(hashPart) : undefined;
    return page ? `${page}${hash}` : hash;
  }
  const target = posix.normalize(posix.join(posix.dirname(fromRepoPath), pathPart));
  if (target === "docs/spec.md" && hashPart && specAnchors.has(hashPart)) return `${specAnchors.get(hashPart)}#${hashPart}`;
  const site = repoPathToUrl.get(target);
  if (site) return `${site}${hash}`;
  // Text like Channel[T](capacity) reads as a link; a target with no file
  // extension and no slash is not a file, so it stays text.
  if (!pathPart.includes(".") && !pathPart.includes("/")) return null;
  return `${REPO_URL}/blob/main/${target}${hash}`;
}
