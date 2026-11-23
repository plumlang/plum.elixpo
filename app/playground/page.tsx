import type { Metadata } from "next";
import { NextLink } from "@/components/next-link";
import { Playground } from "@/components/playground";
import { TOUR_PAGES } from "@/lib/docs";
import { PLAYGROUND_EXAMPLES } from "@/lib/playground";
import { pageMetadata } from "@/lib/seo";
import { PLAYGROUND_DOCS_URL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Playground",
  description:
    "Run Plumlang in your browser: the real plum, compiled to WebAssembly. Write a program, run it, see its errors as you type, format it, and share it as a link. Nothing to install.",
  path: "/playground/",
});

export default function PlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <header className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div>
          <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.19em] text-primary">Playground</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Plumlang in your browser.</h1>
        </div>
        <div className="self-end">
          <p className="text-base leading-relaxed text-muted-foreground lg:text-lg">
            Try Plumlang without installing anything: the real <code className="font-mono text-[0.9em] text-foreground">plum</code>,
            compiled to WebAssembly, runs your program right here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <NextLink href={TOUR_PAGES[0].path}>Next: Take the tour</NextLink>
            <NextLink href="/docs/install/" variant="outline">
              Install Plumlang
            </NextLink>
          </div>
        </div>
      </header>

      <div className="mt-10">
        <Playground examples={PLAYGROUND_EXAMPLES} />
        <noscript>
          <p className="mt-4 text-sm text-muted-foreground">The playground needs JavaScript and WebAssembly.</p>
        </noscript>
      </div>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Programs run in your browser and nothing is sent anywhere; a share link holds the whole program in its{" "}
        <code className="font-mono">#</code>. Each run is sandboxed: no files, network or commands, input is always at its
        end, and a program stops after about a second of work, 64 MB of memory or 5 seconds of sleeping. Embed it in your own
        page with{" "}
        <a href={PLAYGROUND_DOCS_URL} className="text-link underline underline-offset-4">
          plum.js and plum.wasm
        </a>
        .
      </p>
    </main>
  );
}
