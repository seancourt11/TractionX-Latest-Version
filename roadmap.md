# Roadmap: Design Your Booth

## Round 3 part B (preview only, no publish)
- [x] Continuation: clear outstanding type errors, audit partial work, rerun regression tests and capture actual hero and upper-plan screenshots with popup dismissed
- [x] 1. Stair as own item: hide baked stair in deck GLBs (or flag to Sean), procedural "Deck stair" item (position/rotate/mirror, snaps to deck edge, fits check includes handrails)
- [ ] 2. Full-footprint/custom decks: parametric custom deck (grid snap, instanced columns/beams/fascia/rails), module snapping with shared rails removed, "Fill booth" button, flush continuous deck
- [x] 3. Numeric position + snap controls for decks and all items (ft-in and mm from front-left, snap-to-edge buttons, numeric w/d for custom decks)
- [ ] 4. Upper-level content: level field + deckId, Ground/Upper toggle drives placement, upper items at 2750 mm inside deck frame, glass wall item (door, frosted band), upper walls default 8 ft, include in 3D/render-reference/concept pack/summary
- [x] 5. LED video wall item (ft sizes to 30x12, 500 mm cabinets, floor or wall mount, emissive, optional image, summary lists size + cabinet count)
- [x] 6. Text graphics on walls/fascia/counters/hanging signs (font, size, colour, alignment, placement; brand headline defaults; in photoreal prompt)
- [x] 7. Deck fascia branding (colour, graphic, logo placement per face, text; brand-my-booth dresses fascia, never deck floor)
- [x] 8. Real GLB models: frames (QSEG40, SEGO, wematrixquan -> public/models/frames/), 12 Big Sky counters -> public/models/ws/, normalise units/origins at load, Suspense + box fallback; upgrade furniture primitives to light CC0 where possible (<500 KB)
- [x] 9. Meeting & Boardroom furniture group (8 items, White/Black, upper-level capable, Boardroom set quick-add grouping, counts/finishes in summary + photoreal inventory)
- [x] 10. Exphora features: placeholder only, do nothing
- [x] Fix A: hide Ground/Upper toggle until a deck exists; highlight active level; Upper shows only deck-level items (dim ground)
- [x] Fix B: 2D left "30 ft" dimension overlaps vertical AISLE text; offset
- [x] Fix C: auto-place new items in nearest free spot (findFreeSpot exists; verify it is used everywhere, incl. decks and counters)
- [ ] Fix D: orbit lag 1-2 s with two decks + light flashes; keep low quality during drag, avoid shadow/AO pops on restore
- [x] Fix E: 2D/3D toggle buttons sometimes miss clicks; make reliable
- [x] Verify: typecheck, booth-builder tests, screenshots of 20x30 island with full-footprint deck, enclosed stair, two glass boardrooms upstairs with boardroom sets

## Round 3 part A (done, preview only)
- [x] All nine items + 24 tests; software-browser timings only; real-device latency pending Sean's retest or simplified GLBs

## Previously deferred work (not authorized)
- [ ] Stage 1b-5 of design-your-booth plan; Stage 5 (cloud saves/share links, path-traced Best) not authorized
- Blocker: designer embed URL from the developer

## Verification and remaining limitations
- 39 booth-builder tests pass; automatic typecheck/build OK; browser runtime errors none.
- Hero and upper-plan captured with exact 6096 x 9144 mm custom deck, enclosed stair and two round-table boardroom sets.
- Joined imported modules switch to lightweight frame-sized procedural geometry to eliminate internal posts and rails; isolated modules retain GLBs. Preserving exact imported joists at joins remains a limitation.
- Upper placement and drag avoid stair openings; numeric edits/whole-group rotation are validated with warnings but are not hard constrained in every path.
- Fast two-deck click-to-next-frame 310-518ms in software Chromium. Sustained physical-device orbit and High latency require Sean's device retest.
