import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllStates,
  getAllAppliances,
  getStateBySlug,
  getApplianceBySlug,
  getNationalAvgRate,
  getNeighboringStates,
} from "@/lib/db";
import {
  formatCents,
  formatCurrency,
  calcMonthlyCost,
  calcYearlyCost,
  capitalize,
  getSourceLabel,
  formatPercent,
} from "@/lib/format";
import { faqSchema, breadcrumbSchema, webPageSchema } from "@/lib/schema";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { DataFeedback } from "@/components/DataFeedback";
import { FreshnessTag } from "@/components/FreshnessTag";
import { PowerBillCalculator } from "@/components/PowerBillCalculator";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function parseSlug(slug: string): { applianceSlug: string; stateSlug: string } | null {
  const match = slug.match(/^(.+)-in-(.+)$/);
  if (!match) return null;
  return { applianceSlug: match[1], stateSlug: match[2] };
}

export async function generateStaticParams() {
  const states = getAllStates();
  const appliances = getAllAppliances();
  const params: { slug: string }[] = [];
  for (const state of states) {
    for (const appliance of appliances) {
      params.push({ slug: `${appliance.slug}-in-${state.slug}` });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) return {};
  const state = getStateBySlug(parsed.stateSlug);
  const appliance = getApplianceBySlug(parsed.applianceSlug);
  if (!state || !appliance) return {};

  const monthly = calcMonthlyCost(appliance.avg_watts, appliance.typical_hours_per_day, state.avg_rate_kwh);
  const yearly = calcYearlyCost(appliance.avg_watts, appliance.typical_hours_per_day, state.avg_rate_kwh);

  return {
    title: `Cost to Run ${appliance.name} in ${state.state} (2026) - ${formatCurrency(monthly)}/Month`,
    description: `Running a ${appliance.name} in ${state.state} costs ${formatCurrency(monthly)}/month or ${formatCurrency(yearly)}/year at ${formatCents(state.avg_rate_kwh)}/kWh. Compare with national average and neighboring states. Energy saving tips included.`,
    alternates: { canonical: `/cost/${slug}/` },
    openGraph: { url: `/cost/${slug}/` },
    keywords: [
      `${appliance.name.toLowerCase()} electricity cost ${state.state}`,
      `energy efficient ${appliance.name.toLowerCase()}`,
      `solar panel savings ${state.state}`,
      `${appliance.name.toLowerCase()} running cost`,
      `${state.state} electricity rate`,
      `how much does ${appliance.name.toLowerCase()} cost to run`,
    ],
  };
}

export default async function CostPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) notFound();

  const state = getStateBySlug(parsed.stateSlug);
  const appliance = getApplianceBySlug(parsed.applianceSlug);
  if (!state || !appliance) notFound();

  const nationalRate = getNationalAvgRate();
  const allStates = getAllStates();
  const neighbors = getNeighboringStates(state.abbr);

  const monthly = calcMonthlyCost(appliance.avg_watts, appliance.typical_hours_per_day, state.avg_rate_kwh);
  const yearly = calcYearlyCost(appliance.avg_watts, appliance.typical_hours_per_day, state.avg_rate_kwh);
  const nationalMonthly = calcMonthlyCost(appliance.avg_watts, appliance.typical_hours_per_day, nationalRate);
  const nationalYearly = calcYearlyCost(appliance.avg_watts, appliance.typical_hours_per_day, nationalRate);
  const dailyKwh = (appliance.avg_watts * appliance.typical_hours_per_day) / 1000;
  const monthlyKwh = dailyKwh * 30;

  const costDiff = monthly - nationalMonthly;
  const costDiffPct = ((costDiff / nationalMonthly) * 100).toFixed(1);
  const isExpensive = costDiff > 0;

  // Rank among all states
  const statesCost = allStates
    .map((s) => ({
      ...s,
      monthly: calcMonthlyCost(appliance.avg_watts, appliance.typical_hours_per_day, s.avg_rate_kwh),
    }))
    .sort((a, b) => a.monthly - b.monthly);
  const rank = statesCost.findIndex((s) => s.abbr === state.abbr) + 1;
  const cheapest = statesCost[0];
  const mostExpensive = statesCost[statesCost.length - 1];

  // Neighbor costs
  const neighborCosts = neighbors.map((n) => ({
    ...n,
    monthly: calcMonthlyCost(appliance.avg_watts, appliance.typical_hours_per_day, n.avg_rate_kwh),
    yearly: calcYearlyCost(appliance.avg_watts, appliance.typical_hours_per_day, n.avg_rate_kwh),
  }));

  const faqs = [
    {
      question: `How much does it cost to run a ${appliance.name} in ${state.state}?`,
      answer: `Running a ${appliance.name} in ${state.state} costs approximately ${formatCurrency(monthly)} per month or ${formatCurrency(yearly)} per year, based on the state's average residential rate of ${formatCents(state.avg_rate_kwh)}/kWh and typical usage of ${appliance.typical_hours_per_day} hours per day.`,
    },
    {
      question: `Is running a ${appliance.name} expensive in ${state.state} compared to other states?`,
      answer: `${state.state} ranks #${rank} out of 50 states for ${appliance.name} running costs (1 = cheapest). ${isExpensive ? `It's ${costDiffPct}% more expensive than the national average.` : `It's ${Math.abs(Number(costDiffPct))}% cheaper than the national average.`} The cheapest state is ${cheapest.state} at ${formatCurrency(cheapest.monthly)}/month, and the most expensive is ${mostExpensive.state} at ${formatCurrency(mostExpensive.monthly)}/month.`,
    },
    {
      question: `How much electricity does a ${appliance.name} use per month?`,
      answer: `A typical ${appliance.name} uses ${appliance.avg_watts} watts and runs about ${appliance.typical_hours_per_day} hours per day, consuming approximately ${dailyKwh.toFixed(2)} kWh daily or ${monthlyKwh.toFixed(1)} kWh per month.`,
    },
    {
      question: `How can I reduce ${appliance.name} electricity costs in ${state.state}?`,
      answer: `You can reduce costs by using an Energy Star rated ${appliance.name}, running it during off-peak hours if your utility offers time-of-use rates, ensuring proper maintenance, and considering solar panels to offset electricity costs in ${state.state}.`,
    },
    {
      question: `What is the electricity rate in ${state.state}?`,
      answer: `The average residential electricity rate in ${state.state} is ${formatCents(state.avg_rate_kwh)} per kWh. The primary energy source is ${getSourceLabel(state.primary_source)}, with ${formatPercent(state.renewable_pct)} from renewable sources.`,
    },
  ];

  const savingTips = getApplianceSavingTips(appliance.category, appliance.name, state.state);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: "/" },
              { name: state.state, url: `/state/${state.slug}/` },
              { name: appliance.name, url: `/appliance/${appliance.slug}/` },
              { name: `${appliance.name} in ${state.state}`, url: `/cost/${slug}/` },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema(
              `Cost to Run ${appliance.name} in ${state.state}`,
              `Monthly and yearly cost to run a ${appliance.name} in ${state.state} at ${formatCents(state.avg_rate_kwh)}/kWh`,
              `/cost/${slug}/`
            )
          ),
        }}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: state.state, href: `/state/${state.slug}/` },
          { label: appliance.name, href: `/appliance/${appliance.slug}/` },
          { label: `${appliance.name} in ${state.state}` },
        ]}
      />

      <h1 className="text-3xl font-bold text-amber-800 mb-2">
        Cost to Run {appliance.name} in {state.state} (2026)
      </h1>
      <p className="text-lg text-slate-600 mb-6">
        At {state.state}&apos;s average rate of{" "}
        <strong>{formatCents(state.avg_rate_kwh)}/kWh</strong>, running a{" "}
        {appliance.name} costs{" "}
        <strong className={isExpensive ? "text-red-600" : "text-green-600"}>
          {formatCurrency(monthly)}/month
        </strong>{" "}
        or {formatCurrency(yearly)}/year.{" "}
        {isExpensive
          ? `That's ${costDiffPct}% more than the national average of ${formatCurrency(nationalMonthly)}/month.`
          : `That's ${Math.abs(Number(costDiffPct))}% less than the national average of ${formatCurrency(nationalMonthly)}/month.`}
      </p>

      {/* Key stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Monthly Cost</p>
          <p className="text-2xl font-bold text-amber-700">{formatCurrency(monthly)}</p>
          <p className="text-xs text-slate-500">in {state.state}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Yearly Cost</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(yearly)}</p>
          <p className="text-xs text-slate-500">in {state.state}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">State Rate</p>
          <p className="text-2xl font-bold text-green-700">{formatCents(state.avg_rate_kwh)}</p>
          <p className="text-xs text-slate-500">per kWh</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">National Rank</p>
          <p className="text-2xl font-bold text-slate-700">#{rank}</p>
          <p className="text-xs text-slate-500">of 50 states</p>
        </div>
      </div>

      <AdSlot id="3456789012" />

      <PowerBillCalculator
        states={allStates.map(s => ({ abbr: s.abbr, state: s.state, avg_rate_kwh: s.avg_rate_kwh }))}
        appliances={getAllAppliances().map(a => ({ id: a.id, name: a.name, slug: a.slug, category: a.category, avg_watts: a.avg_watts, typical_hours_per_day: a.typical_hours_per_day }))}
        defaultState={state.abbr}
      />

      {/* Appliance specs */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">
          {appliance.name} Energy Usage
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-600 bg-slate-50">Wattage</td>
                <td className="px-4 py-2">{appliance.avg_watts.toLocaleString()} watts</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-600 bg-slate-50">Typical Daily Use</td>
                <td className="px-4 py-2">{appliance.typical_hours_per_day} hours/day</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-600 bg-slate-50">Daily kWh</td>
                <td className="px-4 py-2">{dailyKwh.toFixed(2)} kWh</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-600 bg-slate-50">Monthly kWh</td>
                <td className="px-4 py-2">{monthlyKwh.toFixed(1)} kWh</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-600 bg-slate-50">Category</td>
                <td className="px-4 py-2">{capitalize(appliance.category)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Cost comparison: State vs National Average */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">
          {state.state} vs National Average: {appliance.name} Costs
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Metric</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">{state.state}</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">National Avg</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Electricity Rate</td>
                <td className="px-4 py-2 text-right font-medium">{formatCents(state.avg_rate_kwh)}/kWh</td>
                <td className="px-4 py-2 text-right">{formatCents(nationalRate)}/kWh</td>
                <td className={`px-4 py-2 text-right font-medium ${isExpensive ? "text-red-600" : "text-green-600"}`}>
                  {isExpensive ? "+" : ""}{(state.avg_rate_kwh - nationalRate).toFixed(2)}&cent;
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Monthly {appliance.name} Cost</td>
                <td className="px-4 py-2 text-right font-medium">{formatCurrency(monthly)}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(nationalMonthly)}</td>
                <td className={`px-4 py-2 text-right font-medium ${isExpensive ? "text-red-600" : "text-green-600"}`}>
                  {isExpensive ? "+" : ""}{formatCurrency(costDiff)}
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Yearly {appliance.name} Cost</td>
                <td className="px-4 py-2 text-right font-medium">{formatCurrency(yearly)}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(nationalYearly)}</td>
                <td className={`px-4 py-2 text-right font-medium ${isExpensive ? "text-red-600" : "text-green-600"}`}>
                  {isExpensive ? "+" : ""}{formatCurrency(yearly - nationalYearly)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Neighboring states comparison */}
      {neighborCosts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            {appliance.name} Cost in Neighboring States
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            How does running a {appliance.name} in {state.state} compare to nearby states?
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">State</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">Rate</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">Monthly</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">Yearly</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">vs {state.abbr}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100 bg-amber-50/50">
                  <td className="px-4 py-2 font-medium">
                    {state.state} <span className="text-xs text-slate-400">(this state)</span>
                  </td>
                  <td className="px-4 py-2 text-right">{formatCents(state.avg_rate_kwh)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(monthly)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(yearly)}</td>
                  <td className="px-4 py-2 text-right text-slate-400">-</td>
                </tr>
                {neighborCosts.map((n) => {
                  const diff = n.monthly - monthly;
                  return (
                    <tr key={n.abbr} className="border-t border-slate-100">
                      <td className="px-4 py-2">
                        <a href={`/cost/${appliance.slug}-in-${n.slug}/`} className="text-amber-600 hover:underline">
                          {n.state}
                        </a>
                      </td>
                      <td className="px-4 py-2 text-right">{formatCents(n.avg_rate_kwh)}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCurrency(n.monthly)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(n.yearly)}</td>
                      <td className={`px-4 py-2 text-right font-medium ${diff > 0 ? "text-red-600" : "text-green-600"}`}>
                        {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AdSlot id="4567890123" />

      {/* State ranking for this appliance */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">
          {appliance.name} Cost: All 50 States Ranked
        </h2>
        <p className="text-sm text-slate-600 mb-3">
          {state.state} ranks #{rank} out of 50 for {appliance.name} running costs (1 = cheapest).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-slate-600">#</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600">State</th>
                <th className="text-right px-3 py-2 font-medium text-slate-600">Rate</th>
                <th className="text-right px-3 py-2 font-medium text-slate-600">Monthly</th>
                <th className="text-right px-3 py-2 font-medium text-slate-600">Yearly</th>
              </tr>
            </thead>
            <tbody>
              {statesCost.map((s, i) => (
                <tr
                  key={s.abbr}
                  className={`border-t border-slate-100 ${
                    s.abbr === state.abbr
                      ? "bg-amber-100 font-semibold"
                      : i < 5
                      ? "bg-green-50/50"
                      : i >= statesCost.length - 5
                      ? "bg-red-50/50"
                      : ""
                  }`}
                >
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <a href={`/cost/${appliance.slug}-in-${s.slug}/`} className="text-amber-600 hover:underline">
                      {s.state}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-right">{formatCents(s.avg_rate_kwh)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(s.monthly)}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(calcYearlyCost(appliance.avg_watts, appliance.typical_hours_per_day, s.avg_rate_kwh))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Energy saving tips */}
      <section className="mb-8 p-5 bg-amber-50 rounded-xl border border-amber-200">
        <h2 className="text-xl font-bold text-amber-800 mb-3">
          Save Money on {appliance.name} in {state.state}
        </h2>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
          {savingTips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </section>

      {/* Internal links */}
      <section className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Related Pages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">More about {state.state}</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <a href={`/state/${state.slug}/`} className="text-amber-600 hover:underline">
                  {state.state} Electricity Rates &amp; Costs
                </a>
              </li>
              {neighborCosts.slice(0, 3).map((n) => (
                <li key={n.abbr}>
                  <a
                    href={`/compare/${[state.slug, n.slug].sort().join("-vs-")}-electricity/`}
                    className="text-amber-600 hover:underline"
                  >
                    {state.state} vs {n.state} Electricity
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">More about {appliance.name}</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <a href={`/appliance/${appliance.slug}/`} className="text-amber-600 hover:underline">
                  {appliance.name} Running Costs (All States)
                </a>
              </li>
              <li>
                <a href="/calculator/" className="text-amber-600 hover:underline">
                  Power Bill Calculator
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-slate-50 rounded-lg border border-slate-200 p-4" open={i === 0}>
              <summary className="font-semibold text-slate-800 cursor-pointer">{faq.question}</summary>
              <p className="mt-2 text-slate-600 text-sm">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <DataFeedback />
      <FreshnessTag source="U.S. Energy Information Administration (EIA)" />
    </>
  );
}

function getApplianceSavingTips(category: string, name: string, stateName: string): string[] {
  const generalTips = [
    `Look for Energy Star certified ${name} models that use 10-50% less energy than standard models.`,
    `Consider installing solar panels in ${stateName} to offset your ${name} electricity costs.`,
    `Check if your ${stateName} utility offers time-of-use rates and run your ${name} during off-peak hours.`,
    `Ensure proper maintenance of your ${name} to keep it running at peak efficiency.`,
    `Compare electricity providers in ${stateName} if your area offers retail choice.`,
  ];

  const categoryTips: Record<string, string[]> = {
    cooling: [
      `Set your thermostat to 78F when home to reduce ${name} cooling costs by 10-15% in ${stateName}.`,
      "Use ceiling fans alongside your cooling system to feel cooler at higher thermostat settings.",
      "Keep blinds and curtains closed during peak sun hours to reduce cooling load.",
      `Seal air leaks around windows and doors to maximize ${name} efficiency in ${stateName}.`,
    ],
    heating: [
      `Lower your thermostat by 7-10F for 8 hours a day to save up to 10% on ${name} heating costs.`,
      `Use a smart thermostat to optimize ${name} usage based on your schedule in ${stateName}.`,
      "Improve home insulation in attics, walls, and floors to retain heat better.",
      "Use zone heating to warm only occupied rooms instead of your entire home.",
    ],
    kitchen: [
      `Use your ${name} efficiently by running full loads and avoiding preheating when not needed.`,
      "Consider batch cooking to reduce overall kitchen appliance running time.",
      `Match your ${name} size to your household needs - oversized appliances waste energy.`,
      "Use lids on pots and pans to cook faster and reduce energy consumption.",
    ],
    laundry: [
      `Wash with cold water when using your ${name} to save 80-90% of energy per load.`,
      `Always run full loads in your ${name} to maximize efficiency.`,
      "Clean lint filters and vents regularly for optimal performance.",
      "Consider air-drying clothes when weather permits to cut dryer costs entirely.",
    ],
    electronics: [
      `Use a smart power strip with your ${name} to eliminate phantom power draw.`,
      `Enable power-saving modes on your ${name} to reduce consumption by up to 30%.`,
      `Unplug your ${name} when not in use, especially during extended absences.`,
      "Adjust screen brightness settings to reduce power consumption.",
    ],
    lighting: [
      `Switch to LED ${name} alternatives which use 75% less energy.`,
      "Use dimmer switches, timers, or motion sensors to reduce unnecessary lighting.",
      "Maximize natural daylight to reduce reliance on electric lighting.",
      "Use task lighting instead of overhead lights for focused activities.",
    ],
  };

  const specific = categoryTips[category] || [];
  return [...specific, ...generalTips].slice(0, 8);
}
