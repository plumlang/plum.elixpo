// The markup inside every code block, shared by <CodeBlock> (React pages) and
// the Markdown renderer (docs), so both look and behave the same. The copy
// buttons work through one click handler (components/copy-buttons.tsx).

import { escapeHtml, highlight } from "@/lib/highlight";

/** Labels for blocks that show what a program printed: nothing to copy. */
const OUTPUT_LABELS = new Set(["Output"]);

const ICON = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const COPY_ICON = `<svg class="icon-copy" ${ICON}><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_ICON = `<svg class="icon-check" ${ICON}><path d="M20 6 9 17l-5-5"/></svg>`;

/** The label shown in a block's header, e.g. "plum", "sh" or "Output". */
export const codeBlockLabel = (lang: string, label?: string) => label ?? lang;

/** The header bar and the highlighted code of a block, as HTML. */
export function codeBlockInner(code: string, lang: string, label: string): string {
  const output = OUTPUT_LABELS.has(label);
  const copy = output
    ? ""
    : `<button type="button" class="copy-button" data-copy aria-label="Copy code">${COPY_ICON}${CHECK_ICON}<span class="copy-button__text">Copy</span></button>`;
  const dots = output ? "" : '<span class="code-block__dots" aria-hidden="true"><i></i><i></i><i></i></span>';
  return (
    `<div class="code-block__bar">${dots}<span class="code-block__label">${escapeHtml(label)}</span>${copy}</div>` +
    `<pre tabindex="0"><code class="language-${escapeHtml(lang)}">${highlight(code, lang)}</code></pre>`
  );
}

/** A whole block as HTML, for the Markdown renderer. */
export const codeBlockHtml = (code: string, lang: string, label: string) =>
  `<div class="code-block" data-lang="${escapeHtml(label)}">${codeBlockInner(code, lang, label)}</div>\n`;
