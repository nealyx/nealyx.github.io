import { cp, rm, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
// Keep preview and publication focused on the one research page. Old local
// pages or assets must not silently become part of a newly packaged site.
const publicFiles = [
  'index.html', 'research.html', '404.html', 'assets/site.css',
  '.nojekyll', 'robots.txt', 'sitemap.xml',
];
await rm(path.join(root, 'dist'), { recursive: true, force: true });
for (const name of publicFiles) {
  const target = path.join(root, 'dist', name);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(root, name), target);
}
console.log('Packaged the research page, legacy redirect, and supporting files into dist/.');
