# Design Your Booth: the headline feature

Goal: make "Design your booth in 3D" one of two equal front doors on the site (next to "Pick a booth"), pushed hard to marketing agencies and creative teams, and turn every design into a captured lead (email and phone).

The 3D designer itself is the third-party tool, loaded in a frame. Everything around it (city pricing, plans, packing list, saving, leads, brand uploads) is ours, so it works whatever the outside tool can or cannot do. The tool's name never appears on the site.

## 1. Site structure and navigation

```text
Header:  Rent a booth | Design your booth (new, highlighted) | Get a quote
/design-your-booth            landing page + full-width designer
/design-your-booth/agencies   agency and creative pitch page
/booth-prices/$city           city price and availability page (from existing city data)
/my-designs                   saved designs (signed in)
/design/view/$token           read-only share link for a client
```

- Homepage hero offers both paths side by side. I will build 3 directions for you to compare: (A) split 50/50, (B) designer-led with "Pick a booth" below, (C) rental-led with a large designer band right under the hero.
- Every rental booth page gets "Customise this booth", opening the designer with that booth as the starting point.
- Portfolio pages get a slot for view-only 3D scenes beside the photos.

## 2. Design Your Booth page

- How it works in three steps: choose size or a pre-designed starter, customise, get your plans and price.
- Pre-designed starters (by size and style) so nobody faces a blank screen.
- Full-width block labelled "3D Booth Designer loads here" until your developer drops in the embed code.
- Brand upload beside it: logo, colours and brand guidelines PDF, kept with the design.
- FAQ: is it free, do I need an account, what happens after I submit, can I start from a template, what plans do I get.
- Always visible: book the 10-min or 30-min call, phone, free 3D design offer.
- Phones: preview image, "Continue on a larger screen", email-me-a-link and book-a-call.

## 3. City price and availability (the promoted hook)

- Pick any city (typeahead) and see which booths are available there and the estimated price, using the existing rental catalogue, market tiers and city pages.
- City pages always win: prices and wording come from the city data, never overridden.
- Inside the designer page, the chosen city shows a running estimated price for the design.

## 4. The lead magnet: plans and packing list

Free to design and explore. To get the outputs, the visitor gives email and phone (plus show name and city):
- Floor plan and booth approval plan (dimensioned PDF for the show organizer)
- Electrical plan (outlets and power drops marked)
- Packing list (every part, graphic and item)
- City price summary

Every unlock creates a lead with the design, city, price and brand files attached, emailed to info@tractionx.ca.

## 5. Accounts, saving and sharing (Lovable Cloud)

- Design first, sign in only to save, share or unlock (email plus magic link).
- Saved designs with name, show, city, size, status (Draft, Submitted, Quoted).
- Brand files and guidelines stored per design.
- Read-only share link so an agency can send a design to its client.
- Leads stored for real (today lead forms only live in the browser), which also fixes an open launch item.

## Things to know

- The plans and packing list depend on what the outside tool hands back (parts list, dimensions). If it gives us its design data, we generate the PDFs automatically. If not, the visitor still unlocks them and our team sends them within an agreed time. Your developer should confirm what the tool exports.
- Our existing Booth Builder stays live as the fallback until the embed is in, then I suggest retiring it or keeping it only for the starters.
- Copy will say "U.S. and Canada" (your brief says "Canada and the US"), no long dashes.

## Order and rough cost

| Stage | What | Credits |
| --- | --- | --- |
| 1 | Nav, landing page, placeholder block, FAQ, mobile, 3 homepage directions | 40 to 70 |
| 2 | City price and availability pages and picker | 40 to 70 |
| 3 | "Customise this booth" on rental pages, portfolio 3D slot, agency page | 25 to 45 |
| 4 | Cloud: accounts, saved designs, brand uploads, share links, real lead storage and email | 70 to 120 |
| 5 | Lead-gated plans: floor/approval plan, electrical plan, packing list PDFs | 60 to 100 |

## Technical notes

- Embed: one `DesignerEmbed` component with a config slot for the developer's iframe code; postMessage listener ready for design data if the tool supports it.
- City pricing reuses rental-booths data, market-tier multipliers and cities data; no new prices invented.
- Cloud tables: designs, design_files (storage bucket), leads, share tokens with a token-scoped public read.
- PDFs built client-side with the existing pdf helpers.
- Private pages stay noindex; new public pages get full SEO metadata.
