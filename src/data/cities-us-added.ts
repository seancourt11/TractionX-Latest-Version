import type { City, CityVenue } from "./cities";

/**
 * Additional U.S. markets on the standard city template. Real venues and real
 * recurring shows only; no street address and no office claim. These pages are
 * flagged noindexFollow until each one gets local proof content.
 */
type Seed = {
  slug: string;
  city: string;
  state: string;
  stateAbbr: string;
  latitude: number;
  longitude: number;
  venues: CityVenue[];
  shows: string[];
  neighborhoods: string[];
  unions: string;
  driveTimes: { from: string; minutes: string }[];
};

function build(s: Seed): City {
  const venueNames = s.venues.map((v) => v.name);
  const venueList =
    venueNames.length > 1
      ? `${venueNames.slice(0, -1).join(", ")} and ${venueNames[venueNames.length - 1]}`
      : venueNames[0];
  return {
    slug: s.slug,
    city: s.city,
    state: s.state,
    stateAbbr: s.stateAbbr,
    country: "US",
    countryName: "United States",
    postalCode: "",
    streetAddress: "",
    latitude: s.latitude,
    longitude: s.longitude,
    hero: `CUSTOM TRADE SHOW BOOTH RENTALS IN ${s.city.toUpperCase()}`,
    metaTitle: `Custom Trade Show Booth Rentals in ${s.city} | Traction X`,
    metaDesc: `Custom trade show booth rentals in ${s.city}, ${s.stateAbbr}. Design, fabrication, install and dismantle and project management at ${venueList}.`,
    intro: `Traction X designs, builds and manages custom and modular trade show booth rentals in ${s.city}. We work ${venueList} and the rest of the ${s.city} circuit, including ${s.shows.slice(0, 3).join(", ")}, handling 3D design, fabrication, freight, install and dismantle and project management so your team only has to show up and sell.`,
    neighborhoods: s.neighborhoods,
    venues: s.venues,
    shows: s.shows,
    unions: s.unions,
    driveTimes: s.driveTimes,
    region: "united-states",
    noindexFollow: true,
  };
}

