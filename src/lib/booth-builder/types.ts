/**
 * Traction X Booth Builder — project model.
 *
 * The structured project JSON is the single source of truth: the 2D plan, the
 * 3D view, the properties panel, the (later) AI command layer and the lead
 * payload all read and write this shape. Everything structural is stored in
 * millimetres on the beMatrix grid; counters and rental products get their own
 * sizing systems.
 */

export type BoothType = "inline" | "corner" | "peninsula" | "island";

export type EdgeColor = "white" | "black" | "brand";

export type HeightPreset = "standard" | "tall" | "extra_tall" | "double";

export type GraphicType =
  | "full_seg_graphic"
  | "solid_color"
  | "backlit_graphic"
  | "printed_logo"
  | "die_cut_logo"
  | "channel_letters";

export type LogoTreatment = "none" | "printed" | "die_cut" | "channel_letters";

/** Where the mark sits on a branded surface. "auto" lets the brand kit decide. */
export type LogoPlacement = "auto" | "top_center" | "top_left" | "center" | "none";

/** Two ways to dress a booth: photography from the brand, or brand colour only. */
export type BrandMode = "photo" | "color";

export type BrandImage = {
  url: string;
  /** Big feature walls take "hero"; smaller surfaces take "secondary". */
  role: "hero" | "secondary";
  source: "website" | "upload";
  /** Unticked images stay in the list but are never applied. */
  use: boolean;
};

export type BrandAssetKind = "photo" | "logo" | "guidelines";

/** A file the customer attached. Held in the browser and named on the enquiry. */
export type BrandAsset = {
  id: string;
  kind: BrandAssetKind;
  name: string;
  sizeBytes: number;
  /** Object URL — usable in this session only. */
  url?: string;
};

/** Hero messaging read off the customer's website, used on the main graphic. */
export type BrandHero = {
  headline: string;
  subhead: string;
  cta: string;
};

/** Which floor of the booth an object lives on. */
export type Level = "ground" | "upper";

/** Fonts offered for text graphics. Ids map to stacks in text-graphic.ts. */
export type TextFont = "inter" | "montserrat" | "georgia" | "arial_black" | "courier";

/** Per-surface branding override. Empty fields fall back to the brand kit. */
export type SurfaceGraphic = {
  imageUrl?: string;
  logoPlacement?: LogoPlacement;
  logoScale?: number;
  /** Hero copy composed into this surface's artwork. */
  headline?: string;
  cta?: string;
  /** Free text graphic, for example "Mission: Ready". */
  text?: string;
  textFont?: TextFont;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  textPlacement?: "top" | "center" | "bottom";
  /** Cap height of the text in millimetres. */
  textSizeMm?: number;
};

/** Branding on the band around a double deck's edge. */
export type FasciaBranding = {
  textSizeMm?: number;
  textFont?: TextFont;
  textAlign?: "left" | "center" | "right";
  textPlacement?: "top" | "center" | "bottom";
  /** Solid colour; defaults to the deck frame colour. */
  color?: string;
  imageUrl?: string;
  logoPlacement?: "left" | "center" | "right" | "none";
  /** Repeat the mark along each face instead of showing it once. */
  repeatLogo?: boolean;
  text?: string;
  textColor?: string;
};


export type WallSection = {
  id: string;
  widthMm: number;
  /** Internally illuminated SEG on this section only. */
  lightbox: boolean;
};

/** Wall, built either from a full preset or from individual modular pieces. */
export type WallObject = {
  id: string;
  type: "wall";
  name: string;
  buildMode: "preset" | "modular";
  preset?: string;
  heightMm: number;
  heightPreset: HeightPreset;
  edgeColor: EdgeColor;
  graphicType: GraphicType;
  /** Used when graphicType is "solid_color". */
  graphicColor?: string;
  /** Whole-wall backlighting; individual sections can also be lit. */
  lightbox?: boolean;
  sections: WallSection[];
  logo?: {
    treatment: LogoTreatment;
    url?: string;
    scale: number;
  };
  /** Centre point of the wall run, in mm, in booth floor space. */
  position: { x: number; z: number };
  /** 0 = the run lies along the X axis. */
  rotationDeg: number;
  /** Set when several pieces have been grouped into one logical wall. */
  groupId?: string;
  /** Brand artwork on this surface. */
  graphic?: SurfaceGraphic;
  /** Upper-level walls sit on a deck. */
  level?: Level;
  /** The deck this wall stands on. */
  deckId?: string;
};

