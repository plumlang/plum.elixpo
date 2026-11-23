import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** A rounded link to the next step: how every page and story section ends. */
export function NextLink({
  href,
  children,
  variant = "solid",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
}) {
  const className = cn(
    "inline-flex h-10 items-center gap-2 rounded-full px-5 text-[0.82rem] font-medium transition-[opacity,background-color]",
    variant === "solid" ? "bg-foreground text-background hover:opacity-85" : "border bg-card hover:bg-muted",
  );
  const inner = (
    <>
      {children} <ArrowRight className="size-3.5" aria-hidden="true" />
    </>
  );
  // Site pages go through Link; files (llms.txt) and other sites don't.
  return href.startsWith("/") && href.endsWith("/") ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <a href={href} className={className}>
      {inner}
    </a>
  );
}
