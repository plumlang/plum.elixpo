import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { NextLink } from "@/components/next-link";
import { pageMetadata } from "@/lib/seo";
import { PLAYGROUND_ISSUE_URL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Playground",
  description:
    "The Plumlang playground will run Plumlang in your browser as WebAssembly. It is not open yet; until then, install plum and run programs locally.",
  path: "/playground/",
});

export default function Playground() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 md:py-24">
      <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.19em] text-primary">Playground · Coming soon</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Plumlang in your browser.</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Not open yet: the real <code className="font-mono text-[0.9em] text-foreground">plum</code>, compiled to
        WebAssembly, running in the page (
        <a href={PLAYGROUND_ISSUE_URL} className="text-link underline underline-offset-4">
          plumlang#32
        </a>
        ). Until then, run programs locally.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <NextLink href="/docs/install/">Next: Install Plumlang</NextLink>
      </div>

      <div className="mt-12 max-w-2xl">
        <CodeBlock code={`drop("Hello, world!")`} label="hello.plum" className="mb-3" />
        <CodeBlock code="plum run hello.plum" lang="bash" className="mb-0" />
      </div>
    </main>
  );
}
