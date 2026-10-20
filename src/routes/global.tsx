import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout, PageHero, Section, CTABand } from "@/components/PageLayout";
import { DesignCtaBand } from "@/components/GlobalCta";
import { REGIONS } from "@/data/regions";
import { CITIES, cityUrlSlug, type City } from "@/data/cities";
import { SITE } from "@/lib/site";

/** City directory grouped by country, A-Z within each country. */
function groupByCountry(list: City[], order: (name: string) => number) {
  const byCountry = new Map<string, City[]>();
  for (const c of list) {
    const arr = byCountry.get(c.countryName) ?? [];
    arr.push(c);
    byCountry.set(c.countryName, arr);
  }
  return [...byCountry.entries()]
    .sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b))
    .map(([country, cities]) => ({
      country,
      cities: [...cities].sort((a, b) => a.city.localeCompare(b.city)),
    }));
}

const NA_GROUPS = groupByCountry(
  CITIES.filter((c) => !c.international),
  (name) => (name === "United States" ? 0 : 1),
);
const INTL_GROUPS = groupByCountry(CITIES.filter((c) => c.international), () => 0);

function CityGroups({ groups }: { groups: { country: string; cities: City[] }[] }) {
  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g.country}>
          <h3 className="font-display text-sm uppercase tracking-[0.2em] text-white/50">{g.country}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {g.country === "United States" ? (
              <Link
                to="/las-vegas-modular-trade-show-booth-rentals"
                className="px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 text-sm hover:border-[oklch(0.78_0.13_300)] hover:bg-white/10 transition"
              >
                Las Vegas
              </Link>
            ) : null}
            {g.cities.map((c) => (
              <Link
                key={c.slug}
                to="/city/$slug"
                params={{ slug: cityUrlSlug(c.slug) }}
                className="px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 text-sm hover:border-[oklch(0.78_0.13_300)] hover:bg-white/10 transition"
              >
                {c.city}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const TITLE = "Trade Show Booth Rentals by City: U.S., Canada and International";
const DESC = "Trade show booth rentals and custom exhibits across the United States and Canada, our home market. We also travel with our clients to manage their events globally.";

export const Route = createFileRoute("/global")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: `${SITE.url}/global` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/global` }],
  }),
  component: GlobalHub,
});

function GlobalHub() {
  return (
    <PageLayout>
      <PageHero
        eyebrow="Global"
        title="Trade Show Booth Rentals"
        accent="by City"
        intro="Our home market is the United States and Canada. We also travel with our clients to manage their events globally."
      />
      <Section eyebrow="Regions" title="Where we deliver">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REGIONS.map((r) => (
            <Link
              key={r.slug}
              to="/regions/$slug"
              params={{ slug: r.slug }}
              className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-[oklch(0.78_0.13_300)] transition"
            >
              <h3 className="font-display text-xl font-semibold">{r.label}</h3>
              <p className="mt-2 text-white/70 leading-relaxed">{r.intro}</p>
              <span className="mt-4 inline-block text-sm text-[oklch(0.78_0.13_300)] group-hover:underline">
                Explore {r.label} →
              </span>
            </Link>
          ))}
        </div>
      </Section>
      <Section id="north-america" eyebrow="United States and Canada" title="Every U.S. and Canadian city we build in" bg="muted" intro="Local venue rules, labour and freight differ in every market. Each city page covers the halls, the contractor rules and the shows we build for there.">
        <CityGroups groups={NA_GROUPS} />
      </Section>
      <Section id="international" eyebrow="International" title="International cities" intro="We also travel with our clients to manage their events globally.">
        <CityGroups groups={INTL_GROUPS} />
      </Section>
      <DesignCtaBand source="page" />
      <CTABand />
    </PageLayout>
  );
}

