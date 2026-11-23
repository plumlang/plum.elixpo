import { llmsFullTxt } from "@/lib/llm";

// Rendered once at build time into out/llms-full.txt (output: "export"):
// the documentation in one Markdown file, for language models.
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsFullTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
