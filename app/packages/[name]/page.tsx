import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { CopyButtons } from "@/components/copy-buttons";
import { JsonLd } from "@/components/json-ld";
import { NextLink } from "@/components/next-link";
import { renderMarkdown } from "@/lib/markdown";
import {
  ORCHARD_GUIDE,
  ORCHARD_RAW_URL,
  ORCHARD_REPO_URL,
  PACKAGES,
  type OrchardPackage,
  formatDate,
  getPackage,
  latestVersion,
  packagePath,
  seedName,
} from "@/lib/orchard";
import { ORGANIZATION, breadcrumbList, pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

// One page per package in Orchard, rendered at build time from
// content/orchard.json (scripts/sync-orchard.mjs).
export const dynamicParams = false;

// A static export needs at least one page per dynamic route; with no
// packages (the registry couldn't be read) "_" stands in: a noindex page
// that the sitemap and scripts/check_site.py leave out.
const PLACEHOLDER = "_";

type Props = { params: Promise<{ name: string }> };

export function generateStaticParams() {
  return PACKAGES.length > 0 ? PACKAGES.map((pkg) => ({ name: pkg.name })) : [{ name: PLACEHOLDER }];
}

const describe = (pkg: OrchardPackage) =>
  pkg.description
    ? `${pkg.description.replace(/[.\s]+$/, "")}. Plumlang package ${pkg.name} ${pkg.latest} on Orchard: install it with plum add ${pkg.name}.`
    : `The ${pkg.name} package for Plumlang, version ${pkg.latest}, on Orchard: install it with plum add ${pkg.name}.`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const pkg = getPackage(name);
  if (!pkg) {
    return { title: "No packages", description: "Orchard's packages could not be read when this site was built.", robots: { index: false } };
  }
  return pageMetadata({ title: `${pkg.name} · Packages`, description: describe(pkg), path: packagePath(pkg.name) });
}

