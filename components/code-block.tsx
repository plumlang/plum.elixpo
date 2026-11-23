import { codeBlockInner, codeBlockLabel } from "@/lib/code-block";
import { cn } from "@/lib/utils";

/** A highlighted code block with a header and a copy button, rendered at build time. */
export function CodeBlock({
  code,
  lang = "plum",
  label,
  className,
}: {
  code: string;
  lang?: string;
  label?: string;
  className?: string;
}) {
  const shown = codeBlockLabel(lang, label);
  return (
    <div
      className={cn("code-block", className)}
      data-lang={shown}
      dangerouslySetInnerHTML={{ __html: codeBlockInner(code.trim(), lang, shown) }}
    />
  );
}
