import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getUtilityBySlug,
  getUtilityComparisonPairs,
  getStateByAbbr,
  getNationalAvgRate,
} from "@/lib/db";
import { formatCents, formatCurrency, formatNumber } from "@/lib/format";
import { breadcrumbSchema, webPageSchema } from "@/lib/schema";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { DataFeedback } from "@/components/DataFeedback";
import { FreshnessTag } from "@/components/FreshnessTag";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function parseUtilityCompareSlug(
  slug: string
): { util1Slug: string; util2Slug: string } | null {
  // Try all possible split points at "-vs-"
  const marker = "-vs-";
  let idx = slug.indexOf(marker);
  while (idx !== -1) {
    const util1Slug = slug.slice(0, idx);
    const util2Slug = slug.slice(idx + marker.length);
    const u1 = getUtilityBySlug(util1Slug);
    const u2 = getUtilityBySlug(util2Slug);
    if (u1 && u2) {
      return { util1Slug, util2Slug };
    }
    idx = slug.indexOf(marker, idx + 1);
  }
  return null;
}

export async function generateStaticParams() {
  const pairs = getUtilityComparisonPairs();
  return pairs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseUtilityCompareSlug(slug);
  if (!parsed) return {};
  const u1 = getUtilityBySlug(parsed.util1Slug);
  const u2 = getUtilityBySlug(parsed.util2Slug);
  if (!u1 || !u2) return {};

  return {
    title: `${u1.name} vs ${u2.name} - Electricity Rate Comparison | PowerBillPeek`,
    description: `Compare ${u1.name} (${formatCents(u1.avg_rate)}/kWh, ${formatNumber(u1.customers)} customers) vs ${u2.name} (${formatCents(u2.avg_rate)}/kWh, ${formatNumber(u2.customers)} customers). See which utility offers better rates.`,
    alternates: { canonical: `/utility-compare/${slug}/` },
    openGraph: { url: `/utility-compare/${slug}/` },
    keywords: [
      `${u1.name} vs ${u2.name}`,
      `${u1.name} electricity rate`,
      `${u2.name} electricity rate`,
      `compare electric utilities`,
      `utility rate comparison`,
    ],
  };
}