const SEEDS: Seed[] = [
  {
    slug: "fort-worth",
    city: "Fort Worth",
    state: "Texas",
    stateAbbr: "TX",
    latitude: 32.7555,
    longitude: -97.3308,
    venues: [
      { name: "Fort Worth Convention Center", blurb: "Downtown exhibit halls and arena for state association conventions and industry expos.", halls: "Multi-hall" },
      { name: "Will Rogers Memorial Center", blurb: "Cultural District complex for equestrian, livestock and consumer shows.", halls: "Multi-building" },
      { name: "Dickies Arena", blurb: "Arena venue used for large events and rodeo programming next to Will Rogers.", halls: "Arena" },
    ],
    shows: ["Fort Worth Stock Show & Rodeo", "Fort Worth Home & Garden Show", "Fort Worth Boat Show"],
    neighborhoods: ["Downtown", "Cultural District", "Sundance Square", "Stockyards", "Arlington"],
    unions: "Right-to-work state; labour booked through the show's official contractor",
    driveTimes: [
      { from: "DFW International Airport", minutes: "30 min" },
      { from: "Dallas", minutes: "45 min" },
      { from: "Arlington", minutes: "20 min" },
    ],
  },
  {
    slug: "riverside",
    city: "Riverside / Ontario",
    state: "California",
    stateAbbr: "CA",
    latitude: 34.0633,
    longitude: -117.6509,
    venues: [
      { name: "Ontario Convention Center", blurb: "The Inland Empire's main exhibit hall, next to Ontario International Airport.", halls: "Exhibit hall" },
      { name: "Riverside Convention Center", blurb: "Downtown Riverside venue for regional conferences and association meetings.", halls: "Exhibit hall" },
    ],
    shows: ["Inland Empire regional association conferences", "Southern California logistics and supply chain events", "Regional home and garden shows"],
    neighborhoods: ["Ontario", "Downtown Riverside", "Rancho Cucamonga", "San Bernardino", "Corona"],
    unions: "California union jurisdiction rules apply; crews booked through the official show contractor",
    driveTimes: [
      { from: "Ontario International Airport (ONT)", minutes: "5 min" },
      { from: "Los Angeles", minutes: "1 hr" },
      { from: "Riverside", minutes: "25 min" },
    ],
  },
  {
    slug: "cincinnati",
    city: "Cincinnati",
    state: "Ohio",
    stateAbbr: "OH",
    latitude: 39.1031,
    longitude: -84.512,
    venues: [
      { name: "Duke Energy Convention Center", blurb: "Downtown Cincinnati's convention center for association, manufacturing and consumer shows.", halls: "Multi-hall" },
    ],
    shows: ["Cincinnati Home & Garden Show", "Cincinnati Travel, Sports & Boat Show", "Regional manufacturing and healthcare conferences"],
    neighborhoods: ["Downtown", "Over-the-Rhine", "The Banks", "Covington", "Newport"],
    unions: "Union labour jurisdiction at the convention center; crews booked through the official contractor",
    driveTimes: [
      { from: "CVG International Airport", minutes: "20 min" },
      { from: "Dayton", minutes: "55 min" },
      { from: "Columbus", minutes: "1 hr 45 min" },
    ],
  },
  {
    slug: "providence",
    city: "Providence",
    state: "Rhode Island",
    stateAbbr: "RI",
    latitude: 41.824,
    longitude: -71.4128,
    venues: [
      { name: "Rhode Island Convention Center", blurb: "Downtown Providence exhibit hall connected to the Amica Mutual Pavilion.", halls: "Exhibit hall" },
    ],
    shows: ["Rhode Island Home Show", "Providence Boat Show", "New England regional association conferences"],
    neighborhoods: ["Downtown", "Federal Hill", "College Hill", "Warwick", "Pawtucket"],
    unions: "Union labour jurisdiction; crews booked through the official contractor",
    driveTimes: [
      { from: "PVD T.F. Green Airport", minutes: "15 min" },
      { from: "Boston", minutes: "1 hr" },
      { from: "Hartford", minutes: "1 hr 15 min" },
    ],
  },
  {
    slug: "louisville",
    city: "Louisville",
    state: "Kentucky",
    stateAbbr: "KY",
    latitude: 38.2527,
    longitude: -85.7585,
    venues: [
      { name: "Kentucky Exposition Center", blurb: "One of the largest exhibit facilities in the U.S., home to national farm and truck shows.", halls: "Multi-hall" },
      { name: "Kentucky International Convention Center", blurb: "Downtown convention center for association and corporate events.", halls: "Multi-hall" },
    ],
    shows: ["National Farm Machinery Show", "Mid-America Trucking Show", "Kentucky State Fair"],
    neighborhoods: ["Downtown", "NuLu", "Highlands", "Old Louisville", "Jeffersonville"],
    unions: "Union labour jurisdiction at both halls; crews booked through the official contractor",
    driveTimes: [
      { from: "SDF Louisville Muhammad Ali Airport", minutes: "10 min" },
      { from: "Lexington", minutes: "1 hr 15 min" },
      { from: "Cincinnati", minutes: "1 hr 40 min" },
    ],
  },
  {
    slug: "richmond",
    city: "Richmond",
    state: "Virginia",
    stateAbbr: "VA",
    latitude: 37.5407,
    longitude: -77.436,
    venues: [
      { name: "Greater Richmond Convention Center", blurb: "Virginia's largest convention center, downtown Richmond.", halls: "Exhibit hall" },
    ],
    shows: ["Richmond Home & Garden Show", "Virginia state association conventions", "Mid-Atlantic regional trade events"],
    neighborhoods: ["Downtown", "The Fan", "Scott's Addition", "Shockoe Bottom", "Glen Allen"],
    unions: "Right-to-work state; labour booked through the show's official contractor",
    driveTimes: [
      { from: "RIC Richmond International Airport", minutes: "15 min" },
      { from: "Washington, DC", minutes: "2 hr" },
      { from: "Virginia Beach", minutes: "1 hr 45 min" },
    ],
  },
  {
    slug: "fresno",
    city: "Fresno",
    state: "California",
    stateAbbr: "CA",
    latitude: 36.7378,
    longitude: -119.7871,
    venues: [
      { name: "Fresno Convention & Entertainment Center", blurb: "Downtown complex with exhibit hall, theatre and arena for Central Valley events.", halls: "Multi-venue" },
    ],
    shows: ["World Ag Expo (nearby Tulare)", "Central Valley regional agriculture events", "Fresno Home & Garden Show"],
    neighborhoods: ["Downtown", "Tower District", "Clovis", "Fig Garden", "Tulare"],
    unions: "California union jurisdiction rules apply; crews booked through the official show contractor",
    driveTimes: [
      { from: "FAT Fresno Yosemite Airport", minutes: "15 min" },
      { from: "Tulare", minutes: "50 min" },
      { from: "San Jose", minutes: "2 hr 30 min" },
    ],
  },
  {
    slug: "birmingham",
    city: "Birmingham",
    state: "Alabama",
    stateAbbr: "AL",
    latitude: 33.5186,
    longitude: -86.8104,
    venues: [
      { name: "Birmingham Jefferson Convention Complex", blurb: "Downtown complex with exhibition halls, arena and concert hall.", halls: "Multi-hall" },
    ],
    shows: ["Birmingham Home & Garden Show", "Alabama state association conventions", "Southeastern regional industry events"],
    neighborhoods: ["Downtown", "Southside", "Lakeview", "Homewood", "Hoover"],
    unions: "Right-to-work state; labour booked through the show's official contractor",
    driveTimes: [
      { from: "BHM Birmingham-Shuttlesworth Airport", minutes: "10 min" },
      { from: "Atlanta", minutes: "2 hr 15 min" },
      { from: "Huntsville", minutes: "1 hr 30 min" },
    ],
  },
  {
    slug: "grand-rapids",
    city: "Grand Rapids",
    state: "Michigan",
    stateAbbr: "MI",
    latitude: 42.9634,
    longitude: -85.6681,
    venues: [
      { name: "DeVos Place Convention Center", blurb: "Riverfront convention center for furniture, agriculture and consumer shows.", halls: "Exhibit hall" },
    ],
    shows: ["Great Lakes Fruit, Vegetable & Farm Market EXPO", "Grand Rapids Boat Show", "West Michigan Home & Garden Show"],
    neighborhoods: ["Downtown", "Heritage Hill", "East Grand Rapids", "Wyoming", "Holland"],
    unions: "Michigan union jurisdiction rules apply; crews booked through the official contractor",
    driveTimes: [
      { from: "GRR Gerald R. Ford Airport", minutes: "20 min" },
      { from: "Detroit", minutes: "2 hr 30 min" },
      { from: "Chicago", minutes: "3 hr" },
    ],
  },
  {
    slug: "hartford",
    city: "Hartford",
    state: "Connecticut",
    stateAbbr: "CT",
    latitude: 41.7658,
    longitude: -72.6734,
    venues: [
      { name: "Connecticut Convention Center", blurb: "Riverfront convention center for insurance, healthcare and consumer events.", halls: "Exhibit hall" },
    ],
    shows: ["Connecticut Flower & Garden Show", "Hartford Home Show", "New England regional association conferences"],
    neighborhoods: ["Downtown", "Front Street", "West Hartford", "East Hartford", "Glastonbury"],
    unions: "Union labour jurisdiction; crews booked through the official contractor",
    driveTimes: [
      { from: "BDL Bradley International Airport", minutes: "20 min" },
      { from: "Boston", minutes: "1 hr 45 min" },
      { from: "New York City", minutes: "2 hr" },
    ],
  },
  {
    slug: "buffalo",
    city: "Buffalo",
    state: "New York",
    stateAbbr: "NY",
    latitude: 42.8864,
    longitude: -78.8784,
    venues: [
      { name: "Buffalo Niagara Convention Center", blurb: "Downtown Buffalo exhibit hall for regional association and consumer shows.", halls: "Exhibit hall" },
    ],
    shows: ["Buffalo Home Show", "Buffalo Boat, Sport & RV Show", "Western New York regional industry events"],
    neighborhoods: ["Downtown", "Elmwood Village", "Canalside", "Amherst", "Niagara Falls"],
    unions: "New York union jurisdiction rules apply; crews booked through the official contractor",
    driveTimes: [
      { from: "BUF Buffalo Niagara Airport", minutes: "20 min" },
      { from: "Toronto", minutes: "1 hr 45 min" },
      { from: "Rochester", minutes: "1 hr 10 min" },
    ],
  },
  {
    slug: "rochester",
    city: "Rochester",
    state: "New York",
    stateAbbr: "NY",
    latitude: 43.1566,
    longitude: -77.6088,
    venues: [
      { name: "Joseph A. Floreano Rochester Riverside Convention Center", blurb: "Downtown riverfront convention center for regional conferences and expos.", halls: "Exhibit hall" },
    ],
    shows: ["Rochester Home & Garden Show", "Rochester regional technology and optics events", "Western New York association conferences"],
    neighborhoods: ["Downtown", "East End", "Park Avenue", "Pittsford", "Henrietta"],
    unions: "New York union jurisdiction rules apply; crews booked through the official contractor",
    driveTimes: [
      { from: "ROC Greater Rochester Airport", minutes: "15 min" },
      { from: "Buffalo", minutes: "1 hr 10 min" },
      { from: "Syracuse", minutes: "1 hr 20 min" },
    ],
  },
  {
    slug: "greenville",
    city: "Greenville",
    state: "South Carolina",
    stateAbbr: "SC",
    latitude: 34.8526,
    longitude: -82.394,
    venues: [
      { name: "Greenville Convention Center", blurb: "Upstate South Carolina exhibit facility for manufacturing, automotive and consumer shows.", halls: "Exhibit hall" },
    ],
    shows: ["Greenville Home & Garden Show", "Upstate manufacturing and automotive supplier events", "South Carolina association conferences"],
    neighborhoods: ["Downtown", "West End", "Greer", "Spartanburg", "Mauldin"],
    unions: "Right-to-work state; labour booked through the show's official contractor",
    driveTimes: [
      { from: "GSP Greenville-Spartanburg Airport", minutes: "15 min" },
      { from: "Charlotte", minutes: "1 hr 30 min" },
      { from: "Atlanta", minutes: "2 hr 15 min" },
    ],
  },
  {
    slug: "atlantic-city",
    city: "Atlantic City",
    state: "New Jersey",
    stateAbbr: "NJ",
    latitude: 39.3643,
    longitude: -74.4229,
    venues: [
      { name: "Atlantic City Convention Center", blurb: "Large exhibit hall at the foot of the Atlantic City Expressway for gaming, hospitality and boat shows.", halls: "Multi-hall" },
    ],
    shows: ["Atlantic City Boat Show", "Northeast regional gaming and hospitality events", "New Jersey League of Municipalities Conference"],
    neighborhoods: ["Boardwalk", "Marina District", "Ventnor", "Margate", "Egg Harbor Township"],
    unions: "New Jersey union jurisdiction rules apply; crews booked through the official contractor",
    driveTimes: [
      { from: "ACY Atlantic City Airport", minutes: "20 min" },
      { from: "Philadelphia", minutes: "1 hr 15 min" },
      { from: "New York City", minutes: "2 hr 30 min" },
    ],
  },
];

export const ADDED_US_CITIES: City[] = SEEDS.map(build);
