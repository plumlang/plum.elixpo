import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DocFooter, DocHeader } from "@/components/doc-parts";
import { JsonLd } from "@/components/json-ld";
import {
  AGENTS_PAGE,
  DOC_PAGES,
  ERRORS_PAGE,
  INSTALL_PAGE,
  LANGUAGE_INDEX,
  REFERENCE_PAGE,
  SOURCE,
  STDLIB_INDEX,
  TOOL_PAGES,
  TOUR_PAGES,
  markdownPath,
  neighbours,
} from "@/lib/docs";
import { pageMarkdown } from "@/lib/llm";
import { ORGANIZATION, breadcrumbList, pageMetadata } from "@/lib/seo";
import { REPO_URL, absoluteUrl, siteEditUrl } from "@/lib/site";

const overview = DOC_PAGES[0];

export const metadata: Metadata = pageMetadata({
  title: overview.metaTitle,
  description: overview.description,
  path: overview.path,
  markdown: markdownPath(overview),
});

/** The documentation in reading order: one line each, saying what it is for. */
const entries = [
  { href: INSTALL_PAGE.path, title: "Install", text: "One command on Linux, macOS or Windows, or build from source." },
  { href: TOUR_PAGES[0].path, title: "Tour", text: `Learn the language in ${TOUR_PAGES.length - 1} short steps, from hello world to a web server.` },
  { href: LANGUAGE_INDEX.path, title: "Language reference", text: "The specification, one section per page: the exact rules." },
  { href: STDLIB_INDEX.path, title: "Standard library", text: "Every built-in module, with its functions and examples." },
  ...(TOOL_PAGES.length > 0
    ? [{ href: TOOL_PAGES[0].path, title: "Tools", text: "Orchard packages, the language server, the REPL and the WebAssembly build." }]
    : []),
  ...(REFERENCE_PAGE
    ? [{ href: REFERENCE_PAGE.path, title: "On one page", text: "The whole language on one page." }]
    : []),
  { href: ERRORS_PAGE.path, title: "Error codes", text: "What each compiler error means, with an example and the fix." },
  { href: AGENTS_PAGE.path, title: "Coding agents", text: "llms.txt, llms-full.txt and an AGENTS.md snippet for your project." },
  { href: "/playground/", title: "Playground", text: "Run Plumlang in your browser, and share a program as a link." },
];

export default function DocsOverview() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Docs", path: "/docs/" },
  ];
  const { next } = neighbours(overview);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl("/docs/")}#page`,
        name: overview.title,
        description: overview.description,
        url: absoluteUrl("/docs/"),
        isPartOf: { "@type": "WebSite", "@id": `${absoluteUrl("/")}#website` },
        publisher: ORGANIZATION,
        hasPart: DOC_PAGES.slice(1).map((page) => ({ "@type": "TechArticle", name: page.title, url: absoluteUrl(page.path) })),
      },
      breadcrumbList(crumbs),
    ],
  };

  return (
    <main className="min-w-0 py-8 lg:py-10">
      <JsonLd data={structuredData} />
      <DocHeader
        crumbs={crumbs}
        eyebrow={overview.eyebrow}
        title={overview.title}
        lead={overview.lead}
        next={next}
        markdown={pageMarkdown(overview)}
      />

      <ol className="mt-2 max-w-3xl">
        {entries.map((entry, i) => (
          <li key={entry.href} className="border-b">
            <Link
              href={entry.href}
              className="group grid grid-cols-[2.5rem_minmax(0,1fr)_1.5rem] items-baseline gap-3 py-5"
            >
              <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="block text-lg font-semibold tracking-tight group-hover:text-link">{entry.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{entry.text}</span>
              </span>
              <ArrowRight
                className="size-4 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-link"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ol>

      <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        The reference is a reviewed copy of the <code className="font-mono">docs/</code> folder of{" "}
        <a href={REPO_URL} className="underline underline-offset-4 hover:text-foreground">
          plumlang/plumlang
        </a>{" "}
        at commit{" "}
        <a
          href={`${REPO_URL}/commit/${SOURCE.sourceCommit}`}
          className="font-mono underline underline-offset-4 hover:text-foreground"
        >
          {SOURCE.sourceCommit.slice(0, 7)}
        </a>
        .
      </p>

      <div className="max-w-3xl">
        <DocFooter editUrl={siteEditUrl("app/docs/page.tsx")} next={next} />
      </div>
    </main>
  );
}
