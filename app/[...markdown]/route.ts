import { DOC_PAGES, markdownPath } from "@/lib/docs";
import { pageMarkdown } from "@/lib/llm";

// The Markdown copy of every docs page, at the page's URL plus index.md:
// /docs/tour/functions/ is also /docs/tour/functions/index.md. Rendered at
// build time into out/docs/**/index.md (output: "export").
//
// The route sits at the top of app/ because a catch-all must be the last
// segment of its path, so app/docs/[...slug]/ can't also end in index.md.
// Only the paths below exist; `next dev` matches /docs/... to the docs
// pages first, so these files are served by a build (`npx serve out`).
export const dynamic = "force-static";
export const dynamicParams = false;

type Context = { params: Promise<{ markdown: string[] }> };

export function generateStaticParams() {
  return DOC_PAGES.map((page) => ({ markdown: markdownPath(page).split("/").filter(Boolean) }));
}

export async function GET(_request: Request, { params }: Context) {
  const path = `/${(await params).markdown.join("/")}`;
  const page = DOC_PAGES.find((p) => markdownPath(p) === path);
  if (!page) return new Response("Not found\n", { status: 404 });
  return new Response(pageMarkdown(page), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
