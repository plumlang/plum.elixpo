// The documentation as Markdown, for language models and coding agents.
//
// Three outputs, all built from content/ at build time:
//   - pageMarkdown(page): one docs page, served at the page's URL plus
//     index.md (app/[...markdown]/route.ts) and copied by "Copy for LLM";
//   - llmsTxt(): /llms.txt, an index in the llmstxt.org format;
//   - llmsFullTxt(): /llms-full.txt, every page in reading order.
// Links are made absolute, so the Markdown works anywhere it is pasted.

import {
  AGENTS_PAGE,
  DOC_PAGES,
  ERRORS_PAGE,
  INSTALL_PAGE,
  LANGUAGE_INDEX,
  NAV,
  REFERENCE_PAGE,
  SOURCE,
  SPEC_SECTIONS,
  STDLIB_INDEX,
  STDLIB_MODULES,
  TOOL_PAGES,
  TOUR_PAGES,
  markdownPath,
  resolveDocLink,
  type DocPage,
} from "@/lib/docs";
import { INSTALL_COMMANDS, LLMS_FULL_PATH, REPO_URL, SITE_DESCRIPTION, SITE_URL, absoluteUrl } from "@/lib/site";

const FENCE = /^(```|~~~)/;
const INLINE_LINK = /(!?\[[^\]]*\])\(([^)\s]+)(\s+"[^"]*")?\)/g;

/** An absolute URL for a link in a page, or null when it isn't a link. */
function absoluteLink(href: string, page: DocPage): string | null {
  const resolved = page.source.repo === "plumlang" ? resolveDocLink(href, page.source.path) : href;
  if (resolved === null) return null;
  if (resolved.startsWith("#")) return `${absoluteUrl(page.path)}${resolved}`;
  if (resolved.startsWith("/")) return absoluteUrl(resolved);
  return resolved;
}

/**
 * The page's Markdown as written, with absolute links, headings moved so
 * the body starts at ##, and generator comments removed. Code blocks and
 * inline code are left exactly as they are.
 */
function cleanBody(page: DocPage): string {
  let fence = false;
  const out: string[] = [];
  for (const line of page.markdown.split("\n")) {
    if (FENCE.test(line)) {
      fence = !fence;
      out.push(line);
      continue;
    }
    if (fence) {
      out.push(line);
      continue;
    }
    // Generator markers go, with the blank line they would leave.
    if (/^\s*<!--.*-->\s*$/.test(line)) continue;
    if (line.trim() === "" && out.length > 0 && out[out.length - 1].trim() === "") continue;
    let text = line;
    const heading = /^(#{2,6})(\s.*)$/.exec(text);
    if (heading && page.shift !== 0) {
      text = `${"#".repeat(Math.min(6, Math.max(2, heading[1].length + page.shift)))}${heading[2]}`;
    }
    // Rewrite links, but not text inside `inline code` that looks like one.
    const code = [...text.matchAll(/`[^`]*`/g)].map((m) => [m.index, m.index + m[0].length]);
    const inCode = (at: number) => code.some(([start, end]) => at > start && at < end);
    text = text.replace(INLINE_LINK, (whole, label: string, href: string, title: string | undefined, at: number) => {
      if (inCode(at)) return whole;
      const target = absoluteLink(href, page);
      return target === null ? whole : `${label}(${target}${title ?? ""})`;
    });
    out.push(text);
  }
  return out.join("\n").trim();
}

/** The docs overview, written out: every section and its pages. */
function overviewBody(): string {
  const byPath = new Map(DOC_PAGES.map((page) => [page.path, page]));
  return NAV.map((group) => {
    const items = group.items.map((item) => {
      const page = byPath.get(item.path);
      const description = page ? `: ${page.description}` : "";
      return `- [${page?.title ?? item.title}](${absoluteUrl(item.path)})${description}`;
    });
    return `## ${group.title}\n\n${items.join("\n")}`;
  }).join("\n\n");
}

