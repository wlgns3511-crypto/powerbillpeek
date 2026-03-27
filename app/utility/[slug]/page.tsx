import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllUtilities,
  getUtilityBySlug,
  getStateByAbbr,
  getUtilitiesByState,
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

export async function generateStaticParams() {
  const utilities = getAllUtilities();
  return utilities.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const utility = getUtilityBySlug(slug);
  if (!utility) return {};
  const state = getStateByAbbr(utility.state);
  return {
    title: `${utility.name} Electricity Rates & Service Area | PowerBillPeek`,
    description: `${utility.name} serves ${formatNumber(utility.customers)} customers in ${state?.state || utility.state} with an average rate of ${formatCents(utility.avg_rate)}/kWh. Learn about rates, service area, and customer resources.`,
    alternates: { canonical: `https://powerbillpeek.com/utility/${slug}/` },
    keywords: [
      `${utility.name} electricity rate`,
      `${utility.name} electric bill`,
      `${utility.name} power company`,
      `${state?.state || utility.state} electric utility`,
      `${state?.state || utility.state} electricity provider`,
    ],
  };
}

export default async function UtilityPage({ params }: PageProps) {
  const { slug } = await params;
  const utility = getUtilityBySlug(slug);
  if (!utility) notFound();

  const state = getStateByAbbr(utility.state);
  const nationalRate = getNationalAvgRate();
  const stateUtilities = getUtilitiesByState(utility.state).filter((u) => u.slug !== slug);

  const rateDiff = utility.avg_rate - nationalRate;
  const rateDiffPct = ((rateDiff / nationalRate) * 100).toFixed(1);
  const isBelowAvg = rateDiff < 0;

  const typeLabel =
    utility.type === "both"
      ? "Electric & Gas"
      : utility.type === "electric"
      ? "Electric Only"
      : "Gas Only";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: "/" },
              { name: "Utilities", url: "/utility/" },
              { name: utility.name, url: `/utility/${slug}/` },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema(
              `${utility.name} Electricity Rates`,
              `${utility.name} serves ${formatNumber(utility.customers)} customers in ${state?.state || utility.state}`,
              `/utility/${slug}/`
            )
          ),
        }}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Utilities", href: "/utility/" },
          { label: utility.name },
        ]}
      />

      <h1 className="text-3xl font-bold text-amber-800 mb-2">{utility.name}</h1>
      <p className="text-lg text-slate-600 mb-6">
        {utility.name} is a {typeLabel.toLowerCase()} utility serving{" "}
        <strong>{formatNumber(utility.customers)} customers</strong> in{" "}
        {state ? (
          <a href={`/state/${state.slug}/`} className="text-amber-600 hover:underline">
            {state.state}
          </a>
        ) : (
          utility.state
        )}
        . Average residential rate:{" "}
        <strong>{formatCents(utility.avg_rate)}/kWh</strong>
        {isBelowAvg
          ? ` (${Math.abs(Number(rateDiffPct))}% below national average)`
          : ` (${rateDiffPct}% above national average)`}
        .
      </p>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
          <p className="text-2xl font-bold text-amber-700">{formatCents(utility.avg_rate)}</p>
          <p className="text-xs text-slate-500 mt-1">per kWh</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-700">{formatNumber(utility.customers)}</p>
          <p className="text-xs text-slate-500 mt-1">customers</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
          <p className="text-2xl font-bold text-blue-700">{utility.state}</p>
          <p className="text-xs text-slate-500 mt-1">state</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
          <p className="text-lg font-bold text-green-700">{typeLabel}</p>
          <p className="text-xs text-slate-500 mt-1">service type</p>
        </div>
      </div>

      <AdSlot id="4567890123" />

      {/* Rate comparison */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">Rate Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Metric</th>
                <th className="text-right px-4 py-2 font-medium text-amber-700">{utility.name}</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">
                  {state?.state || utility.state} Avg
                </th>
                <th className="text-right px-4 py-2 font-medium text-slate-500">National Avg</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Avg Rate</td>
                <td className="px-4 py-2 text-right font-medium">
                  {formatCents(utility.avg_rate)}/kWh
                </td>
                <td className="px-4 py-2 text-right">
                  {state ? formatCents(state.avg_rate_kwh) + "/kWh" : "—"}
                </td>
                <td className="px-4 py-2 text-right">{formatCents(nationalRate)}/kWh</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Est. Monthly Bill (900 kWh)</td>
                <td className="px-4 py-2 text-right font-medium">
                  {formatCurrency((utility.avg_rate / 100) * 900)}
                </td>
                <td className="px-4 py-2 text-right">
                  {state ? formatCurrency((state.avg_rate_kwh / 100) * 900) : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatCurrency((nationalRate / 100) * 900)}
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Est. Annual Bill (900 kWh/mo)</td>
                <td className="px-4 py-2 text-right font-medium">
                  {formatCurrency((utility.avg_rate / 100) * 900 * 12)}
                </td>
                <td className="px-4 py-2 text-right">
                  {state ? formatCurrency((state.avg_rate_kwh / 100) * 900 * 12) : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatCurrency((nationalRate / 100) * 900 * 12)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* About section */}
      <section className="mb-8 p-5 bg-amber-50 rounded-xl border border-amber-200">
        <h2 className="text-xl font-bold text-amber-800 mb-2">About {utility.name}</h2>
        <div className="text-sm text-slate-700 space-y-2">
          <p>
            <strong>{utility.name}</strong> is one of the major electric utilities serving{" "}
            {state?.state || utility.state}. With {formatNumber(utility.customers)} customers, it
            ranks among the{" "}
            {utility.customers > 1000000
              ? "largest"
              : utility.customers > 500000
              ? "mid-sized"
              : "smaller"}{" "}
            utilities in the state.
          </p>
          <p>
            The utility&apos;s average rate of {formatCents(utility.avg_rate)}/kWh is{" "}
            {isBelowAvg
              ? `${Math.abs(Number(rateDiffPct))}% below`
              : `${rateDiffPct}% above`}{" "}
            the national average of {formatCents(nationalRate)}/kWh.
          </p>
          {utility.website && (
            <p>
              Visit the{" "}
              <a
                href={utility.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:underline"
              >
                official {utility.name} website
              </a>{" "}
              for current rates, outage maps, and payment options.
            </p>
          )}
        </div>
      </section>

      <AdSlot id="5678901234" />

      {/* Other utilities in the state */}
      {stateUtilities.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Other Utilities in {state?.state || utility.state}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">Utility</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-600">Rate (¢/kWh)</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-600">Customers</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">Type</th>
                </tr>
              </thead>
              <tbody>
                {stateUtilities.map((u) => (
                  <tr key={u.slug} className="border-t border-slate-100 hover:bg-amber-50/30">
                    <td className="px-3 py-2">
                      <a href={`/utility/${u.slug}/`} className="text-amber-600 hover:underline">
                        {u.name}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCents(u.avg_rate)}
                    </td>
                    <td className="px-3 py-2 text-right">{formatNumber(u.customers)}</td>
                    <td className="px-3 py-2 capitalize">{u.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Cross-links */}
      {state && (
        <section className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Explore More</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href={`/state/${state.slug}/`}
              className="text-amber-600 hover:underline"
            >
              {state.state} Electricity Rates
            </a>
            <a href="/compare/" className="text-amber-600 hover:underline">
              Compare States
            </a>
            <a href="/calculator/" className="text-amber-600 hover:underline">
              Bill Calculator
            </a>
          </div>
        </section>
      )}

      <DataFeedback />
      <FreshnessTag source="U.S. Energy Information Administration (EIA)" />
    </>
  );
}
