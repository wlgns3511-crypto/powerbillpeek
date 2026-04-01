import type { Metadata } from "next";
import { getAllStates, getNationalAvgRate } from "@/lib/db";
import { formatCents, formatCurrency, getSourceLabel, formatPercent } from "@/lib/format";
import { itemListSchema } from "@/lib/schema";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { FreshnessTag } from "@/components/FreshnessTag";
import { CompareSelector } from "./CompareSelector";

export const metadata: Metadata = {
  title: "Compare Electricity Rates Between States | PowerBillPeek",
  description: "Compare electricity rates, monthly bills, and energy costs between any two US states side by side. Texas vs California, New York vs Florida, and more.",
  alternates: { canonical: "https://powerbillpeek.com/compare/" },
  openGraph: { url: "/compare/" },
};

export default function ComparePage() {
  const states = getAllStates();
  const nationalRate = getNationalAvgRate();

  // Pre-render a full ranking table
  const sorted = [...states].sort((a, b) => a.avg_rate_kwh - b.avg_rate_kwh);

  const listItems = sorted.map(s => ({ name: s.state, url: `/state/${s.slug}/` }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema('US States Ranked by Electricity Rate', '/compare', listItems)) }} />
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Compare States" },
      ]} />

      <h1 className="text-3xl font-bold text-amber-800 mb-4">
        Compare Electricity Rates Between States
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Select two states to compare their electricity rates, average monthly bills, and energy profiles side by side.
      </p>

      <CompareSelector
        states={states.map(s => ({
          abbr: s.abbr,
          state: s.state,
          slug: s.slug,
          avg_rate_kwh: s.avg_rate_kwh,
          avg_monthly_bill: s.avg_monthly_bill,
          residential_rate: s.residential_rate,
          commercial_rate: s.commercial_rate,
          industrial_rate: s.industrial_rate,
          renewable_pct: s.renewable_pct,
          primary_source: s.primary_source,
        }))}
        nationalRate={nationalRate}
      />

      <AdSlot id="9012345678" />

      {/* Full ranking */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">All 50 States Ranked by Electricity Rate</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-slate-600">#</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600">State</th>
                <th className="text-right px-3 py-2 font-medium text-slate-600">Rate (¢/kWh)</th>
                <th className="text-right px-3 py-2 font-medium text-slate-600">Avg Bill</th>
                <th className="text-right px-3 py-2 font-medium text-slate-600">Renewable %</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Primary Source</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.abbr} className="border-t border-slate-100 hover:bg-amber-50/30">
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <a href={`/state/${s.slug}/`} className="text-amber-600 hover:underline">{s.state}</a>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{formatCents(s.avg_rate_kwh)}</td>
                  <td className="px-3 py-2 text-right">${s.avg_monthly_bill}</td>
                  <td className="px-3 py-2 text-right">{formatPercent(s.renewable_pct)}</td>
                  <td className="px-3 py-2">{getSourceLabel(s.primary_source)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <FreshnessTag source="U.S. Energy Information Administration (EIA)" />
    </>
  );
}
