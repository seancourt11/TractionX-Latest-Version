# Social Graphics Redo: Match the Current Site Look

## Goal
Rebuild all 68 social posts (211 images) so they look like the live site: black backgrounds, light purple accents, Montserrat headings, the real Traction X logo, and the same booth and city photos used on the homepage and city pages. Then replace the files in the existing Google Drive folders.

## What changes in the graphics
1. **Real logo** instead of typed "TRACTION X" text, top left on every image.
2. **Stronger light purple branding**
   - Purple headline highlight on the key words (price, size, city name).
   - Purple pill badges for promises (I&D included, fixed scope, pre-built and photographed).
   - Thin purple frame line and a purple footer bar with the site address and "Free 3D design" call to action.
3. **Site-style layouts** (picked per post type)
   - Hero style: full photo, dark fade, big headline, like the homepage top section.
   - City style: city/venue photo with the city name large in purple, like the city pages.
   - Price card: booth photo with a black panel showing "10x10 from $12,500" style pricing.
   - FAQ/timeline card: black card with purple numbers or question mark, small photo strip.
   - Split: two photos side by side (rent vs buy, modular vs custom).
4. **Better photos**: favour the homepage hero and portfolio booth photos and the city page photos, instead of plain catalogue shots. Show and venue posts use the exact photo from their page.
5. **LinkedIn text stays in the top 75%** (keeps the earlier fix). Instagram square and vertical versions get the same branding.

## Richer content on and with each post
- **Keywords:** headlines and captions use search terms from the site (trade show booth rental, reconfigurable trade show booths, custom exhibits, portable displays, plus "city + booth rental" and venue names). Hashtags get matching keyword and city tags.
- **CTAs:** every image gets a clear call to action in the footer bar ("Get your free 3D design", "Book a 10-min call", "See pricing"). Every caption ends with the matching site link.
- **Advice:** add tip posts and short tip lines, for example drayage, booking timelines, rent vs buy, and how to cut freight costs.
- **Resources:** posts promoting the pricing guides, Booth Plan questionnaire, cost calculator, Booth Builder and resource center, each linking to its page.
- **City and venue info:** new city and venue posts using facts already on those pages (venue name, hall facts, key shows, "available for" wording). Taken word for word from the city pages, never changed.
- Around 20 to 30 new posts on top of the current 68. They're sorted into the same Drive folders, with Show and Venue Graphics getting the most new posts.

## Copy rules kept
No long dashes, "U.S. and Canada" order, starting prices as on the site, I&D included and drayage separate, city pages never contradicted, no client industry mentions on hiring posts.

## Delivery
- Re-render all sizes and swap them into the same 10 Drive folders (same link), old versions removed.
- Send a few sample images in chat first for your OK before replacing everything.

## Not changing
Any website page, captions, the admin lock, lead forms, redirects or sitemap.

## Technical details
- Update `src/lib/social-visual.ts`: load `src/assets/logo.png`, add layout variants (hero, city, price, card, split), purple highlight and footer bar, colours mirrored from `src/styles.css` tokens.
- Update image picking in `src/lib/social.ts` to prefer homepage hero, portfolio and `src/data/hero-images.ts` city/venue images.
- Add a `layout` per post in the social posts data.
- Render through the dev server with Playwright, upload via the Google Drive connection, replacing files in place.
