import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Press_Start_2P } from "next/font/google";

// The pixel register (brand-system.md) is for playful places, like this one.
const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", display: "swap" });

export const metadata: Metadata = {
  title: "Page not found",
  description: "There is no page at this address on plum.elixpo.com.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-24 sm:px-6">
      <Image src="/plum-pixel.svg" width={96} height={96} alt="" className="[image-rendering:pixelated]" />
      <p className={`${pixel.className} mt-8 text-sm text-primary`}>404</p>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight">This page didn&apos;t grow.</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">There is nothing at this address.</p>
      <ul className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
        <li>
          <Link href="/" className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-background hover:opacity-85">
            Home
          </Link>
        </li>
        <li>
          <Link href="/docs/" className="inline-flex h-10 items-center rounded-full border px-5 hover:bg-muted">
            Documentation
          </Link>
        </li>
        <li>
          <Link href="/docs/errors/" className="inline-flex h-10 items-center rounded-full border px-5 hover:bg-muted">
            Error codes
          </Link>
        </li>
      </ul>
    </main>
  );
}
