import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('build preserves direct edits and packages new nested pages without exposing source', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'neal-build-'));
  try {
    await mkdir(path.join(root, 'scripts'));
    await mkdir(path.join(root, 'notes/new-note'), { recursive: true });
    await mkdir(path.join(root, 'src/content'), { recursive: true });
    await cp(new URL('../scripts/build.mjs', import.meta.url), path.join(root, 'scripts/build.mjs'));
    const home = '<h1>Directly edited homepage</h1>';
    await writeFile(path.join(root, 'index.html'), home);
    await writeFile(path.join(root, 'notes/new-note/index.html'), '<h1>A new note</h1>');
    await writeFile(path.join(root, 'src/content/site.json'), '{"name":"Old design"}');
    execFileSync(process.execPath, [path.join(root, 'scripts/build.mjs')]);
    assert.equal(await readFile(path.join(root, 'index.html'), 'utf8'), home);
    assert.equal(await readFile(path.join(root, 'dist/index.html'), 'utf8'), home);
    assert.equal(await readFile(path.join(root, 'dist/notes/new-note/index.html'), 'utf8'), '<h1>A new note</h1>');
    await assert.rejects(readFile(path.join(root, 'dist/src/content/site.json')), { code: 'ENOENT' });
  } finally { await rm(root, { recursive: true, force: true }); }
});