/**
 * Everything that is not a wall. Three sizing systems share this shape:
 * modular (storage, towers — sizes snap to the grid), free parametric
 * (counters), and fixed products (TVs, furniture).
 */
export type ItemKind =
  | "storage"
  | "tower"
  | "counter"
  | "tv"
  | "furniture"
  | "hanging"
  | "double_deck"
  | "stair"
  | "glass_wall"
  | "led_wall"
  | "frame";

/** Overhead sign shapes. */
export type HangingShape = "square" | "rectangle" | "halo";

export type SizingSystem = "modular" | "free" | "fixed";

export type ItemObject = {
  id: string;
  type: "item";
  kind: ItemKind;
  sizing: SizingSystem;
  name: string;
  presetId?: string;
  /**
   * Stable key naming the 3D piece drawn for this object. Lets us swap in an
   * exact Traction X rental model later without changing saved layouts.
   */
  visualKey?: string;
  /** Footprint and height in millimetres. */
  widthMm: number;
  depthMm: number;
  heightMm: number;
  /** Mounting height off the floor — used by wall-mounted screens. */
  elevationMm?: number;
  /** Finish colour token used by both views. */
  finish: "white" | "black" | "wood" | "brand";
  /** Internally illuminated (counters, towers, storage headers, hanging signs). */
  lightbox?: boolean;
  /** Optional counter toe-kick lighting. */
  toeKickLed?: boolean;
  /** Overhead signs only. */
  shape?: HangingShape;
  doubleSided?: boolean;
  /** Height of the bottom of a hanging sign off the floor, in mm. */
  hangHeightMm?: number;
  position: { x: number; z: number };
  rotationDeg: number;
  groupId?: string;
  /** Brand artwork on this structure's aisle-facing surface. */
  graphic?: SurfaceGraphic;
  /** Upper-level items stand on a deck at the deck floor height. */
  level?: Level;
  /** The deck this item stands on. */
  deckId?: string;
  /** Deck stairs: mirror the run left/right. */
  mirrored?: boolean;
  /** Deck stairs: include a landing platform at the top. */
  landing?: boolean;
  /** Close the stair sides with solid panels. */
  enclosed?: boolean;
  /** Custom decks: column grid spacing, about every 2976 mm by default. */
  columnSpacingMm?: number;
  /** Custom decks: branding on the fascia band around the deck edge. */
  fascia?: FasciaBranding;
  /** Glass walls: include a door. */
  door?: boolean;
  /** Glass walls: frosted privacy band at eye height. */
  frostedBand?: boolean;
  /** LED video walls: floor-standing instead of wall-mounted. */
  floorStanding?: boolean;
};

export type BoothObject = WallObject | ItemObject;

export type FlooringChoice = {
  /** Swatch id from the flooring presets, or null for the bare show floor. */
  swatchId: string | null;
};

export type BoothProject = {
  project: {
    projectName: string;
    boothSize: string;
    boothType: BoothType;
    /** Footprint in millimetres, derived from the chosen size. */
    widthMm: number;
    depthMm: number;
    showName: string;
  };
  branding: {
    website: string;
    /** Primary mark used on dark surfaces (usually the white/reversed version). */
    logoUrl: string;
    /** Optional second mark used when a surface is light. */
    logoDarkUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    /** Up to six colours read off the site, offered as swatches. */
    palette?: string[];
    /** Photography available to dress the booth. */
    images?: BrandImage[];
    /** Files the customer attached (photos, logo, guidelines). */
    assets?: BrandAsset[];
    /** Photo look or colour-only look. */
    mode?: BrandMode;
    /** Headline / call-to-action wording read off the website. */
    hero?: BrandHero;
  };

  regulations: {
    enabled: boolean;
    profile: "north_american_standard" | "flexible_event";
    maximumHeightMm: number | null;
    keptIssues?: { id: string; title: string; detail: string }[];
  };
  design: {
    wholeBoothIlluminated: boolean;
    flooring: FlooringChoice;
    objects: BoothObject[];
  };
};
