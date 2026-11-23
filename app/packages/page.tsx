import type { Metadata } from "next";
import { Suspense } from "react";
import { CodeBlock } from "@/components/code-block";
import { JsonLd } from "@/components/json-ld";
import { NextLink } from "@/components/next-link";
import { PackageList, PackageSearch } from "@/components/package-search";
import { ORCHARD_GUIDE, ORCHARD_REPO_URL, PACKAGES, PUBLISH_URL, packagePath, summarizePackage } from "@/lib/orchard";
import { ORGANIZATION, breadcrumbList, pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

const DESCRIPTION =
  "Search Orchard, Plumlang's package registry: every published package with its newest version, description and keywords. Add one to a project with plum add.";

export const metadata: Metadata = pageMetadata({ title: "Packages", description: DESCRIPTION, path: "/packages/" });

export default function PackagesPage() {
  const summaries = PACKAGES.map(summarizePackage);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl("/packages/")}#page`,
        name: "Orchard packages",
        description: DESCRIPTION,
        url: absoluteUrl("/packages/"),
        isPartOf: { "@type": "WebSite", "@id": `${absoluteUrl("/")}#website` },
        publisher: ORGANIZATION,
        hasPart: PACKAGES.map((pkg) => ({ "@type": "SoftwareSourceCode", name: pkg.name, url: absoluteUrl(packagePath(pkg.name)) })),
      },
      breadcrumbList([
        { name: "Home", path: "/" },
        { name: "Packages", path: "/packages/" },
      ]),
    ],
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <JsonLd data={structuredData} />
      <header className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div>
          <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.19em] text-primary">Orchard</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Packages for Plumlang.</h1>
        </div>
        <div className="self-end">
          <p className="text-base leading-relaxed text-muted-foreground lg:text-lg">
            Orchard is Plumlang&apos;s package registry: an open index on GitHub, with no accounts. Find a package here, then add it
            to your project with <code className="font-mono text-[0.9em] text-foreground">plum add</code>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <NextLink href={ORCHARD_GUIDE ?? `${ORCHARD_REPO_URL}#readme`}>Using packages</NextLink>
            <NextLink href={PUBLISH_URL} variant="outline">
              Publish a package
            </NextLink>
          </div>
        </div>
      </header>

      <div className="mt-10">
        {summaries.length > 0 ? (
          <Suspense fallback={<PackageList packages={summaries} />}>
            <PackageSearch packages={summaries} />
          </Suspense>
        ) : (
          <div className="rounded-3xl border border-dashed bg-card p-8 text-center">
            <p className="font-medium">No packages to show yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The registry could not be read when this site was built, or nothing has been published yet. Browse it on{" "}
              <a href={ORCHARD_REPO_URL} className="text-link underline underline-offset-4">
                GitHub
              </a>
              .
            </p>
          </div>
        )}
      </div>

      <section aria-labelledby="use-title" className="mt-16 grid gap-6 border-t pt-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div>
          <h2 id="use-title" className="text-2xl font-semibold tracking-tight">
            Use a package
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            In the folder with your project&apos;s <code className="font-mono">plum.toml</code>: <code className="font-mono">plum add</code>{" "}
            adds the newest version and locks it in <code className="font-mono">plum.lock</code>; <code className="font-mono">plum install</code>{" "}
            installs exactly what the lock file lists.
          </p>
        </div>
        <CodeBlock
          lang="sh"
          code={"plum search weather     # find packages\nplum add weather        # add the newest version\nplum install            # install what plum.lock lists"}
        />
      </section>
    </main>
  );
}
