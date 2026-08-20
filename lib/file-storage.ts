import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isRemoteLocator(locator: string) {
  return /^https?:\/\//i.test(locator);
}

/**
 * Persists a file under `<category>/<subpath>`. On Vercel (BLOB_READ_WRITE_TOKEN set)
 * this goes to a private Vercel Blob store, because Vercel's serverless functions only
 * have a read-only filesystem outside /tmp. Locally it falls back to disk under
 * storage/uploads/, returning a relative path. The returned locator is opaque and must
 * be read back via loadFile (or loadFileByPathname when addRandomSuffix is false).
 */
export async function saveFile(
  category: string,
  subpath: string,
  bytes: Buffer,
  contentType?: string,
  options?: { addRandomSuffix?: boolean },
): Promise<string> {
  if (blobEnabled()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${category}/${subpath}`, bytes, {
      access: "private",
      contentType,
      addRandomSuffix: options?.addRandomSuffix ?? true,
    });
    return blob.url;
  }
  const root = path.resolve(process.cwd(), "storage", "uploads");
  const target = path.resolve(root, category, subpath);
  if (!target.startsWith(root + path.sep)) throw new Error("Caminho de armazenamento invalido.");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return path.relative(root, target).split(path.sep).join("/");
}

/** Reads back a locator produced by saveFile: a blob URL (fetched via the private Blob API) or a disk-relative path. */
export async function loadFile(locator: string): Promise<Buffer> {
  if (isRemoteLocator(locator)) {
    const { get } = await import("@vercel/blob");
    const result = await get(locator, { access: "private" });
    if (!result || result.statusCode !== 200) throw new Error("Ficheiro nao encontrado no armazenamento.");
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }
  const root = path.resolve(process.cwd(), "storage", "uploads");
  const target = path.resolve(root, locator);
  if (!target.startsWith(root + path.sep)) throw new Error("Caminho de armazenamento invalido.");
  return readFile(target);
}

/** Reads a file saved with a stable (non-random-suffixed) pathname, by category + subpath. Returns null when missing. */
export async function loadFileByPathname(category: string, subpath: string): Promise<Buffer | null> {
  if (blobEnabled()) {
    try {
      const { get } = await import("@vercel/blob");
      const result = await get(`${category}/${subpath}`, { access: "private" });
      if (!result || result.statusCode !== 200) return null;
      return Buffer.from(await new Response(result.stream).arrayBuffer());
    } catch {
      return null;
    }
  }
  const root = path.resolve(process.cwd(), "storage", "uploads");
  const target = path.resolve(root, category, subpath);
  if (!target.startsWith(root + path.sep)) return null;
  try {
    return await readFile(target);
  } catch {
    return null;
  }
}
