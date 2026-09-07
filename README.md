# Neal Shandilya

Personal website: **https://nealyx.github.io/**

An editorial notebook for mathematics, physics, computation, and teaching. Plain HTML, CSS, and native JavaScript; no client framework, runtime dependencies, or package installation required.

## Develop

Install Node.js 22 or newer, then:

```sh
npm run dev
```

Open the printed local URL (`http://127.0.0.1:4173`). Source changes rebuild automatically; refresh the browser to see them.

```sh
npm run build
npm test
node scripts/check-links.mjs
```

The build writes complete HTML pages at the repository root **and** a clean `dist/` directory. All reading, navigation, project pages, and tutoring disclosures work without JavaScript. JavaScript adds the graph and active navigation. Fonts are self-hosted under their SIL Open Font Licenses.

## Edit content

- `src/content/projects.json`: selected work, topic tags, factual descriptions, project details, optional year, and source provenance. Adding an object generates its detail route automatically.
- `src/content/notes.json`: published notes. Add `{ "slug": "your-note", "title": "Your title", "description": "A short description", "date": "2026-09-01", "body": ["First paragraph", "Second paragraph"] }`. The build creates the route and writing index entry. Empty until a real note is supplied. Plain text is HTML-escaped; no third-party content is executed.
- `src/content/site.json`: contact links, milestone records, rates, canonical origin.
- `src/content/courses.json`: tutoring subjects and expandable topic lists, migrated from the original site. These are teaching topics, not a claim about the current official AP syllabus.
- `src/assets/site.css`: design tokens, responsive layout, reduced-motion support.
- `src/assets/site.js`, `src/assets/graph.js`: progressively enhanced interactions and pure graph logic.
- `scripts/build.mjs`: shared layout and page templates.

Generated root HTML and `assets/site.*` / `assets/graph.js` should not be edited directly. Rebuild and commit their changes alongside source changes.

## GitHub Pages

The existing site publishes static files from the `main` branch. Preserve **Settings → Pages → Deploy from a branch → main / (root)**. The tracked generated files and `.nojekyll` make this compatible with the existing publishing method; no framework routing, base-path setting, or new deployment workflow is necessary. Commit the output of `npm run build` before pushing to `main`.

This is an account site, so URLs are rooted at `/`, not `/nealyx.github.io/`. Detail pages use real directories with `index.html`; direct navigation and refresh work. The old `about.html`, `research.html`, and case-sensitive `Proofs.html` URLs redirect to their new sections with a visible fallback link. `phystutor.html` stays at its original address. `essay-services.html` preserves the closed-for-Class-of-2027 notice. `404.html` handles unknown paths.

The optional private Sites preview uses the same `dist/` output, with its project configuration in `.openai/hosting.json`. Canonicals always point to GitHub Pages.

## Content boundaries

Content was migrated from the repository at `bdac56e` and the supplied redesign brief. The brief is the source for Ramsey research with William Gasarch and interests in theoretical CS / language models. The original site is the source for APL work, presentations, milestones, tutoring, and the planned free book.

- Add the Ramsey project's exact title, abstract, dates, and approved paper/code/slides links when available.
- Add public APL materials if available; the old site had no poster or technical findings to migrate. Its conflicting “active” and summer dates are not repeated as current status.
- Add actual published notes/manuscript when ready. No publication or release date is promised.
- No Codeforces handle or additional AI/language-model project details were supplied, so none are invented.
- The USAPhO Gold date was not stated; it is omitted.
- Existing Formspree inquiry destination is retained. Testing must not submit a real inquiry. Social sites may block automated link checks; a block is not evidence of a dead profile.

Existing evidence images remain at their original URLs and are never loaded by the home page. The old gold/glass CSS, particle animation, missile simulation, score gallery, and redundant sales copy have been replaced.

## Verification

`npm test` checks all 32,768 graph colorings, verifies each highlighted triangle, checks all generated internal links/assets/fragments, and checks semantic / sharing metadata. Browser checks should cover desktop, tablet, mobile, graph click/keyboard/reset/edge picker, all disclosures, active navigation, project refreshes, and form required/email validation without submitting.
