import { LLMS_FULL_PATH, LLMS_TXT_PATH, absoluteUrl } from "@/lib/site";

// Rendered once at build time into out/robots.txt (output: "export"). A
// route handler rather than robots.ts, so the file can point language
// models at llms.txt in a comment.
export const dynamic = "force-static";

export function GET() {
  const body = [
    "# Plumlang: https://plum.elixpo.com/",
    `# For language models: ${absoluteUrl(LLMS_TXT_PATH)} and ${absoluteUrl(LLMS_FULL_PATH)}`,
    "",
    "User-Agent: *",
    "Allow: /",
    "",
    `Host: ${absoluteUrl("/")}`,
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
