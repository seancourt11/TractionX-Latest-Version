# Pricing labels: every range starts with "From"

## The rule
Wherever we show a price range, it starts with **"From"**, e.g. **"From $16K to $40K"**. That tells people the range is where projects usually start, and bigger or more detailed builds can cost more than the top number.

## How prices read today
- **Booth cards and booth detail pages:** "Rent $16,250 to $19,750 · Buy from $22,000". No "from" on the rent range, so $19,750 looks like the most it will cost.
- **Landed budget box (venue, city, show pages):** "$25,000 to $40,000" with no "from".
- **Budget bands table (venue, city, show pages):** single "Rent from" / "Buy from" numbers. Already fine.
- Quote form and cost calculator ranges: will be checked and given the same "From" wording where they show a range.

## Changes
1. Booth cards and detail pages: **"Rent from $16K to $20K · Buy from $22K"**.
2. Landed budget box: **"From $25K to $40K"**.
3. Any other range shown to visitors (quote form, calculator, pricing page, PDFs) gets the same "From X to Y" pattern.
4. Add one short line near ranges: "Ranges show typical starting budgets. Larger or more custom builds can cost more."
5. No price math changes. Single "from" numbers stay as they are.

## Technical notes
- Add a shared `fmtFromRange(low, high)` and short-money formatter ($25K) in `src/lib/market-tier.ts`.
- Use it in `src/lib/booth-pricing.ts` (`rentRange`), `src/components/LandedCostBand.tsx`, and search other visible ranges (`rg " to \\$"`) in quote, calculator, pricing and PDF code.
- Product schema keeps full numeric prices.
- Save the rule to project memory.
