/**
 * Extra social posts: venue, show, exhibitor tip and resource posts.
 *
 * Venue and show facts are read straight from the same records the public
 * venue and show pages render, so a post can never contradict those pages.
 * Location wording says what Traction X is available for, never shipment
 * history.
 */
import type { SocialPost } from "./social-posts";
import { VENUES, venueUrlSlug } from "./venues";
import { SHOWS, showUrlSlug } from "./shows";
import { VENUE_HERO_IMAGES, SHOW_HERO_IMAGES } from "./hero-images";

/** Strip any long dash that may sit in source data. */
const clean = (s: string) => s.replace(/\s*[\u2013\u2014]\s*/g, ", ");
const tagify = (s: string) => `#${s.replace(/[^A-Za-z0-9]/g, "")}`;

const VENUE_TAGS = ["#tradeshowboothrental", "#tradeshowbooth", "#exhibitrental", "#eventprofs"];
const TIP_TAGS = ["#tradeshowtips", "#exhibitortips", "#tradeshowbooth", "#eventplanning", "#eventprofs"];
const RESOURCE_TAGS = ["#tradeshowtips", "#tradeshowbudget", "#boothdesign", "#exhibitormarketing", "#b2bmarketing"];

const venuePosts: SocialPost[] = Object.keys(VENUE_HERO_IMAGES)
  .map((slug) => VENUES.find((v) => v.slug === slug))
  .filter((v): v is NonNullable<typeof v> => Boolean(v))
  .map((v, i) => {
    const shows = v.majorShows.slice(0, 3).map(clean);
    const region = v.country === "US" ? v.stateAbbr : v.state;
    return {
      id: `venue-${v.slug}`,
      week: 1 + (i % 12),
      theme: "venues" as const,
      title: `Trade show booth rentals at ${v.shortName}`,
      linkedin: `Exhibiting at ${clean(v.name)} in ${v.city}, ${region}?\n\n${v.shortName} covers ${clean(v.size)} across ${clean(v.halls)}, and hosts shows like ${shows.join(", ")}.\n\nTraction X custom trade show booth rentals are available for ${v.shortName}: design, fabrication, freight planning and install and dismantle in one quote. Drayage, electrical and rigging are ordered through the venue's contractors, and we tell you what to budget for them before you sign.\n\nVenue guide with docks, labour rules and hall tips:`,
      instagram: `${v.city} · ${v.shortName}\n\n${clean(v.size)} · ${clean(v.halls)}\nShows: ${shows.join(", ")}\n\nCustom booth rentals available for ${v.shortName}. I&D included.\n\nFree 3D design at the link in bio.`,
      hashtags: [...VENUE_TAGS, tagify(v.city), tagify(`${v.city}events`)],
      href: `/venues/${venueUrlSlug(v.slug)}`,
      venueSlug: v.slug,
      city: v.city,
      venue: v.shortName,
      layout: "city" as const,
      kicker: `Venue guide · ${v.shortName}`,
      big: v.city,
      facts: [clean(v.size), clean(v.halls), `Shows: ${shows.slice(0, 2).join(", ")}`],
      cta: "design" as const,
    } satisfies SocialPost;
  });

const showPosts: SocialPost[] = Object.keys(SHOW_HERO_IMAGES)
  .map((slug) => SHOWS.find((s) => s.slug === slug))
  .filter((s): s is NonNullable<typeof s> => Boolean(s))
  .map((s, i) => {
    const href =
      s.slug === "web-summit-vancouver"
        ? "/web-summit-vancouver-booth-rentals"
        : `/shows/${showUrlSlug(s.slug)}`;
    const lead =
      s.slug === "web-summit-vancouver"
        ? "Traction X is a preferred vendor for Web Summit Vancouver."
        : s.slug === "defsec-atlantic"
          ? "Traction X is the official supplier of DEFSEC Atlantic and DEFSEC West."
          : `Custom booth rentals are available for ${s.name}.`;
    return {
      id: `show-${s.slug}`,
      week: 2 + (i % 11),
      theme: "venues" as const,
      title: `${s.name} booth rentals`,
      linkedin: `${s.name} · ${s.city}, ${s.state}\n${clean(s.cadence)} · ${clean(s.attendance)} attendees · ${clean(s.audience)}\n\n${lead}\n\nBooking window: ${clean(s.bookingWindow)}. Start early and your graphics, freight and labour all get cheaper.\n\nFree 3D design, or book a 10-minute call. Show guide:`,
      instagram: `${s.shortName} · ${s.city}\n${clean(s.cadence)} · ${clean(s.attendance)} attendees\n\n${lead}\n\nI&D included. Free 3D design at the link in bio.`,
      hashtags: [...VENUE_TAGS, tagify(s.shortName), tagify(s.city)],
      href,
      showSlug: s.slug,
      city: s.city,
      venue: s.name,
      layout: "city" as const,
      kicker: `Show guide · ${clean(s.cadence)}`,
      big: s.shortName.length <= 14 ? s.shortName : s.city,
      overlayText: lead,
      facts: [`${s.city}, ${s.state}`, `${clean(s.attendance)} attendees`, clean(s.audience)],
      cta: "meeting" as const,
    } satisfies SocialPost;
  });

