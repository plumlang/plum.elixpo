import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// Rendered once at build time into out/manifest.webmanifest (output: "export").
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: a small, fast, memory-safe programming language`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F6F5F0",
    theme_color: "#5B2A86",
    categories: ["developer", "education", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
