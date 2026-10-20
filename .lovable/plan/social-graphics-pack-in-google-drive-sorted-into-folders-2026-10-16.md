# Social graphics pack in Google Drive, sorted into folders

## What you get
A Google Drive link to one main folder, "Traction X Social Graphics", holding every finished graphic from the social library (60 posts). Each post comes in LinkedIn, Instagram square and Instagram tall sizes, and each folder has a caption sheet.

## Folders
```text
Traction X Social Graphics/
  01 Show and Venue Graphics      (shows, venues, city posts)
  02 Pricing and Costs            (starting prices, what changes the cost, FAQs about cost)
  03 Rental Booths                (real booth photos by size)
  04 Portable Displays            (banner stands, lightboxes, tabletop, tents)
  05 Custom and Reconfigurable    (custom builds, reconfigurable, double-deck)
  06 Timelines and Planning       (deadlines, how far ahead to book)
  07 Resources and Tools          (guides, worksheets, calculators)
  08 Free 3D Design and Quotes    (3D design offer, instant quote, meetings)
```
Inside each: `LinkedIn/`, `Instagram Square/`, `Instagram Tall/`, plus a captions file with the ready-to-paste text, hashtags and link.

## LinkedIn fix: text above the fold
In your screenshot the headline sits at the very bottom, so LinkedIn's crop cuts it off. All LinkedIn graphics will be redone so:
- Headline and short line sit in the top half of the image, inside a safe zone that survives LinkedIn's feed and Featured crops.
- Nothing important within the bottom 25% of the image; promise badges move up under the headline.
- Darker shading at the top so text reads on any photo.
- Instagram versions get the same safe margins, so nothing gets cut off there either.

## Before I start
- Google Drive needs to be connected. A card will ask you to sign in with the Google account the folder should live in. The folder will be shared as "anyone with the link can view" unless you say otherwise.
- Copy rules still apply on every graphic: no long dashes, "U.S. and Canada" order, I&D included, starting prices 10x10 $12,500 / 10x20 $17,500 / 20x20 $30,000.

## Technical details
- Update the layout in `src/lib/social-visual.ts`: for the LinkedIn size, draw the headline, subline and badges from the top (below the wordmark) with a top scrim, and keep a bottom 25% safe band clear. Applies in the admin preview too (admin stays locked to the public).
- Render all posts locally with a headless browser script into `/tmp`, sorted by a theme-to-folder map, plus a CSV of captions per folder.
- Spot-check rendered images for clipping before upload.
- Link Google Drive via the connector, create the folder tree, upload files, set link sharing, and send you the folder link.
- No public pages, redirects, sitemap or lead forms change.