export default async function UtilityComparePage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseUtilityCompareSlug(slug);
  if (!parsed) notFound();

  const u1 = getUtilityBySlug(parsed.util1Slug);
  const u2 = getUtilityBySlug(parsed.util2Slug);
  if (!u1 || !u2) notFound();

  const state1 = getStateByAbbr(u1.state);
  const state2 = getStateByAbbr(u2.state);
  const nationalRate = getNationalAvgRate();

  const rateDiff = u1.avg_rate - u2.avg_rate;
  const cheaperUtil = rateDiff > 0 ? u2 : u1;
  const expensiveUtil = rateDiff > 0 ? u1 : u2;
  const savingsPct = Math.abs(
    (rateDiff / Math.max(u1.avg_rate, u2.avg_rate)) * 100
  ).toFixed(1);

  const monthlyDiff = Math.abs((rateDiff / 100) * 900); // 900 kWh/month

  const rows = [
    {
      label: "Avg Rate",
      v1: formatCents(u1.avg_rate) + "/kWh",
      v2: formatCents(u2.avg_rate) + "/kWh",
      nat: formatCents(nationalRate) + "/kWh",
    },
    {
      label: "Est. Monthly Bill (900 kWh)",
      v1: formatCurrency((u1.avg_rate / 100) * 900),
      v2: formatCurrency((u2.avg_rate / 100) * 900),
      nat: formatCurrency((nationalRate / 100) * 900),
    },
    {
      label: "Est. Annual Bill",
      v1: formatCurrency((u1.avg_rate / 100) * 900 * 12),
      v2: formatCurrency((u2.avg_rate / 100) * 900 * 12),
      nat: formatCurrency((nationalRate / 100) * 900 * 12),
    },
    {
      label: "Customers Served",
      v1: formatNumber(u1.customers),
      v2: formatNumber(u2.customers),
      nat: "—",
    },
    {
      label: "Service State",
      v1: state1?.state || u1.state,
      v2: state2?.state || u2.state,
      nat: "—",
    },
    {
      label: "Service Type",
      v1: u1.type === "both" ? "Electric & Gas" : u1.type === "electric" ? "Electric" : "Gas",
      v2: u2.type === "both" ? "Electric & Gas" : u2.type === "electric" ? "Electric" : "Gas",
      nat: "—",
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: "/" },
              { name: "Utility Comparison", url: "/utility-compare/" },
              {
                name: `${u1.name} vs ${u2.name}`,
                url: `/utility-compare/${slug}/`,
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
              `${u1.name} vs ${u2.name} Electricity Rates`,
              `Compare electricity rates between ${u1.name} and ${u2.name}`,
              `/utility-compare/${slug}/`
            )
          ),
        }}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Utility Comparison", href: "/utility-compare/" },
          { label: `${u1.name} vs ${u2.name}` },
        ]}
      />

      <h1 className="text-3xl font-bold text-amber-800 mb-2">
        {u1.name} vs {u2.name}
      </h1>
      <p className="text-lg text-slate-600 mb-6">
        <strong>{cheaperUtil.name}</strong> has {savingsPct}% cheaper electricity
        at {formatCents(cheaperUtil.avg_rate)}/kWh vs{" "}
        {formatCents(expensiveUtil.avg_rate)}/kWh for{" "}
        {expensiveUtil.name}. A typical customer saves about{" "}
        <strong>{formatCurrency(monthlyDiff)}/month</strong> with the cheaper
        utility.
      </p>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-amber-50 rounded-xl p-5 border border-amber-200 text-center">
          <a href={`/utility/${u1.slug}/`} className="hover:underline">
            <h2 className="text-lg font-bold text-amber-800 mb-1">{u1.name}</h2>
          </a>
          <p className="text-3xl font-bold text-amber-700">
            {formatCents(u1.avg_rate)}
          </p>
          <p className="text-sm text-slate-500">per kWh</p>
          <p className="text-sm text-slate-600 mt-2">
            {formatNumber(u1.customers)} customers
          </p>
          <p className="text-sm text-slate-600">
            {state1?.state || u1.state}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 text-center">
          <a href={`/utility/${u2.slug}/`} className="hover:underline">
            <h2 className="text-lg font-bold text-blue-800 mb-1">{u2.name}</h2>
          </a>
          <p className="text-3xl font-bold text-blue-700">
            {formatCents(u2.avg_rate)}
          </p>
          <p className="text-sm text-slate-500">per kWh</p>
          <p className="text-sm text-slate-600 mt-2">
            {formatNumber(u2.customers)} customers
          </p>
          <p className="text-sm text-slate-600">
            {state2?.state || u2.state}
          </p>
        </div>
      </div>

      <AdSlot id="7890123456" />

      {/* Comparison table */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">
          Detailed Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">
                  Metric
                </th>
                <th className="text-right px-4 py-2 font-medium text-amber-700">
                  {u1.name}
                </th>
                <th className="text-right px-4 py-2 font-medium text-blue-700">
                  {u2.name}
                </th>
                <th className="text-right px-4 py-2 font-medium text-slate-500">
                  National Avg
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-2">{row.label}</td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      i === 0 && u1.avg_rate < u2.avg_rate ? "text-green-700" : ""
                    }`}
                  >
                    {row.v1}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      i === 0 && u2.avg_rate < u1.avg_rate ? "text-green-700" : ""
                    }`}
                  >
                    {row.v2}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-500">
                    {row.nat}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Summary */}
      <section className="mb-8 p-5 bg-amber-50 rounded-xl border border-amber-200">
        <h2 className="text-xl font-bold text-amber-800 mb-2">
          Bottom Line: {u1.name} vs {u2.name}
        </h2>
        <p className="text-sm text-slate-700">
          <strong>{cheaperUtil.name}</strong> offers the lower electricity rate at{" "}
          {formatCents(cheaperUtil.avg_rate)}/kWh — {savingsPct}% cheaper than{" "}
          {expensiveUtil.name}&apos;s {formatCents(expensiveUtil.avg_rate)}/kWh. On a
          typical 900 kWh/month household, that&apos;s a savings of{" "}
          <strong>{formatCurrency(monthlyDiff)}/month</strong> or{" "}
          <strong>{formatCurrency(monthlyDiff * 12)}/year</strong>.
        </p>
      </section>

      <AdSlot id="8901234567" />

      {/* Cross-links */}
      <section className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Explore More</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href={`/utility/${u1.slug}/`} className="text-amber-600 hover:underline">
            {u1.name} Details
          </a>
          <a href={`/utility/${u2.slug}/`} className="text-amber-600 hover:underline">
            {u2.name} Details
          </a>
          {state1 && (
            <a
              href={`/state/${state1.slug}/`}
              className="text-amber-600 hover:underline"
            >
              {state1.state} Electricity Rates
            </a>
          )}
          {state2 && state2.slug !== state1?.slug && (
            <a
              href={`/state/${state2.slug}/`}
              className="text-amber-600 hover:underline"
            >
              {state2.state} Electricity Rates
            </a>
          )}
          <a href="/utility/" className="text-amber-600 hover:underline">
            All Utilities
          </a>
          <a href="/compare/" className="text-amber-600 hover:underline">
            Compare States
          </a>
        </div>
      </section>

      <DataFeedback />
      <FreshnessTag source="U.S. Energy Information Administration (EIA)" />
    </>
  );
}
