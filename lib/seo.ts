import type { Metadata } from "next";
import { CREATORS, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

// The site's social card: the Elixpo x Plumlang banner (public/banner.jpg),
// fitted to 1200 x 630 for Open Graph and Twitter (public/og-banner.jpg).
// Docs pages keep their own card from plumlang/branding (og/plum.elixpo/).
export const OG_IMAGE = {
  url: "/og-banner.jpg",
  width: 1200,
  height: 630,
  alt: "Elixpo x Plumlang: a new programming language, built in the open, at github.com/plumlang and plum.elixpo.com",
} as const;

export const DOCS_OG_IMAGE = {
  url: "/og-docs.png",
  width: 1280,
  height: 720,
  alt: "Learn Plumlang: the tour, the specification, the standard library and every error code",
} as const;

type OgImage = typeof OG_IMAGE | typeof DOCS_OG_IMAGE;

/**
 * Metadata for one page: title, description, canonical URL, Open Graph and
 * Twitter cards. `path` is the page's path with its trailing slash.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  absoluteTitle = false,
  image = path.startsWith("/docs/") ? DOCS_OG_IMAGE : OG_IMAGE,
  markdown,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  absoluteTitle?: boolean;
  image?: OgImage;
  /** The path of the page's Markdown copy, announced as an alternate. */
  markdown?: string;
}): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: markdown ? { canonical: path, types: { "text/markdown": markdown } } : { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_US",
      title: socialTitle,
      description,
      url: path,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

/** JSON for a <script type="application/ld+json">, safe inside HTML. */
export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

export const ORGANIZATION = {
  "@type": "Organization",
  "@id": "https://elixpo.com/#organization",
  name: "Elixpo",
  url: "https://elixpo.com",
  sameAs: ["https://github.com/elixpo", "https://github.com/plumlang"],
} as const;

/** The creators as schema.org people, working at Elixpo. */
export const CREATOR_PEOPLE = CREATORS.map((name) => ({
  "@type": "Person",
  name,
  affiliation: { "@id": ORGANIZATION["@id"] },
}));

export const WEBSITE = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: absoluteUrl("/"),
  inLanguage: "en",
  publisher: { "@id": ORGANIZATION["@id"] },
} as const;

/** A schema.org BreadcrumbList from (name, path) pairs, home first. */
export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
