import type { Metadata } from "next";
import { getAllStates, getAllAppliances, getHighestRateStates, getLowestRateStates, getNationalAvgRate, getNationalAvgBill } from "@/lib/db";
import { getRateColor, formatCents, formatCurrency } from "@/lib/format";
import { datasetSchema, faqSchema } from "@/lib/schema";
import { PowerBillCalculator } from "@/components/PowerBillCalculator";
import { AdSlot } from "@/components/AdSlot";
import { FreshnessTag } from "@/components/FreshnessTag";

export const metadata: Metadata = {
  title: "US Electricity Rates & Power Bill Calculator by State | PowerBillPeek",
  description:
    "Compare electricity rates across all 50 US states. Average residential rate is 16.5¢/kWh. Use our free calculator to estimate your monthly power bill by appliance.",
  alternates: { canonical: "https://powerbillpeek.com/" },
  openGraph: { url: "/" },
};

export default function HomePage() {
  const states = getAllStates();
  const appliances = getAllAppliances();
  const mostExpensive = getHighestRateStates(5);
  const cheapest = getLowestRateStates(5);
  const nationalRate = getNationalAvgRate();
  const nationalBill = getNationalAvgBill();

  const faqs = [
    {
      question: "What is the average electricity rate in the US?",
      answer: `The national average residential electricity rate is approximately ${formatCents(nationalRate)} per kWh, with an average monthly bill of ${formatCurrency(nationalBill)}.`,
    },
    {
      question: "Which state has the cheapest electricity?",
      answer: `${cheapest[0].state} has the lowest average residential electricity rate at ${formatCents(cheapest[0].avg_rate_kwh)} per kWh.`,
    },
    {
      question: "Which state has the most expensive electricity?",
      answer: `${mostExpensive[0].state} has the highest average residential electricity rate at ${formatCents(mostExpensive[0].avg_rate_kwh)} per kWh.`,
    },
    {
      question: "How can I lower my electricity bill?",
      answer: "You can reduce your power bill by using energy-efficient appliances, installing a smart thermostat, switching to LED lighting, improving insulation, comparing electricity providers, and considering solar panel installation.",
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }}
      />

      <h1 className="text-3xl md:text-4xl font-bold text-amber-800 mb-4">
        US Electricity Rates &amp; Power Bill Calculator by State
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Compare electricity rates across all 50 states. The national average residential rate is{" "}
        <strong>{formatCents(nationalRate)}/kWh</strong> with an average monthly bill of{" "}
        <strong>{formatCurrency(nationalBill)}</strong>. Use our calculator below to estimate your power costs.
      </p>

      <AdSlot id="2345678901" />

      {/* State grid with color-coded rates */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Electricity Rates by State</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {states.map((s) => (
            <a
              key={s.abbr}
              href={`/state/${s.slug}/`}
              className="block p-3 rounded-lg border border-slate-200 hover:shadow-md transition-shadow hover:border-amber-300"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{s.abbr}</span>
                <span className={`w-3 h-3 rounded-full ${getRateColor(s.avg_rate_kwh)}`} />
              </div>
              <p className="text-lg font-bold text-slate-800">{formatCents(s.avg_rate_kwh)}</p>
              <p className="text-xs text-slate-500">{s.state}</p>
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> Cheap (&lt;12¢)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400" /> Average</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" /> Above avg</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> Expensive (&gt;25¢)</span>
        </div>
      </section>

      {/* Cheapest vs most expensive */}
      <section className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-xl font-bold text-green-700 mb-3">Top 5 Cheapest States</h2>
          <div className="space-y-2">
            {cheapest.map((s, i) => (
              <a key={s.abbr} href={`/state/${s.slug}/`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-green-600">#{i + 1}</span>
                  <div>
                    <p className="font-semibold text-slate-800">{s.state}</p>
                    <p className="text-xs text-slate-500">${s.avg_monthly_bill}/mo avg bill</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-green-600">{formatCents(s.avg_rate_kwh)}</span>
              </a>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-red-700 mb-3">Top 5 Most Expensive States</h2>
          <div className="space-y-2">
            {mostExpensive.map((s, i) => (
              <a key={s.abbr} href={`/state/${s.slug}/`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-red-600">#{i + 1}</span>
                  <div>
                    <p className="font-semibold text-slate-800">{s.state}</p>
                    <p className="text-xs text-slate-500">${s.avg_monthly_bill}/mo avg bill</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-red-600">{formatCents(s.avg_rate_kwh)}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <AdSlot id="3456789012" />

      {/* Calculator */}
      <section className="mb-12">
        <PowerBillCalculator
          states={states.map(s => ({ abbr: s.abbr, state: s.state, avg_rate_kwh: s.avg_rate_kwh }))}
          appliances={appliances.map(a => ({ id: a.id, name: a.name, slug: a.slug, category: a.category, avg_watts: a.avg_watts, typical_hours_per_day: a.typical_hours_per_day }))}
        />
      </section>

      {/* Appliance quick links */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Appliance Running Costs</h2>
        <p className="text-slate-600 mb-4">How much does it cost to run common household appliances? Click any appliance to see costs by state.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {appliances.slice(0, 20).map(a => (
            <a key={a.slug} href={`/appliance/${a.slug}/`} className="p-3 rounded-lg border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all">
              <p className="font-medium text-sm text-slate-800">{a.name}</p>
              <p className="text-xs text-slate-500">{a.avg_watts}W &middot; {a.typical_hours_per_day}h/day</p>
            </a>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          <a href="/appliance/central-air-conditioner/" className="text-amber-600 hover:underline">View all appliances</a>
        </p>
      </section>

      <AdSlot id="4567890123" />

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-slate-50 rounded-lg border border-slate-200 p-4" open={i === 0}>
              <summary className="font-semibold text-slate-800 cursor-pointer">{faq.question}</summary>
              <p className="mt-2 text-slate-600 text-sm">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Cross-references */}
      <section className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Related Resources</h2>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <a href="https://costbycity.com" className="text-amber-600 hover:underline">Cost of Living by City</a>
          <a href="https://salarybycity.com" className="text-amber-600 hover:underline">Salary Data by City</a>
          <a href="https://zippeek.com" className="text-amber-600 hover:underline">ZIP Code Data</a>
        </div>
      </section>

      <FreshnessTag source="U.S. Energy Information Administration (EIA)" />
    </>
  );
}
