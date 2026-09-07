import { readdir, cp, rm, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
// Published HTML/assets are now the author's source of truth. Never overwrite them
// with the earlier templates in src/: that would silently discard manual edits.
const publicDirs = new Set(['assets', 'images', 'work', 'notes']);
const publicFiles = new Set(['.nojekyll', 'robots.txt', 'sitemap.xml']);
await rm(path.join(root, 'dist'), { recursive: true, force: true });
await mkdir(path.join(root, 'dist'), { recursive: true });
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isDirectory() ? publicDirs.has(entry.name) : entry.name.endsWith('.html') || publicFiles.has(entry.name)) {
    await cp(path.join(root, entry.name), path.join(root, 'dist', entry.name), { recursive: true });
  }
}
console.log('Packaged current HTML and assets into dist/. Published source files are unchanged.');
