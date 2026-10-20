# Research

Source for the research-only site at [nealyx.github.io](https://nealyx.github.io/).
A single page introduces public projects, their evidence, limitations, and
walkthroughs. The linked repositories remain the source for current project
status and reproduction instructions.

The site uses plain HTML, one stylesheet, and system fonts. There are no external
runtime dependencies, logo, favicon, animated background, or contact form. The
research content is readable without JavaScript.

## Preview and check

With Node.js 22 or newer, from a clone:

```sh
git clone https://github.com/nealyx/nealyx.github.io.git
cd nealyx.github.io
npm run dev
```

Open **http://127.0.0.1:4173/**. Saved edits rebuild the preview; refresh to see
them. Stop with Ctrl+C. No package installation or credentials are required.

```sh
npm test
npm run build
```

`npm test` builds the preview before running the offline checks. `npm run build`
packages the published files into `dist/` without changing their source.

For an optional network check of the external links in the built pages:

```sh
npm run check:links
```

The checker deduplicates destinations and uses HEAD requests. It distinguishes
missing pages (404/410) from unverified responses such as rate limits, access
restrictions, or timeouts. It does not submit forms or establish that a linked
research result is valid.

## Edit the site

| File | Purpose |
|---|---|
| [`index.html`](index.html) | Research homepage, project descriptions, and walkthrough links |
| [`assets/site.css`](assets/site.css) | Typography, spacing, and responsive layout |
| [`research.html`](research.html) | Compatibility redirect to the homepage, preserving project fragments |
| [`404.html`](404.html) | Missing-page message with a link to the research homepage |
| [`sitemap.xml`](sitemap.xml) and [`robots.txt`](robots.txt) | Discovery metadata for the canonical homepage |
| [`.nojekyll`](.nojekyll) | Keeps GitHub Pages in plain static-file mode |

The build uses this explicit file list. Retired portfolio, work, tutoring,
services, and About pages are not included. Their previous versions remain in
Git history; this website change does not change the research repositories.

Keep the existing project fragments (`#math-reward`, `#reviewops`, `#multimodal`,
and `#formalization`) usable for incoming links. `/research.html` remains a
compatibility route; `/` is the canonical address. If JavaScript is unavailable,
the compatibility page still provides a link to the homepage.

Project descriptions should distinguish saved-output verification from rerunning
models, synthetic demos from participant results, and proposed research from
completed experiments. Preserve the links to the math worked example, ReviewOps
walkthrough and release, multimodal offline walkthrough, and formalization design.
Do not imply adoption or scientific validation that the repositories do not show.

## Deployment

GitHub Pages publishes **main / (root)**. Update the root source files when
publishing; changing only `dist/` does not update that deployment. The ignored
`dist/` directory is the local preview/build output.

After pushing, check the Pages build for the new commit and read back the public
homepage and compatibility route before reporting that the change is live.
Local build and test success alone do not confirm deployment.

All site paths target the account-site root. Removing an obsolete page also
requires removing its root source file and sitemap entry, not only excluding it
from the preview build. Keep the minimal 404 page usable for old bookmarks.
