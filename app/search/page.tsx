import Link from "next/link";
import { searchPowerBill } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Electricity Costs - PowerBillPeek",
  description: "Search states, appliances, and utilities for electricity cost and rate data in the PowerBillPeek database.",
  alternates: { canonical: "https://powerbillpeek.com/search/" },
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query.length >= 2 ? searchPowerBill(query) : null;
  const totalResults = results
    ? results.states.length + results.appliances.length + results.utilities.length
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Search Electricity Cost Data</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Search states, appliances, and utilities for electricity rates and cost data.
      </p>

      <form method="GET" action="/search/" className="mb-8">
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="e.g. Texas, refrigerator, air conditioner, Pacific Gas..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            autoFocus
          />
          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-gray-500">Please enter at least 2 characters to search.</p>
      )}

      {results && totalResults === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium mb-1">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-sm">Try searching for a state name, appliance type, or utility company.</p>
        </div>
      )}

      {results && totalResults > 0 && (
        <div className="space-y-8">
          <p className="text-sm text-gray-500">
            Found {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>

          {results.states.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-amber-700 mb-3 uppercase tracking-wider">States</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {results.states.map((s) => (
                  <Link
                    key={s.abbr}
                    href={`/state/${s.slug}/`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                      {s.abbr}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{s.state}</p>
                      <p className="text-xs text-gray-500">{s.avg_rate_kwh.toFixed(2)}¢/kWh avg rate</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.appliances.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-amber-700 mb-3 uppercase tracking-wider">Appliances</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {results.appliances.map((a) => (
                  <Link
                    key={a.id}
                    href={`/appliance/${a.slug}/`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">
                      ⚡
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{a.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{a.category} &middot; {a.avg_watts}W</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.utilities.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-amber-700 mb-3 uppercase tracking-wider">Utilities</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {results.utilities.map((u) => (
                  <Link
                    key={u.id}
                    href={`/utility/${u.slug}/`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                      {u.state}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.state} &middot; {u.customers.toLocaleString()} customers</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {!query && (
        <div className="mt-4">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Popular Searches</h2>
          <div className="flex flex-wrap gap-2">
            {["Texas", "California", "Hawaii", "refrigerator", "air conditioner", "EV charger", "heat pump", "washer dryer"].map((term) => (
              <Link
                key={term}
                href={`/search/?q=${encodeURIComponent(term)}`}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm hover:bg-amber-100 transition-colors border border-amber-200"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
