import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PRIMARY_NAV, REPO_URL } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 rounded-full border bg-background/85 pl-4 pr-2 shadow-[0_12px_40px_rgb(20_32_24/0.07)] backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-0.5 text-[0.8rem] font-medium md:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <a
            href={REPO_URL}
            className="hidden h-9 items-center rounded-full bg-foreground px-4 text-[0.8rem] font-medium text-background transition-opacity hover:opacity-85 sm:inline-flex"
          >
            GitHub
          </a>
          <details className="group relative md:hidden">
            <summary
              className="inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden"
              aria-label="Menu"
            >
              <Menu className="size-4" aria-hidden="true" />
            </summary>
            <nav
              aria-label="Main"
              className="absolute right-0 top-12 flex w-52 flex-col rounded-2xl border bg-popover p-1.5 text-sm shadow-lg"
            >
              {PRIMARY_NAV.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 hover:bg-muted">
                  {item.label}
                </Link>
              ))}
              <a href={REPO_URL} className="rounded-xl px-3 py-2 hover:bg-muted">
                GitHub
              </a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
