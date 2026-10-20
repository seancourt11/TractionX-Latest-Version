# Booth Builder: photoreal output and bug fixes (plan only)

Root causes below are suspected, not yet confirmed. Step 1 of every fix is to reproduce it with the same 10x30 inline build.

## 1. Photoreal options

### Option A: upgrade the live 3D scene
- What changes: real material textures (carpet pile, SEG fabric weave, laminate, brushed aluminum), a bundled studio/convention lighting map (no outside download), soft shadows, ambient occlusion, color grading, better furniture and TV models (free CC0 models), and a "Best" mode that path-traces the still image (three-gpu-pathtracer, free).
- Quality to expect: clearly better, close to a good product configurator. It will still look like 3D software, not a photo. Path-traced stills get closest (about 70 to 80% of a real architectural render).
- Service / key: none. Runs in the visitor's browser. No paid account.
- Cost per render: $0.
- Time: live view stays real-time on Fast/High. A path-traced still takes about 20 seconds to 2 minutes on a normal laptop, longer on older machines.
- Effort: large (about 3 to 5 working sessions).

### Option B: "Photoreal render" button (AI image-to-image)
- How it works: we capture the current 3D view (plus a plain depth/outline pass), send it with a written description of the layout, sizes, colours and logo to an AI image model, and show the result next to the 3D view. The visitor's real logo is pasted back on top where needed so it is never redrawn wrong.
- Quality to expect: looks like a photo of a real booth in a convention hall, the style the owner wants. Layout and proportions are usually preserved well; fine details (small text, exact counts of stools, exact logo) can drift, which is why we keep the 3D view and logo overlay as the source of truth and label it "Concept render".
- Service: Lovable AI (built-in image editing model). No separate API key or outside account; usage comes from the workspace's Lovable credits. Alternative if we want stricter layout control later: a ControlNet model on Replicate or fal.ai, which needs their key and a paid account.
- Cost per render: roughly $0.05 to $0.20 in credits (to be confirmed on the first test). Limit it to a few renders per visitor, or gate it behind email/phone so it also captures leads.
- Time: about 15 to 60 seconds, with a blurred preview while it works.
- Effort: medium (about 1 to 2 sessions).

### Recommendation
Do B first: it delivers the "wow" image fastest and doubles as a lead gate. Do a light version of A (textures, lighting, shadows, better models) alongside, because B's output is only as good as the view we send it. Full path tracing last, optional.

## 2. Bug fixes

| # | Bug | Suspected cause / fix | Effort |
|---|-----|------|--------|
| 1 | Page jumps to footer with a popup after "Start building" | Scroll position and a site popup firing on the builder page. Scroll to the editor on start; suppress the sitewide popup on /booth-builder. | Small |
| 2 | Best + Presentation freezes; reload lost the build | Too-heavy settings in combination crash the 3D view. Cap quality on Best (shadow size, pixel ratio), recover the view if it crashes, and autosave every change so a reload restores the design. | Medium |
| 3 | General lag, clicks take 5+ seconds | The whole 3D scene redraws on every change and textures are rebuilt. Cache textures and branding images, only redraw what changed, lower default quality on slower devices. | Medium to large |
| 4 | Download image / Concept pack make no file on a 30x10 | Capture likely fails on wide booths (too large an image, or a branding image blocking the export) and errors silently. Size limits, safe image loading, and a clear error message instead of silence. | Medium |
| 5 | Toolbar shifts after Save so clicks hit Undo | Save button label changes width. Fixed-width button and stable toolbar layout. | Small |
| 6 | Save is browser-only | Needs Lovable Cloud for saved designs tied to email (and share links). Short term: autosave plus "Download design file / Load file". | Small now, medium with Cloud |
| 7 | New side walls all stack on the left | Placement always uses the same spot. Alternate left/right and pick the next free spot along the booth edge. | Small |
| 8 | Right side wall gets colour but no logo | Logo placement only runs on some wall positions/orientations. Apply branding to every wall face that faces the aisle. | Small |
| 9 | "Hanging over booth line" stays after "Pull everything inside" (back wall 30.3 ft on 30 ft) | Wall panel widths plus frame thickness add up over the footprint, and the pull-in does not shrink. Fit walls to the exact booth width and make the warning use the same measure. | Small to medium |
| 10 | Ask AI says two tables and stools, adds one each, ignores placement | Duplicate commands are removed, and there is no quantity or position in the command list. Add count and position (left, right, front, back, centre) to the commands, and make the reply describe only what was actually added. | Medium |

## Recommended order

1. Quick wins that block testing: 1 (jump/popup), 5 (toolbar), autosave from 2.
2. Stability: 2 (freeze), 3 (lag), 4 (image and PDF export).
3. Correctness: 9 (booth line), 7 (side walls), 8 (logo), 10 (Ask AI).
4. Photoreal: Option B button, then light Option A upgrade.
5. Later: Cloud-backed saves and share links (6), full path-traced Best mode.

Total: roughly 6 to 10 working sessions for steps 1 to 4.

## Technical notes
- Option B: server route calling the Lovable AI image edit endpoint with the canvas capture as the input image; stream partial previews; logo composited client-side after.
- Autosave: debounced write of the project JSON to browser storage on every change, restored on load.
- Exports: render to a capped size (max ~4096 px wide), load branding images through the existing image proxy so the canvas is not blocked, wrap capture in try/catch with a toast.
- Ask AI: extend commands with `count` and `position`; stop deduping intentional repeats.
