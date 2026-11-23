"use client";

import { useEffect } from "react";

/**
 * Adds a "Copy" button to every code block on the page. The blocks are
 * rendered as static HTML, so the buttons are added once the page loads;
 * without JavaScript the code is still there to select.
 */
export function CopyButtons() {
  useEffect(() => {
    const added: HTMLButtonElement[] = [];
    for (const block of document.querySelectorAll<HTMLElement>(".code-block")) {
      if (block.dataset.lang === "Output" || block.querySelector(".copy-button")) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "copy-button rounded-md border border-white/20 bg-[var(--plum-deep)] px-2 py-1 font-mono text-[0.7rem] text-[var(--paper)] hover:border-white/40";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy this code");
      button.addEventListener("click", async () => {
        const code = block.querySelector("code")?.textContent ?? "";
        try {
          await navigator.clipboard.writeText(code);
          button.textContent = "Copied";
        } catch {
          button.textContent = "Select and copy";
        }
        window.setTimeout(() => (button.textContent = "Copy"), 1600);
      });
      block.appendChild(button);
      added.push(button);
    }
    return () => added.forEach((button) => button.remove());
  }, []);
  return null;
}