const tipPosts: SocialPost[] = [
  {
    id: "tip-drayage-budget",
    week: 3,
    theme: "tips",
    title: "Budget drayage before you sign",
    linkedin:
      "Exhibitor tip: budget drayage before you sign anything.\n\nDrayage is the venue contractor moving your freight from the dock to your booth, billed by weight. It is never in a booth supplier's price, and it surprises more first-time exhibitors than anything else.\n\nTwo ways to cut it: ship lighter (fabric graphics, modular frames), and consolidate crates.\n\nWe estimate drayage for your show before you commit. Pricing guide:",
    instagram:
      "Exhibitor tip 💡\n\nDrayage = venue contractor moving your freight dock to booth, billed by weight.\n\nCut it: lighter fabric graphics, modular frames, fewer crates.\n\nWe estimate it before you sign. Link in bio.",
    hashtags: TIP_TAGS,
    href: "/trade-show-booth-rental-pricing",
    gallerySlug: "img-09",
    layout: "card",
    kicker: "Exhibitor tip",
    big: "Drayage",
    overlayText: "Budget drayage before you sign. Ship lighter, consolidate crates.",
    cta: "quote",
  },
  {
    id: "tip-book-early",
    week: 4,
    theme: "tips",
    title: "Book 12 to 16 weeks out",
    linkedin:
      "Exhibitor tip: the cheapest booth is the one you book early.\n\n12 to 16 weeks out gives time for a free 3D design, revisions, a pre-build and photos before anything ships. Advance orders for electrical and labour are also cheaper than on-site orders.\n\nRush is possible, but you pay for it in options, not just dollars.\n\nPlan your timeline:",
    instagram:
      "Exhibitor tip 💡\n\nBook 12 to 16 weeks out.\nFree 3D design → revisions → pre-build → photos → ship.\n\nAdvance orders are cheaper than on-site orders.\n\nPlan yours at the link in bio.",
    hashtags: TIP_TAGS,
    href: "/build-your-booth-plan",
    gallerySlug: "img-17",
    layout: "card",
    kicker: "Exhibitor tip",
    big: "12 to 16 wks",
    overlayText: "Book early. Design, pre-build and photos before anything ships.",
    cta: "design",
  },
  {
    id: "tip-reconfigure",
    week: 6,
    theme: "tips",
    title: "One booth, many footprints",
    linkedin:
      "Exhibitor tip: if your booth size changes show to show, stop buying a new booth.\n\nA reconfigurable trade show booth changes size, shape and components. The same kit runs as a 10×20 inline at one show and a 20×20 island at the next, with new graphics where you need them.\n\nHow reconfigurable booths work:",
    instagram:
      "Exhibitor tip 💡\n\nBooth size changes every show?\nGo reconfigurable: 10×20 inline one month, 20×20 island the next. Same kit, new graphics.\n\nLink in bio.",
    hashtags: [...TIP_TAGS, "#reconfigurablebooth", "#modularbooth"],
    href: "/reconfigurable-trade-show-booths",
    gallerySlug: "img-21",
    layout: "hero",
    kicker: "Reconfigurable trade show booths",
    overlayText: "One booth kit. 10x20 inline today, 20x20 island next show.",
    cta: "design",
  },
  {
    id: "tip-advance-orders",
    week: 8,
    theme: "tips",
    title: "Order electrical in advance",
    linkedin:
      "Exhibitor tip: order electrical and internet before the advance deadline.\n\nVenue contractors publish two prices: advance and on-site. The on-site rate is usually much higher, and that is before you lose an hour of setup waiting.\n\nWe send you the deadlines for your show with the quote. Exhibitor resources:",
    instagram:
      "Exhibitor tip 💡\n\nOrder electrical + internet before the advance deadline. On-site rates cost more and cost time.\n\nWe send your deadlines with the quote. Link in bio.",
    hashtags: TIP_TAGS,
    href: "/exhibitor-resources",
    gallerySlug: "img-25",
    layout: "card",
    kicker: "Exhibitor tip",
    big: "Order early",
    overlayText: "Advance orders beat on-site rates. We send your deadlines.",
    cta: "resource",
  },
  {
    id: "tip-rent-vs-buy-math",
    week: 10,
    theme: "tips",
    title: "Rent vs buy rule of thumb",
    linkedin:
      "Exhibitor tip: the rent vs buy rule of thumb.\n\n1 to 3 shows a year, or a footprint that changes: rent. 4+ shows a year at the same size: buying starts to win.\n\nEither way, I&D is included in our price. Trade show booth rental pricing by size:",
    instagram:
      "Exhibitor tip 💡\n\n1 to 3 shows/yr → rent\n4+ shows, same size → buy\n\nI&D included either way. Link in bio.",
    hashtags: TIP_TAGS,
    href: "/trade-show-booth-rental-pricing",
    gallerySlug: "img-29",
    layout: "card",
    kicker: "Exhibitor tip",
    big: "Rent or buy?",
    overlayText: "1 to 3 shows a year, rent. 4+ at the same size, buy.",
    cta: "meeting",
  },
];

