"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/lib/docs";
import { cn } from "@/lib/utils";

const normalize = (path: string) => (path.endsWith("/") ? path : `${path}/`);

function Groups({ groups, current }: { groups: NavGroup[]; current: string }) {
  return (
    <div className="space-y-7">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-2 px-2 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = normalize(item.path) === current;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm leading-snug transition-colors",
                      active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** The docs' navigation: a column on wide screens, a menu on narrow ones. */
export function DocsSidebar({ groups }: { groups: NavGroup[] }) {
  const current = normalize(usePathname() ?? "/");
  return (
    <>
      <details className="mb-6 rounded-lg border lg:hidden">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Documentation menu</summary>
        <nav aria-label="Documentation" className="border-t px-2 py-4">
          <Groups groups={groups} current={current} />
        </nav>
      </details>
      <nav
        aria-label="Documentation"
        className="sticky top-20 hidden max-h-[calc(100svh-5rem)] overflow-y-auto py-8 pr-4 lg:block"
      >
        <Groups groups={groups} current={current} />
      </nav>
    </>
  );
}
