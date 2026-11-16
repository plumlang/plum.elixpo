"""Check the exported site in out/ before it is deployed.

    python3 scripts/check_site.py out        (npm run site:check)

Checks every HTML page for a title, a description, one h1, a canonical URL
that is the page's own (with its trailing slash), Open Graph and Twitter
cards; every internal link and #anchor for a target that exists; the
sitemap for exactly the indexable pages; robots.txt; and the files
Cloudflare Pages and browsers expect.

For language models it checks that every docs page has its Markdown copy
at its URL plus index.md, announced by <link rel="alternate"> and embedded
for "Copy for LLM"; that llms.txt is in the llmstxt.org shape and its links
resolve; and that llms-full.txt holds every reference page. Python
standard library only.
"""

from __future__ import annotations

import argparse
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

SITE_URL = "https://plum.elixpo.com"
SITEMAP_NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
REQUIRED_FILES = (
    "index.html",
    "404.html",
    "favicon.ico",
    "robots.txt",
    "sitemap.xml",
    "manifest.webmanifest",
    "og.png",
    "og-docs.png",
    "plum-mark.svg",
    "_headers",
    "llms.txt",
    "llms-full.txt",
    "install.sh",
    "install.ps1",
    # The playground: plumlang's WebAssembly build and the worker that runs it.
    "playground/plum.js",
    "playground/plum.wasm",
    "playground/worker.js",
)

# Served as text, not downloaded or sniffed (public/_headers).
TEXT_FILES = ("/install.sh", "/install.ps1", "/llms.txt", "/llms-full.txt")

# Docs pages that llms-full.txt leaves out: it is the language, not the site.
NOT_IN_FULL = ("/docs/", "/docs/install/", "/docs/agents/")


class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, str] = {}
        self.links: dict[str, str] = {}
        self.title = ""
        self.h1 = 0
        self.ids: set[str] = set()
        self.hrefs: list[str] = []
        self.alternates: dict[str, str] = {}
        self.images_without_alt = 0
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k: (v or "") for k, v in attrs}
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "meta":
            key = a.get("name") or a.get("property")
            if key and key not in self.meta:
                self.meta[key] = a.get("content", "")
        elif tag == "link" and a.get("rel") == "alternate" and a.get("type"):
            self.alternates[a["type"]] = a.get("href", "")
        elif tag == "link" and a.get("rel"):
            self.links.setdefault(a["rel"], a.get("href", ""))
        elif tag == "title":
            self._in_title = True
        elif tag == "h1":
            self.h1 += 1
        elif tag == "a" and "href" in a:
            self.hrefs.append(a["href"])
        elif tag == "img" and "alt" not in a:
            self.images_without_alt += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data


def url_path(file: Path, site: Path) -> str:
    """out/docs/index.html -> /docs/ ; out/index.html -> /"""
    rel = file.relative_to(site).as_posix()
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def target_file(path: str, site: Path) -> Path | None:
    """The file Cloudflare Pages would serve for a site path, if any."""
    path = unquote(path)
    candidates = [site / path.lstrip("/")]
    if path.endswith("/"):
        candidates = [site / path.lstrip("/") / "index.html"]
    else:
        candidates.append(site / (path.lstrip("/") + ".html"))
    for c in candidates:
        if c.is_file():
            return c
    return None


def check(site: Path) -> list[str]:
    problems: list[str] = []
    for name in REQUIRED_FILES:
        if not (site / name).is_file():
            problems.append(f"missing {name}")

    pages: dict[str, Page] = {}
    for file in sorted(site.rglob("*.html")):
        rel = file.relative_to(site).as_posix()
        if rel.startswith("_") or "/_" in rel:
            continue
        page = Page()
        page.feed(file.read_text(encoding="utf-8"))
        pages[url_path(file, site)] = page

    indexable: set[str] = set()
    for path, page in pages.items():
        where = f"{path}:"
        is_404 = path in ("/404.html", "/404/")
        if not page.title.strip():
            problems.append(f"{where} no <title>")
        if not page.meta.get("description"):
            problems.append(f"{where} no meta description")
        if page.h1 != 1:
            problems.append(f"{where} {page.h1} <h1> elements, expected 1")
        if page.images_without_alt:
            problems.append(f"{where} {page.images_without_alt} <img> without alt")
        if is_404:
            continue
        if "noindex" in page.meta.get("robots", ""):
            continue
        indexable.add(path)
        canonical = SITE_URL + path
        if page.links.get("canonical") != canonical:
            problems.append(f"{where} canonical is {page.links.get('canonical')!r}, expected {canonical!r}")
        if page.meta.get("og:url") != canonical:
            problems.append(f"{where} og:url is {page.meta.get('og:url')!r}, expected {canonical!r}")
        for key in ("og:title", "og:description", "og:image", "twitter:image"):
            if not page.meta.get(key):
                problems.append(f"{where} no {key}")
        if page.meta.get("twitter:card") != "summary_large_image":
            problems.append(f"{where} twitter:card is not summary_large_image")
        if not path.endswith("/"):
            problems.append(f"{where} page URL has no trailing slash")
        if path.startswith("/docs/"):
            problems.extend(check_docs_page(path, page, site))

    # Internal links and anchors.
    for path, page in pages.items():
        for href in page.hrefs:
            parts = urlsplit(href)
            if parts.scheme in ("mailto", "tel") or (parts.netloc and parts.netloc != "plum.elixpo.com"):
                continue
            if parts.scheme and parts.scheme not in ("http", "https"):
                continue
            link_path = parts.path or path
            if not link_path.startswith("/"):
                problems.append(f"{path}: relative link {href!r}")
                continue
            target = target_file(link_path, site)
            if target is None:
                problems.append(f"{path}: broken link {href!r}")
                continue
            if link_path.endswith("/") is False and not Path(link_path).suffix:
                problems.append(f"{path}: link {href!r} has no trailing slash")
            if parts.fragment and target.suffix == ".html":
                other = pages.get(url_path(target, site))
                if other is not None and unquote(parts.fragment) not in other.ids:
                    problems.append(f"{path}: link {href!r} points at a missing anchor")

    # robots.txt
    robots = (site / "robots.txt").read_text(encoding="utf-8").casefold() if (site / "robots.txt").is_file() else ""
    if "user-agent: *" not in robots or "allow: /" not in robots:
        problems.append("robots.txt does not allow every crawler")
    if "disallow: /\n" in robots + "\n":
        problems.append("robots.txt disallows the site")
    if f"sitemap: {SITE_URL}/sitemap.xml" not in robots:
        problems.append("robots.txt does not name the sitemap")

    # The sitemap lists exactly the indexable pages.
    if (site / "sitemap.xml").is_file():
        tree = ET.parse(site / "sitemap.xml")
        listed = {
            (node.text or "").strip()
            for node in tree.findall(f"{SITEMAP_NS}url/{SITEMAP_NS}loc")
        }
        expected = {SITE_URL + p for p in indexable}
        for url in sorted(expected - listed):
            problems.append(f"sitemap.xml lacks {url}")
        for url in sorted(listed - expected):
            problems.append(f"sitemap.xml lists {url}, which is not an indexable page")

    problems.extend(check_llm_files(site, {p for p in indexable if p.startswith("/docs/")}))
    problems.extend(check_headers(site))
    if "llms.txt" not in robots:
        problems.append("robots.txt does not mention llms.txt")
    return problems


