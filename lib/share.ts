// Share links: the program itself, in the URL's hash, so no server is
// needed and nothing is stored anywhere. The hash never reaches the server.
//
//   #code=z<base64url>   deflate-raw compressed (CompressionStream)
//   #code=t<base64url>   plain UTF-8, where the browser can't compress

const PREFIX = "#code=";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const body = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(body).arrayBuffer());
}

/** The hash that carries `source`. */
export async function encodeShare(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(source);
  if (typeof CompressionStream === "function") {
    try {
      return `${PREFIX}z${toBase64Url(await pipe(bytes, new CompressionStream("deflate-raw")))}`;
    } catch {
      // fall through: plain text
    }
  }
  return `${PREFIX}t${toBase64Url(bytes)}`;
}

/** The program a hash carries; null when it carries none; throws if it is damaged. */
export async function decodeShare(hash: string): Promise<string | null> {
  if (!hash.startsWith(PREFIX)) return null;
  const kind = hash.charAt(PREFIX.length);
  const bytes = fromBase64Url(hash.slice(PREFIX.length + 1));
  if (kind === "t") return new TextDecoder().decode(bytes);
  if (kind === "z") {
    if (typeof DecompressionStream !== "function") {
      throw new Error("this browser can't open compressed share links (no DecompressionStream)");
    }
    return new TextDecoder().decode(await pipe(bytes, new DecompressionStream("deflate-raw")));
  }
  throw new Error("this share link is not one the playground made");
}
