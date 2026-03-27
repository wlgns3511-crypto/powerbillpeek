import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllStates, getStateBySlug, getUtilitiesByState, getAllAppliances, getNationalAvgRate, getNationalAvgBill } from "@/lib/db";
import { formatCents, formatCurrency, formatPercent, calcMonthlyCost, getSourceLabel, getRateTextColor } from "@/lib/format";
import { faqSchema, breadcrumbSchema } from "@/lib/schema";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { DataFeedback } from "@/components/DataFeedback";
import { FreshnessTag } from "@/components/FreshnessTag";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const states = getAllStates();
  return states.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) return {};
  return {
    title: `${state.state} Electricity Rates - Average ${formatCents(state.avg_rate_kwh)}/kWh | PowerBillPeek`,
    description: `${state.state} average electricity rate is ${formatCents(state.avg_rate_kwh)}/kWh with a $${state.avg_monthly_bill}/month average bill. Compare residential, commercial, and industrial rates. View utilities and appliance costs.`,
    alternates: { canonical: `https://powerbillpeek.com/state/${slug}/` },
  };
}

export default async function StatePage({ params }: PageProps) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();

  const utilities = getUtilitiesByState(state.abbr);
  const appliances = getAllAppliances();
  const nationalRate = getNationalAvgRate();
  const nationalBill = getNationalAvgBill();
  const allStates = getAllStates();

  const rateDiff = state.avg_rate_kwh - nationalRate;
  const rateDiffPct = ((rateDiff / nationalRate) * 100).toFixed(1);
  const isExpensive = rateDiff > 0;
  const priceLevel = state.avg_rate_kwh <= 12 ? "very affordable" : state.avg_rate_kwh <= 14 ? "below average" : state.avg_rate_kwh <= 17 ? "around the national average" : state.avg_rate_kwh <= 25 ? "above average" : "among the most expensive in the nation";

  const reasonText = getReasonText(state);

  const faqs = [
    {
      question: `What is the average electricity rate in ${state.state}?`,
      answer: `The average residential electricity rate in ${state.state} is ${formatCents(state.avg_rate_kwh)} per kWh, which is ${isExpensive ? `${rateDiffPct}% above` : `${Math.abs(Number(rateDiffPct))}% below`} the national average of ${formatCents(nationalRate)}/kWh.`,
    },
    {
      question: `How much is the average monthly electric bill in ${state.state}?`,
      answer: `The average monthly residential electric bill in ${state.state} is $${state.avg_monthly_bill}, compared to the national average of $${nationalBill}.`,
    },
    {
      question: `Why is electricity ${isExpensive ? "expensive" : "cheap"} in ${state.state}?`,
      answer: reasonText,
    },
    {
      question: `What is the main energy source in ${state.state}?`,
      answer: `The primary energy source in ${state.state} is ${getSourceLabel(state.primary_source)}, with ${formatPercent(state.renewable_pct)} of electricity coming from renewable sources.`,
    },
  ];

  // Top appliances for this state
  const topAppliances = appliances.slice(0, 15);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: state.state, url: `/state/${slug}/` },
        ])) }}
      />

      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: state.state },
      ]} />

      <h1 className="text-3xl font-bold text-amber-800 mb-2">
        {state.state} Electricity Rates &amp; Utility Costs
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        The average residential electricity rate in {state.state} is{" "}
        <strong className={getRateTextColor(state.avg_rate_kwh)}>{formatCents(state.avg_rate_kwh)}/kWh</strong>,
        which is {priceLevel}.
        {isExpensive
          ? ` That's ${rateDiffPct}% higher than the national average.`
          : ` That's ${Math.abs(Number(rateDiffPct))}% lower than the national average.`}
      </p>

      {/* Rate overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Residential</p>
          <p className="text-2xl font-bold text-amber-700">{formatCents(state.residential_rate)}</p>
          <p className="text-xs text-slate-500">per kWh</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Commercial</p>
          <p className="text-2xl font-bold text-blue-700">{formatCents(state.commercial_rate)}</p>
          <p className="text-xs text-slate-500">per kWh</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Industrial</p>
          <p className="text-2xl font-bold text-slate-700">{formatCents(state.industrial_rate)}</p>
          <p className="text-xs text-slate-500">per kWh</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Avg Monthly Bill</p>
          <p className="text-2xl font-bold text-green-700">${state.avg_monthly_bill}</p>
          <p className="text-xs text-slate-500">residential</p>
        </div>
      </div>

      <AdSlot id="5678901234" />

      {/* Comparison with national average */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">{state.state} vs National Average</h2>
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
                <td className="px-4 py-2">Residential Rate</td>
                <td className="px-4 py-2 text-right font-medium">{formatCents(state.residential_rate)}/kWh</td>
                <td className="px-4 py-2 text-right">{formatCents(nationalRate)}/kWh</td>
                <td className={`px-4 py-2 text-right font-medium ${isExpensive ? "text-red-600" : "text-green-600"}`}>
                  {isExpensive ? "+" : ""}{rateDiff.toFixed(2)}¢
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Monthly Bill</td>
                <td className="px-4 py-2 text-right font-medium">${state.avg_monthly_bill}</td>
                <td className="px-4 py-2 text-right">${nationalBill}</td>
                <td className={`px-4 py-2 text-right font-medium ${state.avg_monthly_bill > nationalBill ? "text-red-600" : "text-green-600"}`}>
                  {state.avg_monthly_bill > nationalBill ? "+" : ""}{formatCurrency(state.avg_monthly_bill - nationalBill)}
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Renewable Energy</td>
                <td className="px-4 py-2 text-right font-medium">{formatPercent(state.renewable_pct)}</td>
                <td className="px-4 py-2 text-right">~22%</td>
                <td className="px-4 py-2 text-right">{state.renewable_pct > 22 ? "Above avg" : "Below avg"}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Primary Source</td>
                <td className="px-4 py-2 text-right font-medium" colSpan={3}>{getSourceLabel(state.primary_source)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Why electricity is cheap/expensive */}
      <section className="mb-8 p-5 bg-amber-50 rounded-xl border border-amber-200">
        <h2 className="text-xl font-bold text-amber-800 mb-2">
          Why Electricity Is {isExpensive ? "Expensive" : "Affordable"} in {state.state}
        </h2>
        <p className="text-slate-700 text-sm">{reasonText}</p>
      </section>

      {/* Utilities */}
      {utilities.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Utility Companies in {state.state}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Utility</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">Avg Rate</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">Customers</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Type</th>
                </tr>
              </thead>
              <tbody>
                {utilities.map(u => (
                  <tr key={u.slug} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <a href={u.website} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">{u.name}</a>
                    </td>
                    <td className="px-4 py-2 text-right">{formatCents(u.avg_rate)}/kWh</td>
                    <td className="px-4 py-2 text-right">{u.customers.toLocaleString()}</td>
                    <td className="px-4 py-2 capitalize">{u.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AdSlot id="6789012345" />

      {/* Appliance costs at this state's rate */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">
          Appliance Running Costs in {state.state}
        </h2>
        <p className="text-sm text-slate-600 mb-3">
          Based on {state.state}&apos;s residential rate of {formatCents(state.avg_rate_kwh)}/kWh.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Appliance</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Watts</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Hours/Day</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Monthly Cost</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Annual Cost</th>
              </tr>
            </thead>
            <tbody>
              {topAppliances.map(a => {
                const monthly = calcMonthlyCost(a.avg_watts, a.typical_hours_per_day, state.avg_rate_kwh);
                return (
                  <tr key={a.slug} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <a href={`/appliance/${a.slug}/`} className="text-amber-600 hover:underline">{a.name}</a>
                    </td>
                    <td className="px-4 py-2 text-right">{a.avg_watts.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{a.typical_hours_per_day}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(monthly)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(monthly * 12)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Nearby states */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">Compare With Other States</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {allStates
            .filter(s => s.abbr !== state.abbr)
            .sort(() => 0.5 - Math.random())
            .slice(0, 10)
            .map(s => (
            <a
              key={s.abbr}
              href={`/state/${s.slug}/`}
              className="p-3 text-center rounded-lg border border-slate-200 hover:border-amber-300 transition-colors"
            >
              <p className="font-semibold text-sm">{s.abbr}</p>
              <p className="text-xs text-slate-500">{formatCents(s.avg_rate_kwh)}/kWh</p>
            </a>
          ))}
        </div>
        <p className="mt-3 text-sm">
          <a href="/compare/" className="text-amber-600 hover:underline">Compare {state.state} electricity rates with any state</a>
        </p>
      </section>

      {/* Cross-references */}
      <section className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">More Data for {state.state}</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href={`https://costbycity.com`} className="text-amber-600 hover:underline">Cost of Living</a>
          <a href={`https://salarybycity.com`} className="text-amber-600 hover:underline">Salary Data</a>
          <a href={`https://propertytaxpeek.com`} className="text-amber-600 hover:underline">Property Tax</a>
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

function getReasonText(state: { state: string; primary_source: string; renewable_pct: number; avg_rate_kwh: number }): string {
  const source = getSourceLabel(state.primary_source);
  if (state.avg_rate_kwh > 25) {
    return `${state.state} has some of the highest electricity rates in the country. This is primarily due to ${state.primary_source === "solar" ? "the islands' reliance on imported fuel and limited grid infrastructure" : `high demand, aging infrastructure, and distribution costs`}. The state generates ${formatPercent(state.renewable_pct)} of its electricity from renewable sources. ${source} is the primary energy source. Residents can reduce costs by comparing electricity providers, installing solar panels, and using energy-efficient appliances.`;
  }
  if (state.avg_rate_kwh > 17) {
    return `Electricity in ${state.state} costs more than the national average, largely due to ${state.primary_source === "gas" ? "natural gas prices and distribution infrastructure costs" : `reliance on ${source} and regulatory factors`}. Renewable energy accounts for ${formatPercent(state.renewable_pct)} of the state's generation. Consumers can save by shopping for competitive electricity rates and investing in energy efficiency.`;
  }
  if (state.avg_rate_kwh > 14) {
    return `${state.state}'s electricity rates are close to the national average. The state relies primarily on ${source} for power generation, with renewable sources making up ${formatPercent(state.renewable_pct)} of the mix. Competitive market options and moderate generation costs help keep rates stable.`;
  }
  return `${state.state} enjoys some of the most affordable electricity in the US. ${state.renewable_pct > 40 ? `Abundant ${source.toLowerCase()} resources keep generation costs low.` : `Access to affordable ${source.toLowerCase()} keeps generation costs down.`} Renewable energy makes up ${formatPercent(state.renewable_pct)} of the state's electricity mix. Low rates attract energy-intensive industries and make ${state.state} a cost-effective place to live.`;
}
