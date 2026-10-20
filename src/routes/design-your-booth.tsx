import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageLayout, PageHero, Section, FAQBlock, CTABand } from "@/components/PageLayout";
import { Design3DButton, BookMeetingButton, QuoteButton } from "@/components/GlobalCta";
import { DesignerEmbed } from "@/components/DesignerEmbed";
import { absUrl, robotsMeta } from "@/lib/seo";

const TITLE = "Design Your Trade Show Booth in 3D | Traction X";
const DESC =
  "Design your trade show booth in 3D, start from a ready-made booth, upload your branding and get your floor plan, electrical plan, packing list and city price across the U.S. and Canada.";
const PATH = "/design-your-booth";

const STARTERS = [
  { size: "10x10", name: "10x10 Inline Starter" },
  { size: "10x20", name: "10x20 Inline Starter" },
  { size: "10x20", name: "10x20 Lounge Starter" },
  { size: "20x20", name: "20x20 Island Starter" },
  { size: "20x20", name: "20x20 Product Demo Starter" },
  { size: "20x30", name: "20x30 Meeting Starter" },
];

const FAQ = [
  { q: "Is it free?", a: "Yes. Designing your booth costs nothing, and so does our complimentary 3D design." },
  { q: "Do I need an account?", a: "No. You can design right away. You only add your email and phone when you want your plans, packing list and price." },
  { q: "Can I start from a template?", a: "Yes. Pick one of our ready-made booths and change anything you like, or start from an empty space." },
  { q: "What plans do I get?", a: "A floor plan, a booth approval plan for the show organizer, an electrical plan, a packing list and an estimated price for your city." },
  { q: "What happens after I submit?", a: "A Traction X designer reviews your booth and sends concept direction and investment within two business days." },
  { q: "I work at an agency. Can I design for a client?", a: "Yes. Agencies and creative teams use it to plan client booths in any city we serve and compare prices by city." },
];

export const Route = createFileRoute("/design-your-booth")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      ...robotsMeta(),
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absUrl(PATH) },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absUrl(PATH) }],
  }),
  component: Page,
});

function Page() {
  const [starter, setStarter] = useState<string | undefined>();
  return (
    <PageLayout>
      <PageHero
        eyebrow="Design your booth"
        title="Design your booth"
        accent="in 3D"
        intro="Start from one of our booths or a blank space, add your branding, and see it from every angle. Then get your floor plan, electrical plan, packing list and the price in your city."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#designer" className="bg-[oklch(0.78_0.13_300)] text-black px-5 py-3 rounded-lg font-semibold">Start designing</a>
          <Link to="/rent-a-booth" className="border border-white/25 px-5 py-3 rounded-lg font-semibold hover:bg-white/10">Or pick a booth</Link>
        </div>
      </PageHero>

      <Section eyebrow="How it works" title="Three steps">
        <ol className="grid md:grid-cols-3 gap-6">
          {[
            ["1. Choose", "Pick your booth size or one of our ready-made starters."],
            ["2. Customise", "Walls, graphics, counters, flooring, lighting, furniture and your branding."],
            ["3. Get your plans", "Floor plan, approval plan, electrical plan, packing list and your city price."],
          ].map(([t, d]) => (
            <li key={t} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-display text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-white/70">{d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Starting points" title="Start from a ready-made booth" bg="muted">
        <div className="flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setStarter(s.name)}
              className={`px-4 py-2 rounded-full border text-sm transition ${
                starter === s.name ? "border-[oklch(0.78_0.13_300)] bg-white/10" : "border-white/15 bg-white/5 hover:bg-white/10"
              }`}
            >
              {s.name}
            </button>
          ))}
          <button type="button" onClick={() => setStarter(undefined)} className="px-4 py-2 rounded-full border border-white/15 text-sm text-white/70 hover:bg-white/10">
            Start empty
          </button>
        </div>
      </Section>

      <section id="designer" className="border-b border-white/10">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 py-10">
          <div className="hidden md:block">
            <DesignerEmbed starter={starter} />
          </div>
          <div className="md:hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <p className="font-display text-xl font-bold uppercase">Best on a larger screen</p>
            <p className="mt-2 text-white/70 text-sm">The 3D designer works best on a computer or tablet. Email yourself the link, or talk to a designer now.</p>
            <div className="mt-5 flex flex-col gap-3">
              <a
                href={`mailto:?subject=${encodeURIComponent("Design my booth in 3D")}&body=${encodeURIComponent(absUrl(PATH))}`}
                className="bg-[oklch(0.78_0.13_300)] text-black px-5 py-3 rounded-lg font-semibold"
              >
                Email me the link
              </a>
              <BookMeetingButton source="design-your-booth-mobile" variant="outline" />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuoteButton source="design-your-booth" />
            <Design3DButton source="design-your-booth" variant="outline" />
            <BookMeetingButton source="design-your-booth" variant="ghost" />
          </div>
        </div>
      </section>

      <FAQBlock items={FAQ} />
      <CTABand />
    </PageLayout>
  );
}
