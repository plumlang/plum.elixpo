import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocFooter, DocHeader, TableOfContents, type Crumb } from "@/components/doc-parts";
import { JsonLd } from "@/components/json-ld";
import {
  DOC_PAGES,
  SECTION_TITLES,
  SOURCE,
  faqEntries,
  getDocPage,
  lastModified,
  markdownPath,
  neighbours,
  resolveDocLink,
  specSectionUrl,
  type DocPage,
} from "@/lib/docs";
import { pageMarkdown } from "@/lib/llm";
import { renderMarkdown } from "@/lib/markdown";
import { CREATOR_PEOPLE, DOCS_OG_IMAGE, ORGANIZATION, breadcrumbList, pageMetadata } from "@/lib/seo";
import { REPO_URL, absoluteUrl, editUrl, siteEditUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string[] }> };

// Only the pages listed in lib/docs.ts exist; anything else is the 404 page.
export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_PAGES.filter((page) => page.slug.length > 0 && page.markdown !== "").map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getDocPage((await params).slug);
  if (!page) return {};
  return pageMetadata({
    title: page.metaTitle,
    description: page.description,
    path: page.path,
    type: "article",
    markdown: markdownPath(page),
  });
}

function crumbsFor(page: DocPage): Crumb[] {
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Docs", path: "/docs/" },
  ];
  const section = SECTION_TITLES[page.section];
  const grouped = page.section !== "start" && page.section !== "reference";
  if (grouped && section.path !== page.path) crumbs.push({ name: section.title, path: section.path });
  crumbs.push({ name: page.navTitle === "Overview" ? page.title : page.navTitle, path: page.path });
  return crumbs;
}

export default async function DocPageView({ params }: Props) {
  const page = getDocPage((await params).slug);
  if (!page) notFound();

  const { html, headings } = renderMarkdown(page.markdown, {
    shift: page.shift,
    resolveLink: page.source.repo === "plumlang" ? (href) => resolveDocLink(href, page.source.path) : undefined,
    sectionUrl: specSectionUrl,
  });
  const { previous, next } = neighbours(page);
  const crumbs = crumbsFor(page);
  const fromPlumlang = page.source.repo === "plumlang";
  const commit = SOURCE.sourceCommit.slice(0, 7);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${absoluteUrl(page.path)}#article`,
        headline: page.title,
        name: page.metaTitle,
        description: page.description,
        url: absoluteUrl(page.path),
        mainEntityOfPage: absoluteUrl(page.path),
        inLanguage: "en",
        dateModified: lastModified(page),
        proficiencyLevel: page.section === "tour" ? "Beginner" : "Expert",
        isPartOf: { "@type": "WebSite", "@id": `${absoluteUrl("/")}#website` },
        about: { "@type": "ComputerLanguage", name: "Plumlang", "@id": `${absoluteUrl("/")}#language` },
        author: CREATOR_PEOPLE,
        publisher: ORGANIZATION,
        image: absoluteUrl(DOCS_OG_IMAGE.url),
        encoding: { "@type": "MediaObject", encodingFormat: "text/markdown", contentUrl: absoluteUrl(markdownPath(page)) },
      },
      breadcrumbList(crumbs),
      // The FAQ page: its questions and answers, for search and answer engines.
      ...(page.path === "/docs/faq/"
        ? [
            {
              "@type": "FAQPage",
              "@id": `${absoluteUrl(page.path)}#faq`,
              url: absoluteUrl(page.path),
              mainEntity: faqEntries(page.markdown).map(({ question, answer }) => ({
                "@type": "Question",
                name: question,
                acceptedAnswer: { "@type": "Answer", text: answer },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-10">
      <main className="min-w-0 py-8 lg:py-10">
        <JsonLd data={structuredData} />
        <article>
          <DocHeader
            crumbs={crumbs}
            eyebrow={page.eyebrow}
            title={page.title}
            badge={page.badge}
            lead={page.lead}
            next={next}
            markdown={pageMarkdown(page)}
          />
          <div className="prose-doc mt-8 max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
        <div className="max-w-3xl">
          <DocFooter
            editUrl={fromPlumlang ? editUrl(page.source.path) : siteEditUrl(page.source.path)}
            sourceNote={
              fromPlumlang ? (
                <>
                  From{" "}
                  <a
                    href={`${REPO_URL}/blob/${SOURCE.sourceCommit}/${page.source.path}`}
                    className="font-mono underline underline-offset-4 hover:text-foreground"
                  >
                    {page.source.path}
                  </a>{" "}
                  at {commit}
                </>
              ) : undefined
            }
            previous={previous}
            next={next}
          />
        </div>
      </main>
      <aside className="hidden xl:block">
        <div className="sticky top-20 max-h-[calc(100svh-5rem)] overflow-y-auto py-10">
          <TableOfContents headings={headings} depth={page.tocDepth} />
        </div>
      </aside>
    </div>
  );
}
