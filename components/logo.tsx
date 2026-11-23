import Image from "next/image";
import Link from "next/link";

/** The Open Field plum and the wordmark, linking home. */
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-full" aria-label="Plumlang home">
      <Image src="/plum-mark.svg" width={30} height={30} alt="" priority />
      <span className="text-[0.95rem] font-semibold tracking-tight text-foreground">Plumlang</span>
    </Link>
  );
}