/** One docs page as Markdown: its URL on the first line, then its title and text. */
export function pageMarkdown(page: DocPage): string {
  const body = page.markdown ? cleanBody(page) : overviewBody();
  const lead = page.lead ? `> ${page.lead}\n\n` : "";
  return `Source: ${absoluteUrl(page.path)}\n\n# ${page.title}\n\n${lead}${body}\n`;
}

/** A link line for llms.txt: the page's Markdown and its description. */
const indexLine = (page: DocPage) => `- [${page.title}](${absoluteUrl(markdownPath(page))}): ${page.description}`;

const SUMMARY = SITE_DESCRIPTION;

const FACTS = `Plumlang source files end in \`.plum\`. \`plum check FILE\` reports every error without running anything; \`plum run FILE\` runs a program; \`plum stdlib MODULE\` lists a module's functions. Keywords keep a garden theme: \`plant\` (variable), \`root\` (constant), \`branch\` (function), \`tree\` (class), \`seed\` (import), \`drop\` (print), \`good\` / \`bad\` (true / false). Plumlang is new: read the documentation instead of guessing its syntax from other languages. Every docs page is also available as Markdown at its URL plus \`index.md\`.`;

/** /llms.txt, in the llmstxt.org format. */
export function llmsTxt(): string {
  const sections: [string, DocPage[]][] = [
    ["Start", [INSTALL_PAGE, ...(REFERENCE_PAGE ? [REFERENCE_PAGE] : []), AGENTS_PAGE]],
    ["Tour", TOUR_PAGES],
    ["Language specification", [LANGUAGE_INDEX, ...SPEC_SECTIONS]],
    ["Standard library", [STDLIB_INDEX, ...STDLIB_MODULES]],
    ...(TOOL_PAGES.length > 0 ? [["Tools", TOOL_PAGES] as [string, DocPage[]]] : []),
    ["Error codes", [ERRORS_PAGE]],
  ];
  const parts = [
    "# Plumlang",
    `> ${SUMMARY}`,
    FACTS,
    ...sections.map(([title, pages]) => `## ${title}\n\n${pages.map(indexLine).join("\n")}`),
    `## Optional\n\n- [All of the documentation in one file](${absoluteUrl(LLMS_FULL_PATH)}): ${fullContents()}\n- [Source code](${REPO_URL}): the compiler, the virtual machine, the standard library, examples and tests.\n- [Examples](${REPO_URL}/tree/main/examples): small complete programs, each with its expected output.`,
  ];
  return `${parts.join("\n\n")}\n`;
}

/** What llms-full.txt holds, in order. */
function fullContents(): string {
  return `${REFERENCE_PAGE ? "the whole language on one page, then " : ""}the tour, the language specification, the standard library, ${TOOL_PAGES.length > 0 ? "the tools (packages, language server, REPL, WebAssembly), " : ""}and every error code, as Markdown.`;
}

/** /llms-full.txt: the documentation as one Markdown file. */
export function llmsFullTxt(): string {
  const pages: DocPage[] = [
    ...(REFERENCE_PAGE ? [REFERENCE_PAGE] : []),
    ...TOUR_PAGES,
    LANGUAGE_INDEX,
    ...SPEC_SECTIONS,
    STDLIB_INDEX,
    ...STDLIB_MODULES,
    ...TOOL_PAGES,
    ERRORS_PAGE,
  ];
  const header = [
    "# Plumlang documentation",
    `> ${SUMMARY}`,
    FACTS,
    `Install: \`${INSTALL_COMMANDS.unix}\` (Linux, macOS) or \`${INSTALL_COMMANDS.windows}\` (Windows PowerShell). Details: ${absoluteUrl(INSTALL_PAGE.path)}`,
    `This file holds ${fullContents()} It is generated from ${SITE_URL} and the docs of ${REPO_URL} at commit ${SOURCE.sourceCommit.slice(0, 12)}. Each part starts with the URL of its page.`,
  ].join("\n\n");
  return `${[header, ...pages.map((page) => pageMarkdown(page).trimEnd())].join("\n\n---\n\n")}\n`;
}
