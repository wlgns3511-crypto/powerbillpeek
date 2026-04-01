import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllAppliances, getApplianceBySlug, getAllStates, getNationalAvgRate } from "@/lib/db";
import { formatCents, formatCurrency, calcMonthlyCost, calcYearlyCost, capitalize } from "@/lib/format";
import { faqSchema, breadcrumbSchema } from "@/lib/schema";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { DataFeedback } from "@/components/DataFeedback";
import { FreshnessTag } from "@/components/FreshnessTag";
import { AuthorBox } from "@/components/AuthorBox";
import { EditorNote } from "@/components/EditorNote";
import { DidYouKnow } from "@/components/DidYouKnow";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { CrossSiteLinks } from "@/components/CrossSiteLinks";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const appliances = getAllAppliances();
  return appliances.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const appliance = getApplianceBySlug(slug);
  if (!appliance) return {};
  const nationalRate = getNationalAvgRate();
  const monthly = calcMonthlyCost(appliance.avg_watts, appliance.typical_hours_per_day, nationalRate);
  return {
    title: `Cost to Run ${appliance.name} - ${formatCurrency(monthly)}/Month | PowerBillPeek`,
    description: `How much does it cost to run a ${appliance.name}? At the national average rate, it costs ${formatCurrency(monthly)}/month. See costs for all 50 states.`,
    alternates: { canonical: `/appliance/${slug}/` },
    openGraph: { url: `/appliance/${slug}/` },
  };
}

