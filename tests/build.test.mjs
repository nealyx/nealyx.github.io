import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const publicFiles = [
  '.nojekyll', '404.html', 'assets/site.css', 'index.html',
  'research.html', 'robots.txt', 'sitemap.xml',
];

async function filesBelow(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await filesBelow(path.join(directory, entry.name), relative));
    else files.push(relative);
  }
  return files.sort();
}

test('build publishes only the explicit site files and preserves authored bytes', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'neal-build-'));
  try {
    await mkdir(path.join(root, 'scripts'));
    await cp(new URL('../scripts/build.mjs', import.meta.url), path.join(root, 'scripts/build.mjs'));
    const home = Buffer.from('<!doctype html>\r\n<h1>Authored research — preserved</h1>\r\n');
    const expected = new Map(publicFiles.map(file => [file, file === 'index.html' ? home : Buffer.from(`Current ${file}\n`)]));
    const stale = [
      'phystutor.html', 'old-page.html', 'work/old-project/index.html',
      'notes/old-note/index.html', 'images/old-portrait.png',
      'src/content/site.json', 'assets/hero-canvas.js', 'assets/fonts/old-font.woff2',
      'dist/old-page.html', 'dist/work/old-project/index.html',
    ];
    for (const [file, bytes] of [...expected, ...stale.map(file => [file, Buffer.from('Retired content')])]) {
      await mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await writeFile(path.join(root, file), bytes);
    }
    execFileSync(process.execPath, [path.join(root, 'scripts/build.mjs')]);
    assert.deepEqual(await filesBelow(path.join(root, 'dist')), publicFiles);
    for (const [file, bytes] of expected) {
      assert.deepEqual(await readFile(path.join(root, file)), bytes, `source changed: ${file}`);
      assert.deepEqual(await readFile(path.join(root, 'dist', file)), bytes, `published bytes changed: ${file}`);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});
