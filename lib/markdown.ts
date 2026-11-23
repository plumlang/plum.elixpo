// Markdown to HTML at build time, with marked.
//
// On top of GitHub-flavoured markdown this adds what the docs need: ids and
// self-links on headings (GitHub's slugs, so links written for GitHub keep
// working; error codes keep their capitals: #E0401), Plumlang syntax
// highlighting, links rewritten from the source repository's layout to the
// site's, "section 9.4" turned into a link to that part of the spec, and
// tables that scroll on narrow screens.

import { Marked, type Tokens } from "marked";
import { escapeHtml, highlight } from "@/lib/highlight";

export type Heading = { depth: number; text: string; id: string };

export type RenderOptions = {
  /** Added to every heading's depth (-1 turns ### into h2). Headings are never above h2. */
  shift?: number;
  /** Rewrites a link's href; null means it isn't a link after all (`Channel[T](capacity)`). */
  resolveLink?: (href: string) => string | null;
  /** The URL of a spec section like "9.4", for "section 9.4" in the text. */
  sectionUrl?: (number: string) => string | undefined;
  /** Rewrites an image's src; null shows its alt text instead. Without it, images render as marked renders them. */
  resolveImage?: (src: string) => string | null;
};

const ERROR_CODE = /^[EW]\d{4}$/;

/** GitHub's heading slug: lower case, punctuation dropped, spaces to dashes. */
export function githubSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s/g, "-");
}

const decodeEntities = (text: string) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

/** Markdown without its syntax, for descriptions: `code`, [links](x), **bold**. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|\*|_)(\S[^*_]*?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();
}

/** A description of at most `max` characters, cut at a word. */
export function summarize(text: string, max = 158): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.]$/, "")}…`;
}

/** The text of the first paragraph, without markdown. */
export function firstParagraph(markdown: string): string {
  const tokens = new Marked().lexer(markdown);
  const paragraph = tokens.find((t) => t.type === "paragraph") as Tokens.Paragraph | undefined;
  return paragraph ? plainText(paragraph.text) : "";
}

export function renderMarkdown(markdown: string, options: RenderOptions = {}): { html: string; headings: Heading[] } {
  const { shift = 0, resolveLink = (href) => href, sectionUrl, resolveImage } = options;
  const headings: Heading[] = [];
  const used = new Map<string, number>();
  let linkDepth = 0;

  const uniqueId = (base: string) => {
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen}`;
  };

  const linkSections = (html: string) => {
    if (!sectionUrl || linkDepth > 0) return html;
    return html.replace(/\b(sections?) (\d+(?:\.\d+)*)\b/g, (whole, word: string, number: string) => {
      const url = sectionUrl(number);
      return url ? `<a href="${escapeHtml(url)}">${word} ${number}</a>` : whole;
    });
  };

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        const text = decodeEntities(this.parser.parseInline(tokens, this.parser.textRenderer)).trim();
        const id = uniqueId(ERROR_CODE.test(text) ? text : githubSlug(text) || "section");
        const level = Math.min(6, Math.max(2, depth + shift));
        headings.push({ depth: level, text, id });
        return `<h${level} id="${id}"><a class="heading-link" href="#${id}">${inner}</a></h${level}>\n`;
      },
      code({ text, lang }: Tokens.Code) {
        const info = (lang ?? "").trim().split(/\s+/);
        const language = info[0] || "text";
        const label = language === "text" && info.includes("output") ? "Output" : language;
        return `<div class="code-block" data-lang="${escapeHtml(label)}"><pre><code class="language-${escapeHtml(language)}">${highlight(text.replace(/\n$/, ""), language)}</code></pre></div>\n`;
      },
      link({ href, title, tokens, raw }: Tokens.Link) {
        const target = resolveLink(href);
        if (target === null) return escapeHtml(raw);
        linkDepth++;
        const inner = this.parser.parseInline(tokens);
        linkDepth--;
        const external = /^https?:\/\//.test(target);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
        const rel = external ? ' rel="noopener"' : "";
        return `<a href="${escapeHtml(target)}"${titleAttr}${rel}>${inner}</a>`;
      },
      ...(resolveImage && {
        image({ href, title, text }: Tokens.Image) {
          const src = resolveImage(href);
          if (src === null) return escapeHtml(text);
          const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
          return `<img src="${escapeHtml(src)}" alt="${escapeHtml(text)}"${titleAttr} loading="lazy" decoding="async">`;
        },
      }),
      text(token: Tokens.Text | Tokens.Escape) {
        if ("tokens" in token && token.tokens) return this.parser.parseInline(token.tokens);
        const escaped = "escaped" in token && token.escaped ? token.text : escapeHtml(token.text);
        return linkSections(escaped);
      },
      html({ text }: Tokens.HTML | Tokens.Tag) {
        // The docs are markdown; HTML comments (generator markers) are
        // dropped and anything else is shown as text, never run.
        return text.trim().startsWith("<!--") ? "" : escapeHtml(text);
      },
    },
    hooks: {
      postprocess(html: string) {
        return html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
      },
    },
  });

  const html = marked.parse(markdown, { async: false }) as string;
  return { html, headings };
}
