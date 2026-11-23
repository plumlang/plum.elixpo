import { DocsSidebar } from "@/components/docs-sidebar";
import { NAV } from "@/lib/docs";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <aside className="pt-6 lg:pt-0">
        <DocsSidebar groups={NAV} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
