import { readFile, readdir } from 'node:fs/promises';

// Inspect actual published HTML, not the retired src/content snapshots.
const root = new URL('../dist/', import.meta.url);
async function walk(dir) {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(
    entry => entry.isDirectory()
      ? walk(new URL(`${entry.name}/`, dir))
      : new URL(entry.name, dir)
  ))).flat();
}
const links = new Set();
for (const file of (await walk(root)).filter(file => file.pathname.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="(https?:\/\/[^"]+)"/g)) {
    const url = new URL(href.replaceAll('&amp;', '&'));
    url.hash = '';
    links.add(url.href);
  }
}

let missing = 0;
let unverified = 0;
for (const url of [...links].sort()) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'nealyx-portfolio-link-check/1.0' },
    });
    // A denial or network failure isn't proof that a public page is missing.
    const label = [404, 410].includes(response.status) ? 'MISSING'
      : response.ok ? 'OK' : 'UNVERIFIED';
    if (label === 'MISSING') missing++;
    if (label === 'UNVERIFIED') unverified++;
    console.log(`${label} ${response.status} ${url}${response.redirected ? ` → ${response.url}` : ''}`);
  } catch (error) {
    unverified++;
    console.log(`UNVERIFIED ${url}: ${error.message}`);
  }
}
console.log(`${links.size} unique external links; ${missing} missing; ${unverified} unverified.`);
// Form actions are deliberately excluded: never submit a real inquiry as a test.
if (missing) process.exitCode = 1;
