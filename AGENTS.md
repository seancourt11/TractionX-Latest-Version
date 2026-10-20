# AGENTS.md — project rules

- TanStack Router ≥1.170 types `errorComponent` props as `{ error: unknown; reset: () => void }` — never type the root ErrorComponent's error as `Error`, or the build fails; wrap/normalize inside the component instead.
- Booth photoreal references use a complete inventory and depth-tested logo capture from the same camera, composited after AI editing; exact placement remains dependent on model framing and must not be represented as guaranteed.
- Booth standards remain centralized in rules.ts; automatic fixes must revalidate, and kept exceptions live in project JSON and design summaries so reloads and handoffs retain them.
- Booth editing starts lightweight and renders on demand, with heavy effects lazy-loaded after idle; export actions use single-flight guards and capture nonces to avoid duplicate files.
- Static deck geometry is merged per material and cached by visualKey, with Box3-centred transforms and shared materials; this avoids per-instance scene cloning and aligns stairs with footprint checks.
- Builder commits retain structural sharing for unchanged JSON branches so object-reference memoization can skip unaffected 3D meshes.
- Camera presets fit footprint and tallest-object bounds at the actual aspect; photoreal captures default to the hero angle to avoid accidental top-down references.

- Deck openings, shared-edge rails, upper containment and free placement share levels.ts geometry helpers so scene, rules and editor use the same bounds.
- Uploaded product GLBs keep explicit source units and precise decoded bounds; this prevents accessor bounds and offset origins from inflating inventory footprints.
- Fast and High use stable one-DPR lightweight lighting without dynamic shadow/AO switches; heavier presentation effects remain opt-in to avoid orbit flashes.
- Joined deck modules use frame-sized procedural assemblies while isolated modules retain merged GLBs, because internal imported posts cannot safely be hidden by rail-name filtering alone.
