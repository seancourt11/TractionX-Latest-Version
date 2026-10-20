/**
 * Helpers for the internal social library (/admin/social).
 *
 * Images and product facts are resolved from the live catalogues rather than
 * copied into the post data, so a renamed booth or a new photo flows straight
 * through to the caption card, the rendered visual and the CSV export.
 */

import {
  SOCIAL_POSTS,
  CTA_LINE,
  THEME_FORMAT,
  THEME_PROMISES,
  type SocialPost,
  type SocialFormat,
} from "@/data/social-posts";
import { RENTAL_BOOTHS } from "@/data/rental-booths";
import { PORTABLE_PRODUCTS } from "@/data/portable-products";
import { PORTABLE_IMAGES } from "@/data/portable-images";
import { PORTABLE_CATEGORY_FALLBACK_IMAGES } from "@/data/portable-fallback-images";
import { getVenueHero, getShowHero } from "@/data/hero-images";
import { PROMISES } from "@/data/promises";
import { SITE } from "@/lib/site";
import type { VisualSpec, VisualLayout } from "@/lib/social-visual";
import homeHero from "@/assets/hero-bg.jpg";
import lvHall from "@/assets/lv-hall.jpg";
import foundationBooth from "@/assets/foundation-booth.png.asset.json";
import huaweiBooth from "@/assets/huawei-booth.png.asset.json";
import visaBooth from "@/assets/visa-booth.png.asset.json";
import proj2 from "@/assets/portfolio/air-canada-cargo-booth.jpg.asset.json";
import proj3 from "@/assets/portfolio/telus-game-changers-room.jpg.asset.json";
import proj5 from "@/assets/portfolio/sma-energy-booth.jpg.asset.json";
import proj6 from "@/assets/portfolio/air-canada-lounge.jpg.asset.json";
import proj7 from "@/assets/portfolio/canada-export-booth.jpg.asset.json";
import proj9 from "@/assets/portfolio/team-canada-fanfest.jpg.asset.json";

/** Homepage photography, preferred for posts without their own catalogue photo. */
const HOME_IMAGES: string[] = [
  homeHero,
  foundationBooth.url,
  huaweiBooth.url,
  visaBooth.url,
  proj2.url,
  proj3.url,
  proj5.url,
  proj6.url,
  proj7.url,
  proj9.url,
  lvHall,
];

const galleryModules = import.meta.glob<{ default: { url: string } }>(
  "@/assets/gallery/*.asset.json",
  { eager: true },
);

/** Portfolio photography, keyed by file stem (`img-01` … `img-37`). */
export const GALLERY_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(galleryModules).map(([path, mod]) => [
    path.split("/").pop()?.replace(".jpg.asset.json", "").replace(".asset.json", "") ?? path,
    mod.default.url,
  ]),
);

const GALLERY_KEYS = Object.keys(GALLERY_IMAGES).sort();

/** Stable pick so a post without an explicit asset still gets a consistent photo. */
function galleryFor(seed: string): string | undefined {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  // Two in three posts use homepage photography, the rest the portfolio gallery.
  if (h % 3 !== 2 || !GALLERY_KEYS.length) return HOME_IMAGES[h % HOME_IMAGES.length];
  return GALLERY_IMAGES[GALLERY_KEYS[h % GALLERY_KEYS.length]];
}

type AssetRef = {
  boothSlug?: string;
  productSlug?: string;
  gallerySlug?: string;
  venueSlug?: string;
  showSlug?: string;
  image?: string;
};

/** Resolve any asset pointer to a URL plus a human label. */
function resolveAsset(ref: AssetRef): { src?: string; label?: string } {
  if (ref.boothSlug) {
    const booth = RENTAL_BOOTHS.find((b) => b.slug === ref.boothSlug);
    if (booth) {
      return {
        src: booth.image,
        label: `${booth.name} · ${booth.size.replace("x", " × ")} ft rental`,
      };
    }
  }
  if (ref.productSlug) {
    const product = PORTABLE_PRODUCTS.find((p) => p.slug === ref.productSlug);
    if (product) {
      return {
        src: PORTABLE_IMAGES[product.slug] ?? PORTABLE_CATEGORY_FALLBACK_IMAGES[product.category],
        label: `${product.name} · from ${product.priceFrom} · ${product.setup}`,
      };
    }
  }
  if (ref.gallerySlug) {
    const src = GALLERY_IMAGES[ref.gallerySlug];
    if (src) return { src };
  }
  if (ref.venueSlug) {
    const hero = getVenueHero(ref.venueSlug);
    return { src: hero.src, label: "Venue photography" };
  }
  if (ref.showSlug) {
    const hero = getShowHero(ref.showSlug);
    return { src: hero.src, label: "Show photography" };
  }
  if (ref.image) return { src: ref.image };
  return {};
}

