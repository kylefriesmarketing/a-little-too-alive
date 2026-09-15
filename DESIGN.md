# A Little Too Alive

Working title. Kyle selected a combination of concept 1 (anything becomes alive) and concept 4 (everything is a seed) after a 35-question interview on 2026-09-15.

## Agreed direction

- Standalone browser game in THE HOUSE. Phone and desktop. Audience: strangers. Desired reaction: “what the hell?”
- Building and growth. Creative freedom, surprises, and visible transformations take priority.
- God view plus experiments. Mix ingredients, directly change traits, and let life evolve. Simple controls with depth.
- Whole-world ambition: organisms, buildings, societies, ecosystems. Stylized, organic, surreal 3D.
- The player's creations determine the mood. Adult horror and mature themes are acceptable; not a requirement to add explicit content.
- Start with an empty world and a few ingredients. Unlimited power, ecological consequences. Catastrophes persist; rebuilding is part of play.
- Control per creation: free will, gentle, or rooted. Awareness develops: obliviousness, curiosity, fear, and eventual recognition of the creator.
- Sessions about 20–40 minutes. Replay motivations are mixed. Success means world milestones.
- Players can choose whether time passes while away.
- Visible events, creature chatter, and a readable chronicle. Evolving synthesized ambience and organic sounds; muted play remains understandable.
- Visitors explore copies. Originals remain with owners. Changes need owner consent. Gifts can carry inherited traits, memories, and ideas.
- Shareable short clips are the main viral output. No claim that virality is guaranteed.
- Guided or unguided opening.
- Broad rough sandbox first, then deepen the strongest systems. Zero paid services or asset purchases.

## First playable scope

Eight ingredients, combinations up to three ingredients; germination; hereditary crossbreeding; phenotype-driven procedural models; hunger, predation, emotion, water, fire, and fear thorns; settlements; walking homes; living-city fusion; limited culture rules; creature lines; milestones and chronicle; individual controls; harvest and graft; local persistence; bounded offline simulation; read-only world postcards, consent-based seed gifts; browser clip recording.

This is a finite local simulation, not unrestricted text-to-world AI. Cross-player interactions use snapshots and copied gifts, not concurrent server simulation. Culture is a small causal ruleset rather than a comprehensive society model. Postcard cultures and memories persist in copies; seed gifts inherit genes and a memory, not entire political systems. Emergent physics and arbitrary object generation are future work.

## THE HOUSE contract

- Save: `a-little-too-alive-save`, version 2 (migrates version 1); `started`, `milestones`, `discoveries`, `stats` are cheap to read.
- Collectible: a heartseed in a glass bell, earned by `milestones.city`.
- Doorway: a little terrarium; hint: `everything is a seed. even the house.`
- Return link: https://kylefriesmarketing.github.io/games/
- Credit: a DIRTY BOY DEVS game.

## What to deepen after Kyle plays

1. Broaden ingredient-to-anatomy combinations and meaningful ecosystem feedback.
2. Improve cities as organisms and more surprising inherited behaviors.
3. Persist deeper creature relationships and culture.
4. Add live visits only when a free, sustainable hosting design is chosen.
5. Develop the most interesting player-generated moments, not resource grind.

## Rebuild approved 2026-09-15

Kyle rejected the original small disc island, primitive appearance, shallow behavior, and limited scale. He named Spore as the closest reference and requested a seamless camera from a whole planet to individual creatures. All four scenes matter: family herds and predation, working settlements, visibly inherited anatomy, and occupied living cities.

He approved the generated art-direction study as "Much closer — use this as the visual target". Reference: assets/reference/art-direction.png. This is aspirational concept art, not a gameplay screenshot or a claim of achievable browser fidelity.

The second playable foundation uses one spherical coordinate system for terrain, creatures, pointer picking, and camera navigation; a real globe; 4/6-legged articulated phenotypes; parenting, herd cohesion, hunting and fleeing; food collection and material-funded construction; procedural forest, terrain, and architecture; a clearly labeled populated scenario; empty-world creation; archived world switching; and v1-to-v2 save migration.

Remaining gaps: detailed authored art, richer body editing, deeper society and belief systems, large-scale ecosystem simulation, richer living-city behavior, and real-time visits. The world is geographically broad but the simulation remains capped at 180 active entities. Existing snapshot visits and seed gifts are retained.

## Guided creation and seed roles (v0.3)

The seed bench has Flora, Fauna, and Buildings tabs, with six starting seeds per category (18 additions) and the original eight mutation ingredients. Picking a starting seed anchors its category; the optional mutation drawer preserves experimentation. The cards render previews from the actual game models. Suggested steps track habitat, animals, and a first settlement without locking any tools.

New gameplay includes pollination, fruit-rich forage, timber gathering, armored beetles, guardians, grief recycling, wells, nurseries, granaries, workshops, and observatories. Building effects use real energy, age, awareness, food, or material values. Saved worlds and gift/postcard recipes retain the expanded seeds.

Graphics now include sculpted/pigmented bodies, separate silhouettes for each seed, branching plant models, distinct utility buildings, smoother limbs and leaves, leaf-textured canopies, and a sky gradient. This remains procedural stylized art; the approved concept remains the longer-term fidelity target. Desktop/mobile checks: `node tools/catalog-browser-test.cjs`; simulation: `npm test`.