import { llmsTxt } from "@/lib/llm";

// Rendered once at build time into out/llms.txt (output: "export").
// The index of the docs for language models: https://llmstxt.org
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
