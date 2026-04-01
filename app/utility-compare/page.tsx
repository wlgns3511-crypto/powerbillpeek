import type { Metadata } from "next";
import { getAllUtilities, getNationalAvgRate } from "@/lib/db";
import { formatCents, formatNumber } from "@/lib/format";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { FreshnessTag } from "@/components/FreshnessTag";

export const metadata: Metadata = {
  title: "Compare Electric Utilities - Side-by-Side Rate Comparison | PowerBillPeek",
  description:
    "Compare electricity rates between major US electric utilities side by side. Find out which utility company offers the best rates in your area.",
  alternates: { canonical: "https://powerbillpeek.com/utility-compare/" },
  openGraph: { url: "/utility-compare/" },
};

export default function UtilityCompareIndexPage() {
  const utilities = getAllUtilities();
  const nationalRate = getNationalAvgRate();
  // Top 25 utilities for comparison
  const topUtilities = utilities.slice(0, 25);

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Utility Comparison" },
        ]}
      />

      <h1 className="text-3xl font-bold text-amber-800 mb-4">
        Compare Electric Utilities
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Compare electricity rates between major US utility companies. The national
        average is <strong>{formatCents(nationalRate)}/kWh</strong>.
      </p>

      <AdSlot id="9012345678" />

      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Top Utility Comparisons
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topUtilities.slice(0, 12).flatMap((u1, i) =>
            topUtilities.slice(i + 1, i + 4).map((u2) => (
              <a
                key={`${u1.slug}-${u2.slug}`}
                href={`/utility-compare/${u1.slug}-vs-${u2.slug}/`}
                className="p-3 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <span className="text-amber-800 font-medium text-sm">{u1.name}</span>
                <span className="text-slate-500 text-xs mx-2">vs</span>
                <span className="text-amber-800 font-medium text-sm">{u2.name}</span>
              </a>
            ))
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">
          Top Utilities by Customer Count
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Utility</th>
                <th className="text-right px-3 py-2 font-medium text-slate-600">Rate</th>
                <th className="text-right px-3 py-2 font-medium text-slate-600">Customers</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600">State</th>
              </tr>
            </thead>
            <tbody>
              {topUtilities.map((u) => (
                <tr key={u.slug} className="border-t border-slate-100 hover:bg-amber-50/30">
                  <td className="px-3 py-2">
                    <a href={`/utility/${u.slug}/`} className="text-amber-600 hover:underline">
                      {u.name}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatCents(u.avg_rate)}/kWh
                  </td>
                  <td className="px-3 py-2 text-right">{formatNumber(u.customers)}</td>
                  <td className="px-3 py-2">{u.state}</td>
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
