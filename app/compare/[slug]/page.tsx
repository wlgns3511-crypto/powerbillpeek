import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllStates,
  getAllAppliances,
  getStateBySlug,
  getNationalAvgRate,
  getNationalAvgBill,
  getTopComparisonPairs,
} from "@/lib/db";
import {
  formatCents,
  formatCurrency,
  formatPercent,
  calcMonthlyCost,
  getSourceLabel,
} from "@/lib/format";
import { faqSchema, breadcrumbSchema, webPageSchema } from "@/lib/schema";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { DataFeedback } from "@/components/DataFeedback";
import { FreshnessTag } from "@/components/FreshnessTag";
import { ComparisonBar } from "@/components/ComparisonBar";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function parseCompareSlug(
  slug: string
): { state1Slug: string; state2Slug: string } | null {
  // Try standard format first: state1-vs-state2-electricity
  const match = slug.match(/^(.+)-vs-(.+)-electricity$/);
  if (match) return { state1Slug: match[1], state2Slug: match[2] };

  // Fallback: try all "-vs-" split points and validate against DB
  const marker = "-vs-";
  let idx = slug.indexOf(marker);
  while (idx !== -1) {
    const s1 = slug.slice(0, idx);
    const s2 = slug.slice(idx + marker.length).replace(/-electricity$/, "");
    if (getStateBySlug(s1) && getStateBySlug(s2)) {
      return { state1Slug: s1, state2Slug: s2 };
    }
    idx = slug.indexOf(marker, idx + 1);
  }
  return null;
}

export async function generateStaticParams() {
  const pairs = getTopComparisonPairs();
  return pairs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseCompareSlug(slug);
  if (!parsed) return {};
  const state1 = getStateBySlug(parsed.state1Slug);
  const state2 = getStateBySlug(parsed.state2Slug);
  if (!state1 || !state2) return {};

  return {
    title: `${state1.state} vs ${state2.state} Electricity Rates (2026 Comparison)`,
    description: `Compare ${state1.state} (${formatCents(state1.avg_rate_kwh)}/kWh) vs ${state2.state} (${formatCents(state2.avg_rate_kwh)}/kWh) electricity rates. Side-by-side bills, renewable energy, and appliance costs.`,
    alternates: { canonical: `/compare/${slug}/` },
    openGraph: { url: `/compare/${slug}/` },
    keywords: [
      `${state1.state} vs ${state2.state} electricity`,
      `${state1.state} electricity rates`,
      `${state2.state} electricity rates`,
      `compare electricity costs`,
      `power bill comparison`,
    ],
  };
}

