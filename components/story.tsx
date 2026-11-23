import { cn } from "@/lib/utils";

/**
 * One section of the landing page's story: a numbered eyebrow, one idea as
 * the heading, one line to the right of it, the content, and the next step.
 */
export function StorySection({
  id,
  number,
  eyebrow,
  title,
  line,
  next,
  className,
  children,
}: {
  id: string;
  number: string;
  eyebrow: string;
  title: React.ReactNode;
  line: React.ReactNode;
  next: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("border-b", className)}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
        <header className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.19em] text-primary">
              {number} · {eyebrow}
            </p>
            <h2 id={`${id}-title`} className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl">
              {title}
            </h2>
          </div>
          <p className="self-end text-base leading-relaxed text-muted-foreground lg:text-lg">{line}</p>
        </header>
        <div className="mt-12">{children}</div>
        <div className="mt-10 flex flex-wrap items-center gap-2">{next}</div>
      </div>
    </section>
  );
}

/** A small card inside a story section. */
export function StoryCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <article className={cn("flex min-w-0 flex-col rounded-3xl border bg-card p-6 sm:p-7", className)}>{children}</article>;
}