def check_docs_page(path: str, page: Page, site: Path) -> list[str]:
    """A docs page: its social card, its Markdown copy and Copy for LLM."""
    problems: list[str] = []
    where = f"{path}:"
    if not page.meta.get("og:image", "").endswith("/og-docs.png"):
        problems.append(f"{where} og:image is not the docs card (og-docs.png)")
    if "llm-markdown" not in page.ids:
        problems.append(f"{where} no embedded Markdown for Copy for LLM")
    markdown_url = SITE_URL + path + "index.md"
    if page.alternates.get("text/markdown") != markdown_url:
        problems.append(f"{where} alternate text/markdown is {page.alternates.get('text/markdown')!r}, expected {markdown_url!r}")
    file = site / path.lstrip("/") / "index.md"
    if not file.is_file():
        problems.append(f"{where} no Markdown copy at {path}index.md")
        return problems
    text = file.read_text(encoding="utf-8")
    if not text.startswith(f"Source: {SITE_URL}{path}\n\n# "):
        problems.append(f"{path}index.md does not start with its Source line and a # title")
    return problems


def check_llm_files(site: Path, docs_pages: set[str]) -> list[str]:
    """llms.txt (llmstxt.org), llms-full.txt, and no stray Markdown copies."""
    problems: list[str] = []
    for md in sorted(site.rglob("index.md")):
        page = "/" + md.parent.relative_to(site).as_posix() + "/"
        if page not in docs_pages:
            problems.append(f"{page}index.md has no docs page")

    llms = site / "llms.txt"
    if llms.is_file():
        lines = llms.read_text(encoding="utf-8").splitlines()
        if not lines or not lines[0].startswith("# "):
            problems.append("llms.txt does not start with an H1")
        if not any(line.startswith("> ") for line in lines[:4]):
            problems.append("llms.txt has no blockquote summary after its H1")
        if not any(line.startswith("## ") for line in lines):
            problems.append("llms.txt has no ## sections")
        for line in lines:
            m = re.match(r"^- \[[^\]]+\]\(([^)]+)\)", line)
            if not m:
                continue
            parts = urlsplit(m.group(1))
            if parts.netloc != "plum.elixpo.com":
                continue
            if target_file(parts.path, site) is None:
                problems.append(f"llms.txt links to {m.group(1)}, which does not exist")

    full = site / "llms-full.txt"
    if full.is_file():
        text = full.read_text(encoding="utf-8")
        if not text.startswith("# "):
            problems.append("llms-full.txt does not start with an H1")
        for page in sorted(docs_pages):
            if page not in NOT_IN_FULL and f"Source: {SITE_URL}{page}\n" not in text:
                problems.append(f"llms-full.txt lacks {page}")
    return problems


def check_headers(site: Path) -> list[str]:
    """public/_headers serves the installers and llms files as UTF-8 text, and plum.wasm as wasm."""
    problems: list[str] = []
    headers = (site / "_headers").read_text(encoding="utf-8") if (site / "_headers").is_file() else ""
    rules: dict[str, list[str]] = {}
    current = ""
    for line in headers.splitlines():
        if line.startswith("/"):
            current = line.strip()
            rules[current] = []
        elif line.startswith((" ", "\t")) and current:
            rules[current].append(line.strip().casefold())
    for path in TEXT_FILES:
        if "content-type: text/plain; charset=utf-8" not in rules.get(path, []):
            problems.append(f"_headers does not serve {path} as text/plain; charset=utf-8")
    if "content-type: application/wasm" not in rules.get("/playground/plum.wasm", []):
        problems.append("_headers does not serve /playground/plum.wasm as application/wasm")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("site", type=Path, nargs="?", default=Path("out"), help="the exported site (default: out)")
    args = parser.parse_args()
    if not (args.site / "index.html").is_file():
        print(f"{args.site} has no index.html; run npm run build first", file=sys.stderr)
        return 2
    problems = check(args.site)
    for problem in problems:
        print(problem, file=sys.stderr)
    if problems:
        print(f"site check: {len(problems)} problem(s)", file=sys.stderr)
        return 1
    print(f"site check: {args.site} is consistent")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
