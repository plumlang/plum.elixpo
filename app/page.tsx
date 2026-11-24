import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { JsonLd } from "@/components/json-ld";
import { NextLink } from "@/components/next-link";
import { StoryCard, StorySection } from "@/components/story";
import { AGENTS_PAGE, ERRORS_PAGE, LANGUAGE_INDEX, REFERENCE_PAGE, STDLIB_INDEX, TOUR_PAGES } from "@/lib/docs";
import { CREATOR_PEOPLE, ORGANIZATION, WEBSITE, pageMetadata } from "@/lib/seo";
import {
  BENCH_URL,
  CONTRIBUTING_URL,
  CREATORS_TEXT,
  DISCUSSIONS_URL,
  EXAMPLES_URL,
  INSTALL_COMMANDS,
  LICENSE_URL,
  LLMS_FULL_PATH,
  RELEASES_URL,
  REPO_URL,
  ROADMAP_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Plumlang: a small, fast, memory-safe programming language",
  description: SITE_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

// The samples are files in content/samples/, each checked with plum, and
// the outputs are what `plum run` printed (scripts/check_samples.py).
const sample = (name: string) => readFileSync(join(process.cwd(), "content", "samples", name), "utf8").trimEnd();

const reference = [
  { href: LANGUAGE_INDEX.path, title: "Language reference", text: "The specification, one section per page: every rule, exactly." },
  { href: STDLIB_INDEX.path, title: "Standard library", text: "math, str, io, os, time, fs, json, tasks, net and net.http." },
  ...(REFERENCE_PAGE ? [{ href: REFERENCE_PAGE.path, title: "On one page", text: "The whole language on a single page." }] : []),
  { href: ERRORS_PAGE.path, title: "Error codes", text: "Each compiler error with an example that causes it and the fix." },
  { href: AGENTS_PAGE.path, title: "Coding agents", text: "llms.txt, llms-full.txt and an AGENTS.md snippet." },
];

/** The install section's three cards. */
const INSTALL_OPTIONS = [
  { title: "Linux and macOS", code: INSTALL_COMMANDS.unix, lang: "bash", label: "sh" },
  { title: "Windows", code: INSTALL_COMMANDS.windows, lang: "powershell", label: "PowerShell" },
  { title: "From source, with a C11 compiler", code: INSTALL_COMMANDS.source, lang: "bash", label: "sh" },
] as const;

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      ORGANIZATION,
      WEBSITE,
      {
        "@type": "ComputerLanguage",
        "@id": `${absoluteUrl("/")}#language`,
        name: SITE_NAME,
        alternateName: "Plum",
        url: absoluteUrl("/"),
        description: SITE_DESCRIPTION,
        sameAs: [REPO_URL],
        creator: CREATOR_PEOPLE,
        publisher: { "@id": ORGANIZATION["@id"] },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${absoluteUrl("/")}#plum`,
        name: "plum",
        alternateName: "Plumlang compiler and runtime",
        description:
          "The plum command: the Plumlang compiler, virtual machine and standard library in one binary with no dependencies.",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Linux, macOS, Windows",
        url: absoluteUrl("/"),
        downloadUrl: RELEASES_URL,
        installUrl: absoluteUrl("/docs/install/"),
        softwareHelp: absoluteUrl("/docs/"),
        license: LICENSE_URL,
        author: CREATOR_PEOPLE,
        publisher: { "@id": ORGANIZATION["@id"] },
        about: { "@id": `${absoluteUrl("/")}#language` },
      },
    ],
  };

  const steps = TOUR_PAGES.slice(1);

  return (
    <main>
      <JsonLd data={structuredData} />

      {/* What it is: one sentence and one program. */}
      <section aria-labelledby="what-title" className="relative overflow-hidden border-b">
        <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 [mask-image:linear-gradient(90deg,transparent,#000_40%)] lg:block" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 md:pb-28 md:pt-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.19em] text-primary">Programming language</p>
            <h1 id="what-title" className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
              A small, fast, <em className="font-serif font-normal tracking-[-0.02em]">memory-safe</em> programming language.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Static types, objects, modules, tasks and an HTTP server, compiled to bytecode and run by one{" "}
              <code className="font-mono text-[0.9em] text-foreground">plum</code> binary with no dependencies.
            </p>
            <div className="mt-9 flex flex-wrap gap-2">
              <NextLink href="/docs/install/">Install</NextLink>
              <NextLink href="/docs/tour/" variant="outline">
                Take the tour
              </NextLink>
            </div>
            <p className="mt-9 font-mono text-xs text-muted-foreground">
              Pre-alpha, built in the open ·{" "}
              <a href={ROADMAP_URL} className="underline underline-offset-4 hover:text-foreground">
                roadmap
              </a>{" "}
              · <span className="text-production">An Elixpo production</span>
            </p>
          </div>
          <div className="min-w-0">
            <CodeBlock code={sample("planets.plum")} label="planets.plum" className="my-0 shadow-[0_28px_80px_rgb(36_20_58/0.18)]" />
            <CodeBlock code={sample("planets.out")} lang="text" label="Output" className="mb-0" />
          </div>
        </div>
      </section>

      {/* Why: three properties, each with its proof. */}
      <StorySection
        id="why"
        number="01"
        eyebrow="Why Plumlang"
        title={
          <>
            Easy to write, fast to run, <em className="font-serif font-normal tracking-[-0.02em]">safe by design.</em>
          </>
        }
        line="Three promises, and the evidence for each."
        next={<NextLink href="/docs/language/design-principles/">Read the design principles</NextLink>}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <StoryCard>
            <h3 className="text-xl font-semibold tracking-tight">Easy to write</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              No semicolons, no <code className="font-mono">main</code>, no brackets around conditions; logic reads as words.
            </p>
            <CodeBlock code={sample("easy.plum")} label="basket.plum" className="mb-0 mt-6" />
            <CodeBlock code={sample("easy.out")} lang="text" label="Output" className="mb-0 mt-3" />
          </StoryCard>
          <StoryCard>
            <h3 className="text-xl font-semibold tracking-tight">Fast to run</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Bytecode on a small virtual machine, with no garbage-collector pauses.
            </p>
            <dl className="mt-6 grid gap-5">
              <div>
                <dt className="text-sm text-muted-foreground">20-million-step loop, against Python 3.14</dt>
                <dd className="mt-1 text-5xl font-semibold tracking-[-0.05em]">2.6× faster</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">net.http requests a second, one server process</dt>
                <dd className="mt-1 text-5xl font-semibold tracking-[-0.05em]">126,832</dd>
              </div>
            </dl>
            <p className="mt-auto pt-6 text-xs text-muted-foreground">
              Linux x86_64, GCC 15.2 -O2.{" "}
              <a href={BENCH_URL} className="underline underline-offset-4 hover:text-foreground">
                Benchmarks and method
              </a>
            </p>
          </StoryCard>
          <StoryCard>
            <h3 className="text-xl font-semibold tracking-tight">Safe by design</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Types are checked before anything runs, values that may be missing say so, and every error points at the
              fix.
            </p>
            <CodeBlock code={sample("maybe-none.plum")} label="maybe-none.plum" className="mb-0 mt-6" />
            <CodeBlock code={sample("maybe-none.err")} lang="text" label="plum check" className="mb-0 mt-3 text-[0.8rem]" />
          </StoryCard>
        </div>
      </StorySection>

      {/* Install: one command per system. */}
      <StorySection
        id="install"
        number="02"
        eyebrow="Install"
        title="One command, one binary."
        line={
          <>
            The installer puts <code className="font-mono text-[0.9em] text-foreground">plum</code> on your PATH after
            checking the download against the release&apos;s checksums.
          </>
        }
        next={<NextLink href="/docs/install/">Install guide and settings</NextLink>}
        className="bg-card"
      >
        {/* A subgrid on wide screens: the titles share one row and the blocks
            the next, so all three cards line up and have the same height. */}
        <div className="grid gap-x-4 gap-y-8 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:gap-y-3">
          {INSTALL_OPTIONS.map((option) => (
            <div
              key={option.title}
              className="flex min-w-0 flex-col gap-3 lg:row-span-2 lg:grid lg:grid-rows-subgrid"
            >
              <h3 className="text-sm font-semibold lg:self-end">{option.title}</h3>
              <CodeBlock code={option.code} lang={option.lang} label={option.label} className="my-0 h-full" />
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Every build is listed with its checksum on{" "}
          <a href={RELEASES_URL} className="underline underline-offset-4 hover:text-foreground">
            GitHub Releases
          </a>
          . Homebrew: <code className="font-mono text-[0.9em] text-foreground">brew install plumlang/tap/plum</code>. Editors and packages:{" "}
          <Link href="/docs/ecosystem/" className="underline underline-offset-4 hover:text-foreground">
            VS Code, Zed, Tree-sitter, npm and PyPI
          </Link>
          .
        </p>
      </StorySection>

      {/* Learn: the tour. */}
      <StorySection
        id="learn"
        number="03"
        eyebrow="Learn"
        title="The tour, one idea per step."
        line={`${steps.length} short pages, each with programs you can run and the output they print.`}
        next={<NextLink href={steps[0].path}>Start with {steps[0].title}</NextLink>}
      >
        <ol className="grid border-t sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.path} className="border-b">
              <Link href={step.path} className="group flex items-baseline gap-4 py-4">
                <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium group-hover:text-link">{step.title}</span>
              </Link>
            </li>
          ))}
        </ol>
      </StorySection>

      {/* Build: two real programs. */}
      <StorySection
        id="build"
        number="04"
        eyebrow="Build"
        title="Servers and command-line tools."
        line={
          <>
            Files, JSON, sockets and HTTP are in the standard library; each connection gets its own task, with no{" "}
            <code className="font-mono text-[0.9em] text-foreground">async</code>.
          </>
        }
        next={
          <>
            <NextLink href="/docs/tour/web-server/">Build a web server</NextLink>
            <NextLink href={EXAMPLES_URL} variant="outline">
              More examples
            </NextLink>
          </>
        }
        className="bg-card"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">An HTTP server</h3>
            <CodeBlock code={sample("server.plum")} label="server.plum" className="mb-0 mt-3" />
            <CodeBlock
              code={`$ plum run server.plum &\n$ curl localhost:8080/hello/you\nHello, you!\n$ curl "localhost:8080/add?a=2&b=40"\n{"a":2,"b":40,"sum":42}`}
              lang="text"
              label="Terminal"
              className="mb-0 mt-3"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">A command-line tool</h3>
            <CodeBlock code={sample("count.plum")} label="count.plum" className="mb-0 mt-3" />
            <CodeBlock
              code={`$ plum run count.plum notes.txt missing.txt\nnotes.txt: 2 lines, 4 words\nmissing.txt: read("missing.txt"): No such file or directory`}
              lang="text"
              label="Terminal"
              className="mb-0 mt-3"
            />
          </div>
        </div>
      </StorySection>

      {/* Reference. */}
      <StorySection
        id="reference"
        number="05"
        eyebrow="Reference"
        title="The exact rules, when you need them."
        line="Built from the specification and library docs in the plumlang repository, so they describe the language as it is."
        next={
          <>
            <NextLink href="/docs/">All documentation</NextLink>
            <NextLink href={LLMS_FULL_PATH} variant="outline">
              llms-full.txt
            </NextLink>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reference.map((item) => (
            <Link key={item.href} href={item.href} className="group rounded-3xl border bg-card p-6 transition-colors hover:border-primary/50">
              <h3 className="text-lg font-semibold tracking-tight group-hover:text-link">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </Link>
          ))}
        </div>
      </StorySection>

      {/* Contribute. */}
      <section aria-labelledby="community-title" className="bg-[var(--plum-night)] text-[var(--paper)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.19em] text-[var(--plum-mist)]">
              06 · Contribute
            </p>
            <h2 id="community-title" className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl">
              Built in the open.
            </h2>
            <p className="mt-6 max-w-xl leading-relaxed text-[#d9cfe6]">
              Created by {CREATORS_TEXT}. Issues, ideas and pull requests are welcome; the roadmap lists what comes next.
            </p>
            <div className="mt-10 flex flex-wrap gap-2">
              <a href={REPO_URL} className="inline-flex h-10 items-center rounded-full bg-[var(--paper)] px-5 text-[0.82rem] font-medium text-[var(--ink)] hover:opacity-90">
                Source on GitHub
              </a>
              <a href={CONTRIBUTING_URL} className="inline-flex h-10 items-center rounded-full border border-white/25 px-5 text-[0.82rem] font-medium hover:bg-white/10">
                How to contribute
              </a>
              <a href={DISCUSSIONS_URL} className="inline-flex h-10 items-center rounded-full border border-white/25 px-5 text-[0.82rem] font-medium hover:bg-white/10">
                Discussions
              </a>
              <a href={ROADMAP_URL} className="inline-flex h-10 items-center rounded-full border border-white/25 px-5 text-[0.82rem] font-medium hover:bg-white/10">
                Roadmap
              </a>
            </div>
          </div>
          <div className="flex flex-col justify-end gap-6 lg:items-end">
            <Image src="/plum-mark.svg" width={120} height={120} alt="" />
            <p className="max-w-sm text-sm leading-relaxed text-[#d9cfe6] lg:text-right">
              Licensed under the{" "}
              <a href={LICENSE_URL} className="text-[var(--plum-mist)] underline underline-offset-4">
                Apache License 2.0
              </a>
              , with the Plumlang Commercial License as an option: free to use, change and ship, commercially or not. Programs you write are yours.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