export default async function AppliancePage({ params }: PageProps) {
  const { slug } = await params;
  const appliance = getApplianceBySlug(slug);
  if (!appliance) notFound();

  const states = getAllStates();
  const nationalRate = getNationalAvgRate();
  const allAppliances = getAllAppliances();

  const nationalMonthly = calcMonthlyCost(appliance.avg_watts, appliance.typical_hours_per_day, nationalRate);
  const nationalYearly = calcYearlyCost(appliance.avg_watts, appliance.typical_hours_per_day, nationalRate);
  const dailyKwh = (appliance.avg_watts * appliance.typical_hours_per_day) / 1000;

  // Sort states by cost for this appliance
  const statesCost = states
    .map(s => ({
      ...s,
      monthly: calcMonthlyCost(appliance.avg_watts, appliance.typical_hours_per_day, s.avg_rate_kwh),
      yearly: calcYearlyCost(appliance.avg_watts, appliance.typical_hours_per_day, s.avg_rate_kwh),
    }))
    .sort((a, b) => a.monthly - b.monthly);

  const cheapestState = statesCost[0];
  const expensiveState = statesCost[statesCost.length - 1];

  const relatedAppliances = allAppliances.filter(a => a.category === appliance.category && a.slug !== appliance.slug).slice(0, 8);

  const faqs = [
    {
      question: `How much electricity does a ${appliance.name} use?`,
      answer: `A typical ${appliance.name} uses ${appliance.avg_watts} watts and runs about ${appliance.typical_hours_per_day} hours per day, consuming ${dailyKwh.toFixed(2)} kWh daily.`,
    },
    {
      question: `How much does it cost to run a ${appliance.name} per month?`,
      answer: `At the national average electricity rate of ${formatCents(nationalRate)}/kWh, running a ${appliance.name} costs approximately ${formatCurrency(nationalMonthly)} per month.`,
    },
    {
      question: `Where is it cheapest to run a ${appliance.name}?`,
      answer: `${cheapestState.state} has the lowest cost at ${formatCurrency(cheapestState.monthly)}/month, while ${expensiveState.state} is the most expensive at ${formatCurrency(expensiveState.monthly)}/month.`,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          ...faqSchema(faqs),
          dateModified: "2026-03-31",
          author: { "@type": "Organization", name: "DataPeek" },
        }) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: capitalize(appliance.category), url: "/" },
          { name: appliance.name, url: `/appliance/${slug}/` },
        ])) }}
      />

      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: capitalize(appliance.category) },
        { label: appliance.name },
      ]} />

      <h1 className="text-3xl font-bold text-amber-800 mb-2">
        Cost to Run a {appliance.name}
      </h1>
      <p className="text-lg text-slate-600 mb-4">{appliance.description}</p>

      <EditorNote note={`Electricity costs vary dramatically by state. A ${appliance.name} that costs ${formatCurrency(nationalMonthly)}/month at the national average could cost as little as ${formatCurrency(cheapestState.monthly)} in ${cheapestState.state} or as much as ${formatCurrency(expensiveState.monthly)} in ${expensiveState.state}. Always check your local utility rate for the most accurate estimate.`} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Wattage</p>
          <p className="text-2xl font-bold text-amber-700">{appliance.avg_watts.toLocaleString()}W</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Daily Usage</p>
          <p className="text-2xl font-bold text-blue-700">{appliance.typical_hours_per_day}h</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Monthly Cost*</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(nationalMonthly)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Annual Cost*</p>
          <p className="text-2xl font-bold text-slate-700">{formatCurrency(nationalYearly)}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 -mt-6 mb-6">* At national average rate of {formatCents(nationalRate)}/kWh</p>

      <AdSlot id="7890123456" />

      {/* Cost by state table */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">
          Cost to Run {appliance.name} by State
        </h2>
        <p className="text-sm text-slate-600 mb-3">
          From cheapest ({cheapestState.state}: {formatCurrency(cheapestState.monthly)}/mo) to most expensive ({expensiveState.state}: {formatCurrency(expensiveState.monthly)}/mo).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">#</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">State</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Rate</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Monthly</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Annual</th>
              </tr>
            </thead>
            <tbody>
              {statesCost.map((s, i) => (
                <tr key={s.abbr} className={`border-t border-slate-100 ${i < 5 ? "bg-green-50/50" : i >= statesCost.length - 5 ? "bg-red-50/50" : ""}`}>
                  <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-2">
                    <a href={`/state/${s.slug}/`} className="text-amber-600 hover:underline">{s.state}</a>
                  </td>
                  <td className="px-4 py-2 text-right">{formatCents(s.avg_rate_kwh)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(s.monthly)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(s.yearly)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdSlot id="8901234567" />

      {/* Energy saving tips */}
      <section className="mb-8 p-5 bg-amber-50 rounded-xl border border-amber-200">
        <h2 className="text-xl font-bold text-amber-800 mb-2">Energy Saving Tips for {appliance.name}</h2>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          {getEnergySavingTips(appliance.category, appliance.name).map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </section>

      <DidYouKnow fact={`Running a ${appliance.name} at ${appliance.avg_watts}W for ${appliance.typical_hours_per_day} hours daily uses about ${(dailyKwh * 365).toFixed(0)} kWh per year. That's roughly equivalent to driving an electric vehicle ${((dailyKwh * 365) / 3.5).toFixed(0)} miles.`} />

      {/* Related appliances */}
      {relatedAppliances.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Related {capitalize(appliance.category)} Appliances</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {relatedAppliances.map(a => {
              const monthly = calcMonthlyCost(a.avg_watts, a.typical_hours_per_day, nationalRate);
              return (
                <a key={a.slug} href={`/appliance/${a.slug}/`} className="p-3 rounded-lg border border-slate-200 hover:border-amber-300 hover:shadow-sm">
                  <p className="font-medium text-sm">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.avg_watts}W &middot; {formatCurrency(monthly)}/mo</p>
                </a>
              );
            })}
          </div>
        </section>
      )}

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

      <AuthorBox />

      <DataSourceBadge sources={[
        { name: "EIA", url: "https://www.eia.gov" },
        { name: "ENERGY STAR", url: "https://www.energystar.gov" },
      ]} />

      <CrossSiteLinks current="PowerBillPeek" />
    </>
  );
}

function getEnergySavingTips(category: string, name: string): string[] {
  const tips: Record<string, string[]> = {
    cooling: [
      "Set your thermostat to 78F when home and higher when away to reduce cooling costs by 10-15%.",
      "Use ceiling fans to create a wind-chill effect, allowing you to raise the thermostat by 4F.",
      "Keep blinds and curtains closed during peak sun hours.",
      "Ensure proper insulation and seal air leaks around windows and doors.",
      "Schedule regular maintenance to keep your cooling system running efficiently.",
      "Consider upgrading to an Energy Star rated model for 15-20% energy savings.",
    ],
    heating: [
      "Lower your thermostat by 7-10F for 8 hours a day to save up to 10% on heating costs.",
      "Use a programmable or smart thermostat to automatically adjust temperatures.",
      "Seal air leaks around windows, doors, and ductwork.",
      "Use space heaters to heat only occupied rooms rather than the entire house.",
      "Ensure proper insulation in attics, walls, and floors.",
      "Consider upgrading to a heat pump for greater efficiency.",
    ],
    kitchen: [
      "Use the microwave or toaster oven for small meals instead of the full oven.",
      "Run your dishwasher only with full loads and use the air-dry setting.",
      "Keep your refrigerator at 35-38F and freezer at 0F for optimal efficiency.",
      "Avoid opening the oven door while cooking as it drops the temperature by 25F each time.",
      "Use lids on pots to boil water faster and save energy.",
      "Consider Energy Star rated appliances when replacing old models.",
    ],
    laundry: [
      "Wash clothes in cold water to save 80-90% of the energy used for laundry.",
      "Run full loads to maximize efficiency per cycle.",
      "Clean the dryer lint filter after every load for better airflow.",
      "Consider air drying clothes when possible.",
      "Use the moisture sensor setting on your dryer to avoid over-drying.",
    ],
    electronics: [
      "Use power strips and turn them off when devices are not in use to eliminate phantom loads.",
      "Enable sleep mode or power saving settings on computers and monitors.",
      "Unplug chargers when not actively charging devices.",
      "Choose Energy Star rated electronics when purchasing new devices.",
      "Adjust screen brightness on TVs and monitors to reduce power consumption.",
    ],
    lighting: [
      "Switch to LED bulbs which use 75% less energy than incandescent bulbs.",
      "Use dimmers, timers, or motion sensors to reduce lighting waste.",
      "Take advantage of natural daylight whenever possible.",
      "Turn off lights when leaving a room.",
      "Use task lighting instead of overhead lights for focused work.",
    ],
  };
  return tips[category] || [
    `Look for Energy Star rated models when purchasing a new ${name}.`,
    "Unplug when not in use to eliminate standby power consumption.",
    "Compare your electricity rates and consider switching providers if available in your area.",
  ];
}
