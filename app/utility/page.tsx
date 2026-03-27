import type { Metadata } from "next";
import { getAllUtilities, getAllStates } from "@/lib/db";
import { formatCents, formatNumber } from "@/lib/format";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { FreshnessTag } from "@/components/FreshnessTag";

export const metadata: Metadata = {
  title: "US Electric Utilities - Rates & Customer Counts | PowerBillPeek",
  description:
    "Browse all major US electric utilities, their average electricity rates, customer counts, and service areas. Find your utility company and compare rates.",
  alternates: { canonical: "https://powerbillpeek.com/utility/" },
};

export default function UtilityListPage() {
  const utilities = getAllUtilities();
  const states = getAllStates();
  const stateMap = Object.fromEntries(states.map((s) => [s.abbr, s]));

  // Group by state
  const byState: Record<string, typeof utilities> = {};
  for (const u of utilities) {
    if (!byState[u.state]) byState[u.state] = [];
    byState[u.state].push(u);
  }
  const sortedStates = Object.keys(byState).sort();

  return (
    <>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Electric Utilities" }]}
      />

      <h1 className="text-3xl font-bold text-amber-800 mb-4">
        US Electric Utilities
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Browse {utilities.length} major US electric utilities across all 50 states.
        Find average electricity rates, customer counts, and service areas.
      </p>

      <AdSlot id="6789012345" />

      <div className="space-y-6">
        {sortedStates.map((stateAbbr) => {
          const stateData = stateMap[stateAbbr];
          const stateUtils = byState[stateAbbr];
          return (
            <section key={stateAbbr} className="mb-4">
              <h2 className="text-lg font-bold text-slate-800 mb-2">
                {stateData ? (
                  <a
                    href={`/state/${stateData.slug}/`}
                    className="text-amber-700 hover:underline"
                  >
                    {stateData.state}
                  </a>
                ) : (
                  stateAbbr
                )}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">
                        Utility
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-slate-600">
                        Rate (¢/kWh)
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-slate-600">
                        Customers
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stateUtils.map((u) => (
                      <tr
                        key={u.slug}
                        className="border-t border-slate-100 hover:bg-amber-50/30"
                      >
                        <td className="px-3 py-2">
                          <a
                            href={`/utility/${u.slug}/`}
                            className="text-amber-600 hover:underline"
                          >
                            {u.name}
                          </a>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatCents(u.avg_rate)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(u.customers)}
                        </td>
                        <td className="px-3 py-2 capitalize">{u.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      <FreshnessTag source="U.S. Energy Information Administration (EIA)" />
    </>
  );
}
