"use client";

import { Moon, Sun } from "lucide-react";

/** Switches between light and dark; the choice is kept in localStorage. */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const dark = !root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Storage may be unavailable (private windows); the switch still works.
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Switch between light and dark theme"
      title="Switch theme"
    >
      <Moon className="size-4 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-4 dark:block" aria-hidden="true" />
    </button>
  );
}