export type ResolvedPost = SocialPost & {
  /** Suggested image, resolved from the catalogue where possible. */
  imageSrc?: string;
  /** Short line describing the asset, shown under the thumbnail. */
  assetLabel?: string;
  /** Effective visual treatment (explicit, or the theme default). */
  visualFormat: SocialFormat;
  /** Effective promise badge texts. */
  promiseBadges: string[];
  /** Effective promise ids, for the CSV. */
  promises: string[];
  /** Second image for split visuals. */
  splitSrc?: string;
  /** Ordered carousel frames, primary first. */
  carouselFrames: { src?: string; caption?: string }[];
  /** Absolute URL for the caption. */
  url: string;
};

const PROMISE_BY_ID = Object.fromEntries(PROMISES.map((p) => [p.id, p]));

export function resolvePost(post: SocialPost): ResolvedPost {
  const primary = resolveAsset(post);
  // Every post gets a visual: fall back to portfolio photography when the post
  // carries no catalogue pointer of its own.
  const imageSrc = primary.src ?? galleryFor(post.id);
  const assetLabel = primary.label;

  const visualFormat = post.format ?? THEME_FORMAT[post.theme];
  const promises = post.promiseIds ?? THEME_PROMISES[post.theme] ?? [];
  const promiseBadges = promises.map((id) => PROMISE_BY_ID[id]?.badge).filter(Boolean) as string[];

  const splitSrc =
    visualFormat === "split" && post.splitWith ? resolveAsset(post.splitWith).src : undefined;

  const carouselFrames =
    visualFormat === "carousel" && post.carousel?.length
      ? post.carousel.map((frame) => ({
          src: resolveAsset(frame).src ?? imageSrc,
          caption: frame.caption,
        }))
      : [{ src: imageSrc, caption: post.title }];

  return {
    ...post,
    imageSrc,
    assetLabel,
    visualFormat,
    promises,
    promiseBadges,
    splitSrc,
    carouselFrames,
    url: `${SITE.url}${post.href}`,
  };
}

export const RESOLVED_POSTS: ResolvedPost[] = SOCIAL_POSTS.map(resolvePost);

const CTA_SHORT: Record<SocialPost["cta"], string> = {
  design: "Get your free 3D design",
  meeting: "Book a 10-min call",
  quote: "See pricing in 60 seconds",
  resource: "Get the free resource",
  careers: "See open roles",
};

const THEME_KICKER: Record<SocialPost["theme"], string> = {
  faq: "Trade show FAQ",
  timeline: "Planning timeline",
  cost: "Trade show booth pricing",
  catalogue: "Trade show booth rentals",
  portables: "Portable displays",
  custom: "Custom trade show exhibits",
  resources: "Free resource",
  automation: "Instant pricing · 3D design",
  hiring: "Now hiring",
  venues: "Shows and venues",
  tips: "Exhibitor tip",
};

const PRICE_RE = /\$[\d,]+(?:\.\d+)?[KkMm]?\+?/;
const SIZE_RE = /\b(\d{1,2})\s?[x×]\s?(\d{1,2})\b/;

function deriveLayout(post: ResolvedPost): VisualLayout {
  if (post.layout) return post.layout;
  if (post.visualFormat === "split" && post.splitSrc) return "split";
  if (post.venueSlug || post.showSlug) return "city";
  if (post.theme === "cost") return "price";
  if (["faq", "timeline", "resources", "automation", "hiring", "tips"].includes(post.theme)) return "card";
  return "hero";
}

/**
 * Build the canvas spec for a post. `withPromises` mirrors the admin toggle so
 * the same post can be exported with or without the promise badges baked in.
 */
