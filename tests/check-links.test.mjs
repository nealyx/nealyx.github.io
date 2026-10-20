import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('external checker uses published pages, deduplicates links and distinguishes missing from denied', async () => {
  const requests = [];
  const server = createServer((req, res) => {
    requests.push({ method: req.method, path: req.url });
    if (req.url === '/missing') res.statusCode = 404;
    if (req.url === '/denied') res.statusCode = 403;
    if (req.url === '/redirect') {
      res.statusCode = 302;
      res.setHeader('Location', '/ok');
    }
    res.end();
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const root = await mkdtemp(path.join(tmpdir(), 'neal-links-'));
  try {
    await mkdir(path.join(root, 'scripts'));
    await mkdir(path.join(root, 'dist/nested'), { recursive: true });
    await mkdir(path.join(root, 'src/content'), { recursive: true });
    await cp(new URL('../scripts/check-links.mjs', import.meta.url), path.join(root, 'scripts/check-links.mjs'));
    await writeFile(path.join(root, 'src/content/site.json'), JSON.stringify({
      socials: [{ url: `${origin}/retired` }],
    }));
    await writeFile(path.join(root, 'dist/index.html'), `
      <a href="${origin}/ok#first">OK</a>
      <a href="${origin}/ok#second">Same destination</a>
      <a href="${origin}/missing">Missing</a>
      <form action="${origin}/inquiry" method="post"></form>
    `);
    await writeFile(path.join(root, 'dist/nested/index.html'), `
      <a href="${origin}/denied">Denied</a>
      <a href="${origin}/redirect">Redirect</a>
    `);
    const child = spawn(process.execPath, [path.join(root, 'scripts/check-links.mjs')]);
    let output = '';
    let errors = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { errors += data; });
    const [code] = await once(child, 'close');
    assert.equal(code, 1, errors);
    assert.match(output, /MISSING 404/);
    assert.match(output, /UNVERIFIED 403/);
    assert.match(output, /4 unique external links; 1 missing; 1 unverified/);
    assert.equal(requests.length, 5); // Four URLs and one redirect.
    assert.ok(requests.every(req => req.method === 'HEAD'));
    assert.ok(requests.every(req => !['/inquiry', '/retired'].includes(req.path)));
  } finally {
    await rm(root, { recursive: true, force: true });
    await new Promise(resolve => server.close(resolve));
  }
});
