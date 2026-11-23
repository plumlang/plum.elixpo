import Image from "next/image";
import Link from "next/link";
import {
  BRANDING_REPO_URL,
  CONTACT_EMAIL,
  CREATORS_TEXT,
  DISCUSSIONS_URL,
  ELIXPO_URL,
  LICENSE_URL,
  LLMS_FULL_PATH,
  LLMS_TXT_PATH,
  RELEASES_URL,
  REPO_URL,
  ROADMAP_URL,
  SITE_REPO_URL,
} from "@/lib/site";

const columns = [
  {
    title: "Learn",
    links: [
      { href: "/docs/tour/", label: "Tour" },
      { href: "/docs/language/", label: "Language reference" },
      { href: "/docs/stdlib/", label: "Standard library" },
      { href: "/docs/errors/", label: "Error codes" },
    ],
  },
  {
    title: "Get Plumlang",
    links: [
      { href: "/docs/install/", label: "Install" },
      { href: RELEASES_URL, label: "Releases" },
      { href: "/playground/", label: "Playground" },
      { href: "/packages/", label: "Packages" },
      { href: ROADMAP_URL, label: "Roadmap" },
    ],
  },
  {
    title: "For agents",
    links: [
      { href: "/docs/agents/", label: "Using coding agents" },
      { href: LLMS_TXT_PATH, label: "llms.txt" },
      { href: LLMS_FULL_PATH, label: "llms-full.txt" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: REPO_URL, label: "Source code" },
      { href: DISCUSSIONS_URL, label: "Discussions" },
      { href: BRANDING_REPO_URL, label: "Brand assets" },
      { href: SITE_REPO_URL, label: "Website source" },
    ],
  },
];

/** Site pages go through Link; files (llms.txt) and other sites are plain links. */
const isPage = (href: string) => href.startsWith("/") && href.endsWith("/");

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <div className="flex items-center gap-2">
            <Image src="/plum-mark.svg" width={28} height={28} alt="" />
            <p className="font-semibold tracking-tight">Plumlang</p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            A small, fast, memory-safe programming language, created by {CREATORS_TEXT}.
          </p>
          <p className="mt-3 text-sm font-medium text-production">
            <a href={ELIXPO_URL} className="hover:underline hover:underline-offset-4">
              An Elixpo production
            </a>
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4 hover:text-foreground">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">{column.title}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  {isPage(link.href) ? (
                    <Link href={link.href} className="hover:text-link">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="hover:text-link">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>© 2026 Elixpo. Plumlang and the Plumlang logo are trademarks of Elixpo.</p>
          <p>
            Licensed under the{" "}
            <a href={LICENSE_URL} className="underline underline-offset-4 hover:text-foreground">
              Apache License 2.0
            </a>
            , with the Plumlang Commercial License as an option.
          </p>
        </div>
      </div>
    </footer>
  );
}
