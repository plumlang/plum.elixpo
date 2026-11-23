"use client";

import { useEffect } from "react";

const RESET_MS = 1600;

/** Copies text, falling back to a selection where the Clipboard API is missing. */
async function copyText(text: string, node: Node): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const selection = window.getSelection();
    if (!selection) return false;
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
    return document.execCommand?.("copy") ?? false;
  }
}

/**
 * Makes every code block's copy button work (lib/code-block.ts renders them).
 * One click handler on the document covers the blocks on every page, including
 * the docs, which are static HTML. Mounted once, in the root layout.
 */
export function CopyButtons() {
  useEffect(() => {
    const timers = new Map<HTMLElement, number>();
    const onClick = async (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest<HTMLElement>("[data-copy]");
      const code = button?.closest(".code-block")?.querySelector("pre code");
      if (!button || !code) return;
      const ok = await copyText(code.textContent ?? "", code);
      const text = button.querySelector(".copy-button__text");
      button.toggleAttribute("data-copied", ok);
      if (text) text.textContent = ok ? "Copied" : "Press Ctrl+C";
      window.clearTimeout(timers.get(button));
      timers.set(
        button,
        window.setTimeout(() => {
          button.removeAttribute("data-copied");
          if (text) text.textContent = "Copy";
        }, RESET_MS),
      );
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);
  return null;
}
