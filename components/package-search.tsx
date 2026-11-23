"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { PackageSummary } from "@/lib/orchard";

/**
 * Matches as `plum search` does: every word must appear in the name, the
 * description or a keyword, ignoring case.
 */
function matches(pkg: PackageSummary, words: string[]): boolean {
  const haystack = [pkg.name, pkg.description, ...pkg.keywords].join(" ").toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/** Name matches first, then the rest, each by name. */
function rank(packages: PackageSummary[], words: string[]): PackageSummary[] {
  if (words.length === 0) return packages;
  const found = packages.filter((pkg) => matches(pkg, words));
  const inName = (pkg: PackageSummary) => words.some((word) => pkg.name.includes(word));
  return [...found.filter(inName), ...found.filter((pkg) => !inName(pkg))];
}

/** The search box and the list it filters. The query is kept in the URL (?q=) so a search can be shared. */
export function PackageSearch({ packages }: { packages: PackageSummary[] }) {
  const params = useSearchParams();
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const words = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query]);
  const shown = useMemo(() => rank(packages, words), [packages, words]);

  const update = (value: string) => {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Search packages</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => update(event.target.value)}
          placeholder={`Search ${packages.length} package${packages.length === 1 ? "" : "s"} by name, description or keyword`}
          autoComplete="off"
          spellCheck={false}
          className="h-12 w-full rounded-full border bg-card pl-11 pr-4 text-base outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
        />
      </label>
      <p className="mt-4 px-1 text-sm text-muted-foreground" aria-live="polite">
        {words.length === 0
          ? `${packages.length} package${packages.length === 1 ? "" : "s"}`
          : shown.length === 0
            ? `No package matches “${query.trim()}”.`
            : `${shown.length} of ${packages.length} package${packages.length === 1 ? "" : "s"} match “${query.trim()}”`}
      </p>
      <PackageList packages={shown} />
    </div>
  );
}

/** The packages as cards: what the page shows before JavaScript runs, too. */
export function PackageList({ packages }: { packages: PackageSummary[] }) {
  if (packages.length === 0) return null;
  return (
    <ul className="mt-4 grid gap-3 md:grid-cols-2">
      {packages.map((pkg) => (
        <li key={pkg.name} className="min-w-0">
          <Link
            href={`/packages/${pkg.name}/`}
            className="flex h-full min-w-0 flex-col rounded-3xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/40 sm:p-6"
          >
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="break-all font-mono text-base font-semibold text-foreground">{pkg.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{pkg.latest}</span>
              {pkg.yanked && (
                <span className="rounded-full border border-destructive/40 px-2 py-0.5 font-mono text-[0.65rem] text-destructive">yanked</span>
              )}
            </span>
            {pkg.description && <span className="mt-2 text-sm leading-relaxed text-muted-foreground">{pkg.description}</span>}
            {pkg.keywords.length > 0 && (
              <span className="mt-4 flex flex-wrap gap-1.5">
                {pkg.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground">
                    {keyword}
                  </span>
                ))}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
