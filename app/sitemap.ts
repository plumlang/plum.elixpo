import type { MetadataRoute } from "next";
import { DOC_PAGES, lastModified, SITE_CONTENT_DATE } from "@/lib/docs";
import { absoluteUrl } from "@/lib/site";

// Rendered once at build time into out/sitemap.xml (output: "export"). It
// lists the pages only: the Markdown copies, llms.txt and llms-full.txt are
// for language models, not search results.
export const dynamic = "force-static";

const priority = (path: string) => {
  if (path === "/docs/" || path === "/docs/tour/" || path === "/docs/install/") return 0.9;
  if (/^\/docs\/(language|stdlib|reference)\/$/.test(path) || path.startsWith("/docs/tour/")) return 0.8;
  return 0.7;
};

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), lastModified: SITE_CONTENT_DATE, changeFrequency: "weekly", priority: 1 },
    ...DOC_PAGES.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: lastModified(page),
      changeFrequency: "weekly" as const,
      priority: priority(page.path),
    })),
    { url: absoluteUrl("/playground/"), lastModified: SITE_CONTENT_DATE, changeFrequency: "monthly", priority: 0.5 },
  ];
}