export function visualSpec(
  post: ResolvedPost,
  opts: { withPromises: boolean; frame?: number } = { withPromises: true },
): VisualSpec {
  const layout = deriveLayout(post);
  const frame =
    post.visualFormat === "carousel"
      ? (post.carouselFrames[opts.frame ?? 0] ?? post.carouselFrames[0])
      : undefined;
  const first = (opts.frame ?? 0) === 0;
  const headline = frame?.caption ?? post.overlayText ?? post.title;
  const text = `${post.title} ${post.overlayText ?? ""} ${post.linkedin}`;

  let big = post.big;
  let bigLabel = post.bigLabel;
  if (!big && layout === "price") {
    const price = text.match(PRICE_RE)?.[0];
    const size = text.match(SIZE_RE);
    if (price) {
      big = price;
      bigLabel = size ? `${size[1]}x${size[2]} from` : "Starting from";
    }
  }
  if (!big && layout === "city") big = post.city;
  if (!big && layout === "card" && post.theme === "faq") big = "Q&A";

  const kicker =
    post.kicker ??
    (layout === "city" && post.city
      ? `${post.city}${post.venue ? ` · ${post.venue}` : ""}`
      : THEME_KICKER[post.theme]);

  const subline = post.facts?.length ? undefined : post.assetLabel ?? (layout === "city" ? undefined : post.venue);

  return {
    layout,
    src: frame?.src ?? post.imageSrc,
    splitSrc: layout === "split" ? post.splitSrc : undefined,
    splitLabels: post.splitLabels,
    kicker,
    big,
    bigLabel,
    headline,
    subline: first ? subline : undefined,
    facts: post.facts,
    badges: opts.withPromises && first ? post.promiseBadges.slice(0, 2) : undefined,
    cta: CTA_SHORT[post.cta],
    domain: "tractionx.ca",
    highlight: [post.city ?? "", post.venue ?? "", "free", "included", "reconfigurable"].filter(Boolean),
  };
}

/** Caption exactly as it should be pasted, CTA line and link appended. */
export function fullCaption(post: ResolvedPost, platform: "linkedin" | "instagram"): string {
  const body = platform === "linkedin" ? post.linkedin : post.instagram;
  const tags = post.hashtags.join(" ");
  const cta = CTA_LINE[post.cta];
  return platform === "linkedin"
    ? `${body}\n${post.url}\n\n${cta}\n\n${tags}`
    : `${body}\n\n${cta}\n${post.url}\n\n${tags}`;
}

function cell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** CSV in the column shape Buffer / Later / Hootsuite bulk imports accept. */
export function postsToCsv(posts: ResolvedPost[]): string {
  const header = [
    "week",
    "theme",
    "platform",
    "title",
    "caption",
    "hashtags",
    "link",
    "image",
    "format",
    "promises",
    "linkedin_image",
    "instagram_square_image",
    "instagram_vertical_image",
    "carousel_count",
    "city",
    "venue",
    "cta",
  ];
  const rows: string[][] = [];
  for (const post of posts) {
    const carouselCount = post.visualFormat === "carousel" ? post.carouselFrames.length : 0;
    for (const platform of ["linkedin", "instagram"] as const) {
      rows.push([
        String(post.week),
        post.theme,
        platform,
        post.title,
        fullCaption(post, platform),
        post.hashtags.join(" "),
        post.url,
        post.imageSrc ?? "",
        post.visualFormat,
        post.promises.join(", "),
        `${post.id}-linkedin.png`,
        `${post.id}-instagram-square.png`,
        `${post.id}-instagram-vertical.png`,
        String(carouselCount),
        post.city ?? "",
        post.venue ?? "",
        post.cta,
      ]);
    }
  }
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
}

export function downloadCsv(posts: ResolvedPost[], filename = "traction-x-social-calendar.csv") {
  const blob = new Blob([postsToCsv(posts)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Local "already posted" tracking — prototype-only, same pattern as the admin store. */
const POSTED_KEY = "tx-social-posted-v1";

export function readPosted(): string[] {
  try {
    const raw = window.localStorage.getItem(POSTED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function writePosted(ids: string[]) {
  try {
    window.localStorage.setItem(POSTED_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable — tracking is best-effort */
  }
}
