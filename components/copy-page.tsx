"use client";

import { useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";

/**
 * "Copy for LLM": copies the page's Markdown, which starts with the page's
 * URL. The Markdown is in the page as JSON (<script id="llm-markdown">), so
 * the copy needs no request and works offline.
 */
export function CopyPageButton() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    try {
      const source = document.getElementById("llm-markdown")?.textContent ?? "";
      await navigator.clipboard.writeText(JSON.parse(source) as string);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 1800);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-10 items-center gap-2 rounded-full border bg-card px-4 text-[0.82rem] font-medium transition-colors hover:bg-muted"
      title="Copy this page as Markdown, with its URL, for a language model"
    >
      {state === "copied" ? (
        <Check className="size-3.5 text-production" aria-hidden="true" />
      ) : (
        <ClipboardCopy className="size-3.5" aria-hidden="true" />
      )}
      <span aria-live="polite">
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy for LLM"}
      </span>
    </button>
  );
}
