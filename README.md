# Neal Shandilya

Static portfolio source for the `nealyx.github.io` account site.

Plain HTML, CSS, and native JavaScript. No client framework or runtime dependencies.

**Hosting status, checked October 20, 2026:** `https://nealyx.github.io/`
returns HTTP 404. The last recorded successful GitHub Pages deployment is
September 18, 2026; that historical status does not establish current availability.
The separate `nealyx.dev` site has its own hosting and access controls. This
repository update does not change that site. See [Deployment](#deployment).

## Public research

The homepage links to [the research index](research.html), which distinguishes
saved-output studies, runnable demos, and proposed work:

| Project | What a reader can inspect | Scope |
|---|---|---|
| [Math Reward Hacking](https://github.com/nealyx/math-reward-hacking) | Saved completions, scoring rules, analyses, offline verification | Measurement diagnostic; no consistent reward-hacking conclusion |
| [EGRA / FACED](https://github.com/nealyx/egra-faced) | Representation probes, controls, saved predictions and numeric verification | Exploratory audit of released representations |
| [ReviewOps](https://github.com/nealyx/reviewops) | Local review queue, evidence checks, decisions and history | Prototype with synthetic demonstration data |
| [Multimodal Response Lab](https://github.com/nealyx/multimodal-response-lab) | Offline synthetic signal-to-report walkthrough | Heuristic proxies, not validated cognitive measurements |
| [Formalization Evaluation Robustness](https://github.com/nealyx/formalization-eval-robustness) | Research question, controls and proposed artifact structure | Documentation scaffold; no public implementation or results |

Descriptions are based on these public repositories. Follow their current
documentation for reproduction requirements and limitations. Do not turn a
synthetic demo into a human-results claim, a saved-output check into an independent
model rerun, or a research design into a completed experiment.

## Develop

With Node.js 22 or newer, from a clean clone:

```sh
git clone https://github.com/nealyx/nealyx.github.io.git
cd nealyx.github.io
npm run dev
```

Open http://127.0.0.1:4173 or http://127.0.0.1:4173/research.html.
Saved edits rebuild the preview; refresh to see them. No package install,
credentials, camera access, or external service is needed for local development.

```sh
npm test
npm run build
```

`npm test` builds the preview first, then runs the offline checks. `npm run build`
alone prepares the static `dist/` directory.

The build **only packages the existing public files into `dist/`**. It never regenerates or overwrites the root HTML or assets. This preserves Neal's direct edits made after the initial redesign.

## Edit the website

- `index.html`: homepage content, milestones, and links.
- `research.html`: the public project index, including evidence and release status.
- `work/*/index.html`: individual project pages, including competitive programming.
- `phystutor.html`: tutoring details, topics, rates, and the existing Formspree inquiry form.
- `assets/site.css`: shared styles and homepage space-theme styles.
- `assets/home.css`: the homepage's continuous dark palette, section layouts, and mobile spacing.
- `assets/research.css`: the Ramsey Lines project page and its document links.
- `assets/research-index.css`: the public project index; separate from the Ramsey styles.
- `assets/space.css`: the shared star-field theme on all detail pages, including forms and code blocks.
- `assets/reading.css`: reactive book icons and the About reading desk; edit the book text in `index.html`.
- `assets/morph-graph.js`: the six-point diagram's animated layouts. Edges and the highlighted triangle stay fixed as the vertices move.
- `assets/site.js`: navigation and progressively enhanced interactions.
- `assets/hero-canvas.js`: canvas rendering, pointer/keyboard controls, scroll morphing, and animation lifecycle.
- `assets/hero-field.js`: seeded K4/star/galaxy geometry and projection math.

The `src/` directory retains data and assets from the earlier generated design for reference. It is no longer used by the build. Edit the published files above, not those historical snapshots.

To add a page or note, create its HTML file (for example `notes/your-note/index.html`), add its link to the homepage, and add its canonical URL to `sitemap.xml`. The build copies the `notes/` directory when present. Keep descriptions, canonical URLs, and sharing metadata accurate. Do not invent achievements or publication links.

The homepage shows six populated sections: Work, Problems, Honors, Skills, About, and Contact. The Work section links to the public research index. Writing & Notes is omitted until there is published writing to link to. Navigation across all pages points to Skills; the older #teaching fragment still works as an alias. Tutoring remains accessible from the physics question and its existing page. Section content remains visible without JavaScript.

The Ramsey Lines page documents Neal's authorship of Chapters 8 and 10 and contributions to the Frankl–Wilson slides, as confirmed by Neal. The two source PDFs are preserved in `work/ramsey-theory/`; the bylines, dates, and scope come from those documents. The chapters present established mathematics and should not be described as new Ramsey bounds or a peer-reviewed publication. Replace the PDFs and version details together when updating the work.

## Animated background

The homepage starts with a slowly rotating tetrahedral K4 graph, a short introduction, and an Explore my work link. Stars spread toward the margins as the hero leaves the viewport, then gather into a spiral galaxy near the end of the page. Colors and particle positions are seeded, so resizes don't reshuffle them. Projection rejects points at the camera plane, and rendered star radii are bounded.

Drag the hero horizontally to rotate it; vertical touch gestures still scroll. Keyboard users can focus the hero and use arrow keys to rotate, or Home to reset the view. The lower-right control pauses/resumes motion. Ambient motion starts playing on every platform, including when Windows reports reduced motion. Reduced motion still skips the entrance effect and disables decorative CSS transitions; the site control explicitly pauses/resumes ambient motion. Hidden tabs stop requesting animation frames. Explicit scroll or rotation still updates a paused scene.

Canvas resolution is capped at 2× and mobile uses fewer stars. The brightest points use cached glow sprites. Adjust particle count, rotation speed, and lighting in `hero-canvas.js`; shape geometry and scroll stages live in `hero-field.js`.

Detail pages reuse the same renderer in a quiet reading mode without the opening K4 shape. The animation control also pauses the morphing six-point diagram. That diagram runs only while visible; while paused, its Change shape button chooses a static layout. Book icons open on hover/focus and reveal descriptions on click/tap, using native disclosure controls.

## Deployment

The repository is structured for GitHub Pages branch publishing from
**main / (root)**, with `.nojekyll` for the existing static layout. However,
current Pages settings could not be confirmed: the Pages configuration API
returned 404, and the public URL also returned 404 on October 20, 2026.
Pushing source is therefore not proof of a successful live deployment. Check
the repository's Pages settings and deployment result before announcing it as live.

`dist/` is ignored by Git and remains available for the existing optional Sites
publishing configuration. Do not change DNS, custom domains, or the independent
`nealyx.dev` deployment as part of a source-only update.

Paths are rooted at `/` because this is an account site. Project pages use real directories, so direct navigation and refresh work. The former `research.html` redirect is now a standalone index; other legacy redirects, evidence images, and the Formspree destination are preserved. Do not submit real inquiries during testing.

## Verification

Tests cover internal links/assets/fragments, semantic metadata, stable particle generation, continuous scroll stages, and projection safety. The earlier graph-theory checks remain available. Browser checks should cover desktop/mobile composition, scrolling, pause/resume, keyboard rotation, project navigation, and readable content behind the star field.

For an optional network check of external links in the current packaged HTML:

```sh
npm run check:links
```

The checker reads `dist/`, not the retired `src/` content. It uses HEAD requests,
deduplicates destinations, and excludes form submissions. HTTP 404/410 exits
nonzero as missing; access denials, unsupported methods, rate limits and timeouts
are reported as **unverified**, not as proof of a broken link. Review those
destinations manually. This command is separate from the offline test suite.

October 20, 2026 validation on Node 22.23.2: all 12 tests passed. The external
check found 29 unique destinations, no missing links, and four unverified
destinations (Codeforces problemset and LeetCode returned 403; CampusX and LinkedIn
returned 405). The old probability-book PDF returned 404 on both HEAD and GET;
its link now points to the publisher's page, which returned 200. Chrome previews
covered the research index at desktop, 400px and 320px widths, project anchors,
pause/resume, and the homepage entry into the index. These local checks do not
confirm a public deployment.