const resourcePosts: SocialPost[] = [
  {
    id: "res-pricing-guide",
    week: 5,
    theme: "resources",
    title: "2027 booth rental pricing guide",
    linkedin:
      "Free resource: the Traction X trade show booth rental pricing guide for the U.S. and Canada.\n\nStarting prices by size: 10×10 from $12,500, 10×20 from $17,500, 20×20 from $30,000. What is included, what the venue bills separately, and how city labour rates move the number.\n\nGet the guide:",
    instagram:
      "Free pricing guide 📘\n\n10×10 from $12,500\n10×20 from $17,500\n20×20 from $30,000\nI&D included.\n\nLink in bio.",
    hashtags: RESOURCE_TAGS,
    href: "/trade-show-booth-rental-pricing",
    gallerySlug: "img-05",
    layout: "price",
    kicker: "Free resource · pricing guide",
    bigLabel: "10x10 rental from",
    big: "$12,500",
    overlayText: "Booth rental pricing for the U.S. and Canada, by size.",
    cta: "resource",
  },
  {
    id: "res-calculator",
    week: 7,
    theme: "resources",
    title: "Booth cost calculator",
    linkedin:
      "Free tool: the trade show booth cost calculator.\n\nPick a size, a city and your add-ons, and get a budget range in about 60 seconds. No guessing, no waiting for a sales call.\n\nTry it:",
    instagram: "Booth cost calculator 🧮\n\nSize + city + add-ons = budget range in about 60 seconds.\n\nLink in bio.",
    hashtags: RESOURCE_TAGS,
    href: "/booth-cost-calculator",
    gallerySlug: "img-13",
    layout: "card",
    kicker: "Free tool",
    big: "60 seconds",
    overlayText: "Your booth budget range, by size and city.",
    cta: "quote",
  },
  {
    id: "res-booth-plan",
    week: 9,
    theme: "resources",
    title: "Build your booth plan",
    linkedin:
      "Free tool: Build Your Booth Plan.\n\nAnswer 14 quick questions about your show, goals and budget, and get a booth plan with the right size, layout and must-haves for your exhibit.\n\nStart your plan:",
    instagram: "Build Your Booth Plan 🗂️\n\n14 quick questions → your size, layout and must-haves.\n\nLink in bio.",
    hashtags: RESOURCE_TAGS,
    href: "/build-your-booth-plan",
    gallerySlug: "img-01",
    layout: "card",
    kicker: "Free tool",
    big: "14 questions",
    overlayText: "Get a booth plan matched to your show, goals and budget.",
    cta: "resource",
  },
  {
    id: "res-booth-builder",
    week: 11,
    theme: "resources",
    title: "Booth Builder",
    linkedin:
      "Free tool: the Traction X Booth Builder.\n\nDrop in your website and see your logo, colours and hero images on a 3D trade show booth in minutes. Then send it to us for a full complimentary 3D design.\n\nBuild yours:",
    instagram: "Booth Builder 🛠️\n\nYour website → your brand on a 3D booth in minutes.\n\nLink in bio.",
    hashtags: [...RESOURCE_TAGS, "#3dboothdesign"],
    href: "/booth-builder",
    gallerySlug: "img-33",
    layout: "hero",
    kicker: "Free tool · 3D Booth Builder",
    overlayText: "See your brand on a 3D trade show booth in minutes.",
    cta: "design",
  },
  {
    id: "res-exhibitor-center",
    week: 12,
    theme: "resources",
    title: "Exhibitor resource center",
    linkedin:
      "Free resources for exhibitors: checklists, timelines, show and venue guides, and a glossary of trade show terms, all in one place.\n\nBookmark it:",
    instagram: "Exhibitor resource center 📚\n\nChecklists, timelines, venue guides, glossary.\n\nLink in bio.",
    hashtags: RESOURCE_TAGS,
    href: "/exhibitor-resources",
    gallerySlug: "img-37",
    layout: "card",
    kicker: "Free resources",
    big: "Checklists",
    overlayText: "Timelines, venue guides and a trade show glossary in one place.",
    cta: "resource",
  },
];

export const EXTRA_POSTS: SocialPost[] = [...venuePosts, ...showPosts, ...tipPosts, ...resourcePosts];
