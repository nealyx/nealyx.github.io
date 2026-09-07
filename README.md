# Neal Shandilya

Personal website: https://nealyx.github.io/

Plain HTML, CSS, and native JavaScript. No client framework or runtime dependencies.

## Develop

With Node.js 22 or newer:

```sh
npm run dev
```

Open http://127.0.0.1:4173. Saved edits rebuild the preview; refresh to see them.

```sh
npm run build
npm test
```

The build **only packages the existing public files into `dist/`**. It never regenerates or overwrites the root HTML or assets. This preserves Neal's direct edits made after the initial redesign.

## Edit the website

- `index.html`: homepage content, milestones, and links.
- `work/*/index.html`: individual project pages, including competitive programming.
- `phystutor.html`: tutoring details, topics, rates, and the existing Formspree inquiry form.
- `assets/site.css`: shared styles and homepage space-theme styles.
- `assets/home.css`: the homepage's continuous dark palette, section layouts, and mobile spacing.
- `assets/research.css`: the Ramsey Lines project page and its document links.
- `assets/site.js`: navigation and progressively enhanced interactions.
- `assets/hero-canvas.js`: canvas rendering, pointer/keyboard controls, scroll morphing, and animation lifecycle.
- `assets/hero-field.js`: seeded K4/star/galaxy geometry and projection math.

The `src/` directory retains data and assets from the earlier generated design for reference. It is no longer used by the build. Edit the published files above, not those historical snapshots.

To add a page or note, create its HTML file (for example `notes/your-note/index.html`), add its link to the homepage, and add its canonical URL to `sitemap.xml`. The build copies the `notes/` directory when present. Keep descriptions, canonical URLs, and sharing metadata accurate. Do not invent achievements or publication links.

The homepage shows six populated sections: Work, Problems, Milestones, Teaching, About, and Contact. Writing & Notes is omitted until there is published writing to link to. Navigation across all pages points to Teaching in its place. Section content remains visible without JavaScript.

The Ramsey Lines page documents Neal's authorship of Chapters 8 and 10 and contributions to the Frankl–Wilson slides, as confirmed by Neal. The two source PDFs are preserved in `work/ramsey-theory/`; the bylines, dates, and scope come from those documents. The chapters present established mathematics and should not be described as new Ramsey bounds or a peer-reviewed publication. Replace the PDFs and version details together when updating the work.

## Animated background

The homepage starts with a slowly rotating tetrahedral K4 graph. Stars spread toward the margins as the hero leaves the viewport, then gather into a spiral galaxy near the end of the page. Colors and particle positions are seeded, so resizes don't reshuffle them. Projection rejects points at the camera plane, and rendered star radii are bounded.

Drag the hero horizontally to rotate it; vertical touch gestures still scroll. Keyboard users can focus the hero and use arrow keys to rotate, or Home to reset the view. The lower-right control pauses/resumes motion. Reduced-motion preferences start with a static scene, and hidden tabs stop requesting animation frames. Explicit scroll or rotation still updates a paused scene.

Canvas resolution is capped at 2× and mobile uses fewer stars. The brightest points use cached glow sprites. Adjust particle count, rotation speed, and lighting in `hero-canvas.js`; shape geometry and scroll stages live in `hero-field.js`.

## Deployment

GitHub Pages publishes from **main / (root)**. Commit the edited HTML, assets, and supporting source files and push to `main`. `.nojekyll` keeps the current static publishing method. `dist/` is ignored by Git and used for the optional private Sites publication configured in `.openai/hosting.json`.

Paths are rooted at `/` because this is an account site. Project pages use real directories, so direct navigation and refresh work. Preserve the existing legacy redirects, evidence images, and Formspree destination. Do not submit real inquiries during testing.

## Verification

Tests cover internal links/assets/fragments, semantic metadata, stable particle generation, continuous scroll stages, and projection safety. The earlier graph-theory checks remain available. Browser checks should cover desktop/mobile composition, scrolling, pause/resume, keyboard rotation, project navigation, and readable content behind the star field.
