// The playground's examples menu, built from content/ at build time: the
// single-file programs of plumlang's examples/ (snapshotted in
// content/docs/examples/ by scripts/sync-docs.mjs) and the first runnable
// program of each tour step. Programs that need the network, files or other
// files are left out: the browser's plum is sandboxed (plumlang
// docs/playground.md).

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { TOUR_PAGES } from "@/lib/docs";

export type PlaygroundExample = {
  id: string;
  group: string;
  title: string;
  source: string;
};

/** What the playground opens with. */
export const WELCOME_PROGRAM = `# Welcome to the Plumlang playground: edit this, then Run (Ctrl+Enter).
branch greet(name: str) -> str {
    return "Hello, {name}!"
}

plant names = ["world", "plum", "you"]
for name in names {
    drop(greet(name))
}
drop("{len(names)} greetings")
`;

/** Can this program run in the browser? */
const portable = (source: string) =>
  !/^seed\s+(fs|net|http|os)\b|^seed\s+\./m.test(source) && !/\b(ask|io\.read_line|io\.read_all)\(/.test(source);

/** "shapes.plum" -> "Shapes". */
const titleOf = (file: string) => {
  const name = file.replace(/\.plum$/, "").replace(/[-_]/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
};

function examples(): PlaygroundExample[] {
  const dir = join(process.cwd(), "content", "docs", "examples");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".plum"))
    .sort()
    .map((file) => ({ file, source: readFileSync(join(dir, file), "utf8") }))
    .filter(({ source }) => portable(source))
    .map(({ file, source }) => ({
      id: `example-${file.replace(/\.plum$/, "")}`,
      group: "Examples",
      title: titleOf(file),
      source,
    }));
}

/** The first ```plum block followed by its output in a tour step. */
function firstRunnable(markdown: string): string | undefined {
  const blocks = /```plum\n([\s\S]*?)\n```\s*\n+```(?:text\s+)?output\n/g;
  for (let m = blocks.exec(markdown); m; m = blocks.exec(markdown)) {
    if (portable(m[1])) return `${m[1]}\n`;
  }
  return undefined;
}

function tour(): PlaygroundExample[] {
  return TOUR_PAGES.slice(1).flatMap((page, i) => {
    const source = firstRunnable(page.markdown);
    return source
      ? [{ id: `tour-${page.slug[page.slug.length - 1]}`, group: "Tour", title: `${i + 1}. ${page.navTitle}`, source }]
      : [];
  });
}

export const PLAYGROUND_EXAMPLES: PlaygroundExample[] = [
  { id: "welcome", group: "Start", title: "Hello", source: WELCOME_PROGRAM },
  ...tour(),
  ...examples(),
];