export default async function CompareStatePage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseCompareSlug(slug);
  if (!parsed) notFound();

  const state1 = getStateBySlug(parsed.state1Slug);
  const state2 = getStateBySlug(parsed.state2Slug);
  if (!state1 || !state2) notFound();

  const nationalRate = getNationalAvgRate();
  const nationalBill = getNationalAvgBill();
  const appliances = getAllAppliances();
  const topAppliances = appliances.slice(0, 15);

  const rateDiff = state1.avg_rate_kwh - state2.avg_rate_kwh;
  const billDiff = state1.avg_monthly_bill - state2.avg_monthly_bill;
  const cheaperState = rateDiff > 0 ? state2 : state1;
  const expensiveState = rateDiff > 0 ? state1 : state2;
  const savingsPercent = Math.abs(
    ((rateDiff / Math.max(state1.avg_rate_kwh, state2.avg_rate_kwh)) * 100)
  ).toFixed(1);

  const faqs = [
    {
      question: `Is electricity cheaper in ${state1.state} or ${state2.state}?`,
      answer: `Electricity is cheaper in ${cheaperState.state} at ${formatCents(cheaperState.avg_rate_kwh)}/kWh compared to ${expensiveState.state} at ${formatCents(expensiveState.avg_rate_kwh)}/kWh. That's a ${savingsPercent}% difference, saving about ${formatCurrency(Math.abs(billDiff))}/month on an average residential bill.`,
    },
    {
      question: `What is the average electricity bill in ${state1.state} vs ${state2.state}?`,
      answer: `The average monthly electricity bill is $${state1.avg_monthly_bill} in ${state1.state} and $${state2.avg_monthly_bill} in ${state2.state}. The national average is $${nationalBill}.`,
    },
    {
      question: `Which state uses more renewable energy, ${state1.state} or ${state2.state}?`,
      answer: `${state1.renewable_pct > state2.renewable_pct ? state1.state : state2.state} has a higher renewable energy percentage at ${formatPercent(Math.max(state1.renewable_pct, state2.renewable_pct))}, compared to ${formatPercent(Math.min(state1.renewable_pct, state2.renewable_pct))} in ${state1.renewable_pct > state2.renewable_pct ? state2.state : state1.state}.`,
    },
    {
      question: `What are the main energy sources in ${state1.state} and ${state2.state}?`,
      answer: `${state1.state} primarily uses ${getSourceLabel(state1.primary_source)}, while ${state2.state} relies on ${getSourceLabel(state2.primary_source)}.`,
    },
  ];

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
              { name: "Compare States", url: "/compare/" },
              {
                name: `${state1.state} vs ${state2.state}`,
                url: `/compare/${slug}/`,
              },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema(
              `${state1.state} vs ${state2.state} Electricity Rates`,
              `Compare electricity rates and power bills between ${state1.state} and ${state2.state}`,
              `/compare/${slug}/`
            )
          ),
        }}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Compare States", href: "/compare/" },
          { label: `${state1.state} vs ${state2.state}` },
        ]}
      />

      <h1 className="text-3xl font-bold text-amber-800 mb-2">
        {state1.state} vs {state2.state} Electricity Rates (2026)
      </h1>
      <p className="text-lg text-slate-600 mb-6">
        {cheaperState.state} has {savingsPercent}% cheaper electricity than{" "}
        {expensiveState.state}.{" "}
        {cheaperState.state} residents pay{" "}
        <strong>{formatCents(cheaperState.avg_rate_kwh)}/kWh</strong> compared
        to <strong>{formatCents(expensiveState.avg_rate_kwh)}/kWh</strong> in{" "}
        {expensiveState.state}, saving about{" "}
        <strong>{formatCurrency(Math.abs(billDiff))}/month</strong> on average.
      </p>

      {/* Side-by-side rate cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-amber-50 rounded-xl p-5 border border-amber-200 text-center">
          <h2 className="text-lg font-bold text-amber-800 mb-1">{state1.state}</h2>
          <p className="text-3xl font-bold text-amber-700">
            {formatCents(state1.avg_rate_kwh)}
          </p>
          <p className="text-sm text-slate-500">per kWh</p>
          <p className="text-lg font-semibold text-slate-700 mt-2">
            ${state1.avg_monthly_bill}/mo
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 text-center">
          <h2 className="text-lg font-bold text-blue-800 mb-1">{state2.state}</h2>
          <p className="text-3xl font-bold text-blue-700">
            {formatCents(state2.avg_rate_kwh)}
          </p>
          <p className="text-sm text-slate-500">per kWh</p>
          <p className="text-lg font-semibold text-slate-700 mt-2">
            ${state2.avg_monthly_bill}/mo
          </p>
        </div>
      </div>

      <AdSlot id="2345678901" />

      {/* Detailed comparison table */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">
          Detailed Rate Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">
                  Metric
                </th>
                <th className="text-right px-4 py-2 font-medium text-amber-700">
                  {state1.state}
                </th>
                <th className="text-right px-4 py-2 font-medium text-blue-700">
                  {state2.state}
                </th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">
                  National Avg
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Residential Rate</td>
                <td className="px-4 py-2 text-right font-medium">
                  {formatCents(state1.residential_rate)}/kWh
                </td>
                <td className="px-4 py-2 text-right font-medium">
                  {formatCents(state2.residential_rate)}/kWh
                </td>
                <td className="px-4 py-2 text-right">
                  {formatCents(nationalRate)}/kWh
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Commercial Rate</td>
                <td className="px-4 py-2 text-right">
                  {formatCents(state1.commercial_rate)}/kWh
                </td>
                <td className="px-4 py-2 text-right">
                  {formatCents(state2.commercial_rate)}/kWh
                </td>
                <td className="px-4 py-2 text-right text-slate-400">-</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Industrial Rate</td>
                <td className="px-4 py-2 text-right">
                  {formatCents(state1.industrial_rate)}/kWh
                </td>
                <td className="px-4 py-2 text-right">
                  {formatCents(state2.industrial_rate)}/kWh
                </td>
                <td className="px-4 py-2 text-right text-slate-400">-</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Avg Monthly Bill</td>
                <td className="px-4 py-2 text-right font-medium">
                  ${state1.avg_monthly_bill}
                </td>
                <td className="px-4 py-2 text-right font-medium">
                  ${state2.avg_monthly_bill}
                </td>
                <td className="px-4 py-2 text-right">${nationalBill}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Renewable Energy</td>
                <td className="px-4 py-2 text-right">
                  {formatPercent(state1.renewable_pct)}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatPercent(state2.renewable_pct)}
                </td>
                <td className="px-4 py-2 text-right">~22%</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Primary Source</td>
                <td className="px-4 py-2 text-right">
                  {getSourceLabel(state1.primary_source)}
                </td>
                <td className="px-4 py-2 text-right">
                  {getSourceLabel(state2.primary_source)}
                </td>
                <td className="px-4 py-2 text-right text-slate-400">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Visual Comparison Bars */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">Visual Rate Comparison</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "24px 0" }}>
          {state1.residential_rate != null && state2.residential_rate != null && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">Residential Rate (per kWh)</h3>
              <ComparisonBar
                bars={[{ label: state1.state, value: state1.residential_rate }, { label: state2.state, value: state2.residential_rate }]}
                format={(v) => v.toFixed(2) + "¢"}
                referenceValue={nationalRate}
              />
            </div>
          )}
          {state1.avg_monthly_bill != null && state2.avg_monthly_bill != null && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">Average Monthly Bill</h3>
              <ComparisonBar
                bars={[{ label: state1.state, value: state1.avg_monthly_bill }, { label: state2.state, value: state2.avg_monthly_bill }]}
                format={(v) => "$" + v.toLocaleString()}
                referenceValue={nationalBill}
              />
            </div>
          )}
          {state1.renewable_pct != null && state2.renewable_pct != null && (
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">Renewable Energy Share</h3>
              <ComparisonBar
                bars={[{ label: state1.state, value: state1.renewable_pct }, { label: state2.state, value: state2.renewable_pct }]}
                format={(v) => v.toFixed(1) + "%"}
              />
            </div>
          )}
        </div>
      </section>

      {/* Appliance cost comparison */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">
          Appliance Running Costs: {state1.state} vs {state2.state}
        </h2>
        <p className="text-sm text-slate-600 mb-3">
          Monthly cost to run common household appliances in each state.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">
                  Appliance
                </th>
                <th className="text-right px-4 py-2 font-medium text-amber-700">
                  {state1.abbr}
                </th>
                <th className="text-right px-4 py-2 font-medium text-blue-700">
                  {state2.abbr}
                </th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">
                  Savings
                </th>
              </tr>
            </thead>
            <tbody>
              {topAppliances.map((a) => {
                const cost1 = calcMonthlyCost(
                  a.avg_watts,
                  a.typical_hours_per_day,
                  state1.avg_rate_kwh
                );
                const cost2 = calcMonthlyCost(
                  a.avg_watts,
                  a.typical_hours_per_day,
                  state2.avg_rate_kwh
                );
                const diff = cost1 - cost2;
                return (
                  <tr key={a.slug} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <a
                        href={`/appliance/${a.slug}/`}
                        className="text-amber-600 hover:underline"
                      >
                        {a.name}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(cost1)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(cost2)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""
                      }`}
                    >
                      {diff > 0
                        ? `${state2.abbr} saves ${formatCurrency(diff)}`
                        : diff < 0
                        ? `${state1.abbr} saves ${formatCurrency(Math.abs(diff))}`
                        : "Same"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AdSlot id="3456789012" />

      {/* Summary section */}
      <section className="mb-8 p-5 bg-amber-50 rounded-xl border border-amber-200">
        <h2 className="text-xl font-bold text-amber-800 mb-2">
          Bottom Line: {state1.state} vs {state2.state}
        </h2>
        <div className="text-sm text-slate-700 space-y-2">
          <p>
            <strong>{cheaperState.state}</strong> is the more affordable state
            for electricity, with rates {savingsPercent}% lower than{" "}
            {expensiveState.state}. An average household would save about{" "}
            <strong>{formatCurrency(Math.abs(billDiff) * 12)}/year</strong> by
            living in {cheaperState.state}.
          </p>
          <p>
            {state1.state} gets its electricity primarily from{" "}
            {getSourceLabel(state1.primary_source)} with{" "}
            {formatPercent(state1.renewable_pct)} renewable, while {state2.state}{" "}
            relies on {getSourceLabel(state2.primary_source)} with{" "}
            {formatPercent(state2.renewable_pct)} renewable.
          </p>
        </div>
      </section>

      {/* Cross-links */}
      <section className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Explore More
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-slate-600 mb-2">{state1.state}</h3>
            <ul className="space-y-1">
              <li>
                <a
                  href={`/state/${state1.slug}/`}
                  className="text-amber-600 hover:underline"
                >
                  {state1.state} Electricity Rates
                </a>
              </li>
              {topAppliances.slice(0, 3).map((a) => (
                <li key={a.slug}>
                  <a
                    href={`/cost/${a.slug}-in-${state1.slug}/`}
                    className="text-amber-600 hover:underline"
                  >
                    {a.name} Cost in {state1.state}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-slate-600 mb-2">{state2.state}</h3>
            <ul className="space-y-1">
              <li>
                <a
                  href={`/state/${state2.slug}/`}
                  className="text-amber-600 hover:underline"
                >
                  {state2.state} Electricity Rates
                </a>
              </li>
              {topAppliances.slice(0, 3).map((a) => (
                <li key={a.slug}>
                  <a
                    href={`/cost/${a.slug}-in-${state2.slug}/`}
                    className="text-amber-600 hover:underline"
                  >
                    {a.name} Cost in {state2.state}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="bg-slate-50 rounded-lg border border-slate-200 p-4"
              open={i === 0}
            >
              <summary className="font-semibold text-slate-800 cursor-pointer">
                {faq.question}
              </summary>
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