/** README links: web and mail links, and anchors that exist; anything else stays text. */
function readmeHtml(readme: string) {
  const { headings } = renderMarkdown(readme);
  const ids = new Set(headings.map((h) => h.id));
  return renderMarkdown(readme, {
    resolveLink: (href) => {
      if (/^(https?:|mailto:)/i.test(href)) return href;
      if (href.startsWith("#") && ids.has(href.slice(1))) return href;
      return null;
    },
    resolveImage: (src) => (/^https:\/\//i.test(src) ? src : null),
  }).html;
}

export default async function PackagePage({ params }: Props) {
  const { name } = await params;
  const pkg = getPackage(name);
  if (!pkg) {
    if (name !== PLACEHOLDER) notFound();
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-24 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight">No packages</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Orchard could not be read when this site was built. Browse it on{" "}
          <a href={ORCHARD_REPO_URL} className="text-link underline underline-offset-4">
            GitHub
          </a>
          .
        </p>
      </main>
    );
  }

  const latest = latestVersion(pkg);
  const deps = Object.entries(latest?.dependencies ?? {});
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Packages", path: "/packages/" },
    { name: pkg.name, path: packagePath(pkg.name) },
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareSourceCode",
        "@id": `${absoluteUrl(packagePath(pkg.name))}#package`,
        name: pkg.name,
        description: pkg.description || undefined,
        url: absoluteUrl(packagePath(pkg.name)),
        version: pkg.latest,
        programmingLanguage: { "@type": "ComputerLanguage", name: "Plumlang", url: absoluteUrl("/") },
        codeRepository: pkg.repository || undefined,
        license: pkg.license || undefined,
        keywords: pkg.keywords.length > 0 ? pkg.keywords.join(", ") : undefined,
        dateModified: latest?.published || undefined,
        provider: ORGANIZATION,
      },
      breadcrumbList(crumbs),
    ],
  };

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "Version", value: <span className="font-mono">{pkg.latest}</span> },
    ...(latest && formatDate(latest.published) ? [{ label: "Published", value: formatDate(latest.published) }] : []),
    ...(pkg.license ? [{ label: "Licence", value: pkg.license }] : []),
    ...(latest?.plum ? [{ label: "Plumlang", value: <span className="font-mono">{latest.plum}</span> }] : []),
    ...(pkg.repository
      ? [
          {
            label: "Repository",
            value: (
              <a href={pkg.repository} rel="noopener" className="break-all text-link underline underline-offset-4">
                {pkg.repository.replace(/^https:\/\/github\.com\//, "")}
              </a>
            ),
          },
        ]
      : []),
    ...(pkg.owners.length > 0
      ? [
          {
            label: pkg.owners.length === 1 ? "Owner" : "Owners",
            value: (
              <span className="flex flex-wrap gap-x-2">
                {pkg.owners.map((owner) => (
                  <a key={owner} href={`https://github.com/${owner}`} rel="noopener" className="text-link underline underline-offset-4">
                    {owner}
                  </a>
                ))}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <JsonLd data={structuredData} />
      <CopyButtons />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {crumbs.map((crumb, i) => (
            <li key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3" aria-hidden="true" />}
              {i === crumbs.length - 1 ? (
                <span aria-current="page">{crumb.name}</span>
              ) : (
                <Link href={crumb.path} className="hover:text-foreground">
                  {crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <header className="mt-8 border-b pb-8">
        <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.19em] text-primary">Orchard package</p>
        <h1 className="mt-3 break-all font-mono text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          {pkg.name}
          <span className="ml-3 inline-block translate-y-[-0.5em] rounded-full border px-2.5 py-0.5 align-middle font-mono text-[0.65rem] font-normal tracking-wide text-muted-foreground">
            {pkg.latest}
          </span>
        </h1>
        {pkg.description && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">{pkg.description}</p>}
        {pkg.yanked && (
          <p className="mt-4 max-w-2xl rounded-2xl border border-destructive/40 px-4 py-3 text-sm text-destructive">
            Every version of this package is yanked: lock files that already have one still install it, but plum won&apos;t choose
            it again.
          </p>
        )}
        {pkg.keywords.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Keywords">
            {pkg.keywords.map((keyword) => (
              <li key={keyword}>
                <Link
                  href={`/packages/?q=${encodeURIComponent(keyword)}`}
                  className="inline-block rounded-full bg-muted px-2.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground hover:text-foreground"
                >
                  {keyword}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <section aria-labelledby="install-command">
            <h2 id="install-command" className="text-2xl font-semibold tracking-tight">
              Install
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              In your project&apos;s folder, the one with <code className="font-mono">plum.toml</code>:
            </p>
            <CodeBlock lang="sh" code={`plum add ${pkg.name}`} />
            <p className="text-sm leading-relaxed text-muted-foreground">Then import it in your code:</p>
            <CodeBlock code={`seed ${seedName(pkg.name)}`} />
            {ORCHARD_GUIDE && (
              <p className="text-sm text-muted-foreground">
                Version ranges, <code className="font-mono">plum.lock</code> and more:{" "}
                <Link href={ORCHARD_GUIDE} className="text-link underline underline-offset-4">
                  the Orchard guide
                </Link>
                .
              </p>
            )}
          </section>

          {pkg.readme && (
            <section aria-labelledby="readme" className="mt-12 border-t pt-10">
              <h2 id="readme" className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.19em] text-muted-foreground">
                README.md
              </h2>
              <div className="prose-doc mt-6" dangerouslySetInnerHTML={{ __html: readmeHtml(pkg.readme) }} />
            </section>
          )}

          <section aria-labelledby="version-history" className="mt-12 border-t pt-10">
            <h2 id="version-history" className="text-2xl font-semibold tracking-tight">
              Versions
            </h2>
            <div className="mt-5 overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Version</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Published</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Plumlang</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pkg.versions.map((v) => (
                    <tr key={v.version} className="border-t">
                      <td className="px-4 py-2.5 font-mono">
                        <a href={`${ORCHARD_RAW_URL}/packages/${pkg.name}/${v.version}.plumpkg`} className="hover:text-link hover:underline" title={`sha256 ${v.sha256}`}>
                          {v.version}
                        </a>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDate(v.published) || "–"}</td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">{v.plum || "–"}</td>
                      <td className="px-4 py-2.5">
                        {v.yanked ? (
                          <span className="rounded-full border border-destructive/40 px-2 py-0.5 font-mono text-[0.65rem] text-destructive">yanked</span>
                        ) : v.version === pkg.latest ? (
                          <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[0.65rem] text-accent-foreground">latest</span>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              A yanked version stays installable from lock files that have it, but plum never chooses it again.
            </p>
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border bg-card p-6">
            <h2 className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.19em] text-muted-foreground">About</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {facts.map((fact) => (
                <div key={fact.label} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2">
                  <dt className="text-muted-foreground">{fact.label}</dt>
                  <dd className="min-w-0">{fact.value}</dd>
                </div>
              ))}
            </dl>
            {deps.length > 0 && (
              <>
                <h3 className="mt-6 font-mono text-[0.68rem] font-medium uppercase tracking-[0.19em] text-muted-foreground">Dependencies</h3>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {deps.map(([dep, range]) => (
                    <li key={dep} className="flex justify-between gap-3">
                      {getPackage(dep) ? (
                        <Link href={packagePath(dep)} className="font-mono text-link underline underline-offset-4">
                          {dep}
                        </Link>
                      ) : (
                        <span className="font-mono">{dep}</span>
                      )}
                      <span className="font-mono text-muted-foreground">{range}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-6 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              From the{" "}
              <a href={`${ORCHARD_REPO_URL}/blob/main/index/${pkg.name.slice(0, 2)}/${pkg.name}.json`} className="underline underline-offset-4 hover:text-foreground">
                index on GitHub
              </a>
              , as of this site&apos;s last build.
            </p>
          </div>
          <div className="mt-4">
            <NextLink href="/packages/" variant="outline">
              All packages
            </NextLink>
          </div>
        </aside>
      </div>
    </main>
  );
}
