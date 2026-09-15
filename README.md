# A Little Too Alive

**Anything is a seed. Anything you grow can become alive.**

An early experimental god-game sandbox for THE HOUSE. Mix a heart, a tooth, an eye, or a brick. Plant the result. Breed and graft traits. Watch creatures form societies and houses discover they have legs.

A DIRTY BOY DEVS game, built with Kyle's answers to a 35-question design interview. See [DESIGN.md](DESIGN.md).

## Play locally

Run `node tools/serve.mjs` and open http://127.0.0.1:8431/.
Vanilla ES modules, a vendored Three.js library, and synthesized audio. No build step or paid API. A static HTTP server is required for ES modules.

## Controls

- Select up to three ingredients, then click/tap soil. **Plant in an open spot** is the keyboard alternative.
- Drag to orbit; wheel or pinch to zoom. Zoom buttons also work.
- Inspect living things to harvest a copy, change their behavior, or compost them.
- Graft blends your current mixture into a specimen. Love, dread, rain, and mutation affect a small area.
- Space pauses. 1 / 2 / 3 select time speed. Escape closes mobile panels. Sound is optional.
- On phones, **seeds** and **notes** open the panels.

## Persistence and sharing

Save key: `a-little-too-alive-save`; audio preferences: `a-little-too-alive-prefs`. Saves are versioned. The optional offline simulation advances up to 30 minutes when returning.

Postcard links carry compressed world snapshots. Opening one does not overwrite your own world. Gifts require the owner to press **Accept and plant this gift**. File exports work without a clipboard. These are shared copies, not live multiplayer sessions.

Record clip exports up to 20 seconds of the rendered world with a title and latest chronicle event. Clips are silent; formats depend on browser support. Touch, clipboard, audio, and recording controls handle unsupported browser capabilities.

## Verification

`node --test tests/sim.test.mjs` covers inheritance, save continuation, living-city formation, invalid imports, consequences, and a bounded deterministic long run.

`tools/browser-test.cjs` runs desktop/mobile interaction checks with Playwright from the local bundled runtime. Test output goes to `test-output/` (ignored by git).

The current version is a broad first sandbox. It does not yet implement live online visits, unrestricted text generation, or a full civilization simulation.

## Planet rebuild (v0.2)

Scroll or pinch from a creature to the planet. At planet scale, tap a continent to descend. Drag to orbit; right-drag or Shift-drag travels over the surface. Inspect a creature to follow it. The upper navigation finds herds, settlements, and a living city when present.

Start with the populated living-world scenario or an empty planet. The Worlds menu archives the current save before switching. Older v1 saves migrate to v2 without losing their organisms or milestones. This is a playable procedural foundation; the approved concept art remains a visual target.

Run both simulation suites with `npm test`. Browser checks: `node tools/planet-browser-test.cjs` (requires the configured local Playwright/Chrome runtime).

## Guided creation and seed roles (v0.3)

The seed bench has Flora, Fauna, and Buildings tabs, with six starting seeds per category (18 additions) and the original eight mutation ingredients. Picking a starting seed anchors its category; the optional mutation drawer preserves experimentation. The cards render previews from the actual game models. Suggested steps track habitat, animals, and a first settlement without locking any tools.

New gameplay includes pollination, fruit-rich forage, timber gathering, armored beetles, guardians, grief recycling, wells, nurseries, granaries, workshops, and observatories. Building effects use real energy, age, awareness, food, or material values. Saved worlds and gift/postcard recipes retain the expanded seeds.

Graphics now include sculpted/pigmented bodies, separate silhouettes for each seed, branching plant models, distinct utility buildings, smoother limbs and leaves, leaf-textured canopies, and a sky gradient. This remains procedural stylized art; the approved concept remains the longer-term fidelity target. Desktop/mobile checks: `node tools/catalog-browser-test.cjs`; simulation: `npm test`.