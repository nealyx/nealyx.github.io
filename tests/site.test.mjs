import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const root = new URL('../dist/', import.meta.url);
const origin = 'https://nealyx.github.io/';
const projectIds = ['math-reward', 'reviewops', 'multimodal', 'formalization'];

async function walk(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await walk(new URL(entry.name + '/', directory), relative + '/'));
    else files.push(relative);
  }
  return files.sort();
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)].map(([, key, , value]) => [key.toLowerCase(), value]));
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(([tag]) => attributes(tag));
}

test('published inventory contains only the research homepage, alias, error page and required assets', async () => {
  assert.deepEqual(await walk(root), [
    '.nojekyll', '404.html', 'assets/site.css', 'index.html',
    'research.html', 'robots.txt', 'sitemap.xml',
  ]);
});

test('internal page links and assets resolve, including fragment targets', async () => {
  for (const file of (await walk(root)).filter(file => file.endsWith('.html'))) {
    const html = await readFile(new URL(file, root), 'utf8');
    for (const [, raw] of html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/g)) {
      if (raw === 'data:,') continue;
      const url = new URL(raw.replaceAll('&amp;', '&'), new URL(file, origin));
      assert.ok(['http:', 'https:', 'mailto:'].includes(url.protocol), `${file}: unexpected URL scheme ${raw}`);
      if (url.origin !== new URL(origin).origin) continue;
      let target = new URL('.' + url.pathname, root);
      if ((await stat(target)).isDirectory()) target = new URL('index.html', target.href.replace(/\/?$/, '/'));
      assert.ok((await stat(target)).isFile(), `${file}: missing ${raw}`);
      if (url.hash) {
        const destination = await readFile(target, 'utf8');
        const ids = [...destination.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(([, id]) => id);
        assert.ok(ids.includes(decodeURIComponent(url.hash.slice(1))), `${file}: missing fragment ${raw}`);
      }
    }
  }
});

test('homepage is a semantic, script-free research page with root sharing metadata', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.equal(tags(html, 'html')[0]?.lang, 'en');
  const metadata = tags(html, 'meta');
  for (const name of ['viewport', 'description']) {
    assert.ok(metadata.find(meta => meta.name === name)?.content?.trim(), `missing ${name}`);
  }
  for (const property of ['og:title', 'og:description']) {
    assert.ok(metadata.find(meta => meta.property === property)?.content?.trim(), `missing ${property}`);
  }
  assert.equal(metadata.find(meta => meta.property === 'og:url')?.content, origin);
  assert.equal(tags(html, 'link').find(link => link.rel === 'canonical')?.href, origin);
  assert.equal(tags(html, 'link').find(link => link.rel === 'icon')?.href, 'data:,');
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  assert.equal(headings.length, 1);
  assert.equal(headings[0][1].replace(/<[^>]*>/g, '').trim(), 'neal shandilya');
  assert.equal(tags(html, 'main').length, 1);
  const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(([, id]) => id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate IDs');
  for (const id of projectIds) assert.ok(ids.includes(id), `missing project ${id}`);
  assert.match(html, /<a\b[^>]*href=["']https:\/\/github\.com\/nealyx["'][^>]*>\s*GitHub\s*<\/a>/i);
  assert.doesNotMatch(html, /<(?:script|nav|svg|canvas|form)\b/i);
  assert.doesNotMatch(html, /\bid=["'](?:work|problems|milestones|skills|about|contact)["']/i);
});

test('legacy research alias preserves project fragments and has a no-script fallback', async () => {
  const html = await readFile(new URL('research.html', root), 'utf8');
  assert.equal(tags(html, 'link').find(link => link.rel === 'canonical')?.href, origin);
  const refresh = tags(html, 'meta').find(meta => meta['http-equiv']?.toLowerCase() === 'refresh');
  assert.match(refresh?.content ?? '', /^\s*\d+\s*;\s*url\s*=\s*(?:\/|https:\/\/nealyx\.github\.io\/)\s*$/i);
  assert.ok(tags(html, 'a').some(link => ['/', origin].includes(link.href)), 'visible home fallback');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.equal(attributes(scripts[0][1]).src, undefined, 'redirect must be self-contained');
  for (const hash of ['', ...projectIds.map(id => '#' + id), '#custom%20fragment']) {
    const destinations = [];
    const context = { location: { hash, replace: target => destinations.push(new URL(target, origin).href) } };
    context.window = context;
    runInNewContext(scripts[0][2], context, { timeout: 100 });
    assert.deepEqual(destinations, [origin + hash], `lost or changed fragment ${hash}`);
  }
});

test('error page and crawler metadata direct visitors to the remaining homepage', async () => {
  const html = await readFile(new URL('404.html', root), 'utf8');
  assert.equal(tags(html, 'html')[0]?.lang, 'en');
  assert.equal(tags(html, 'main').length, 1);
  assert.equal(tags(html, 'h1').length, 1);
  assert.ok(tags(html, 'a').some(link => ['/', origin].includes(link.href)));
  assert.match(tags(html, 'meta').find(meta => meta.name === 'robots')?.content ?? '', /\bnoindex\b/);
  const sitemap = await readFile(new URL('sitemap.xml', root), 'utf8');
  assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url), [origin]);
  const robots = await readFile(new URL('robots.txt', root), 'utf8');
  assert.match(robots, /^Sitemap:\s*https:\/\/nealyx\.github\.io\/sitemap\.xml\s*$/m);
});
