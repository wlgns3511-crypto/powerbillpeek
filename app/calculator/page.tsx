import type { Metadata } from "next";
import { getAllStates, getAllAppliances } from "@/lib/db";
import { PowerBillCalculator } from "@/components/PowerBillCalculator";
import { EmbedButton } from "@/components/EmbedButton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { FreshnessTag } from "@/components/FreshnessTag";

export const metadata: Metadata = {
  title: "Power Bill Calculator - Estimate Your Monthly Electricity Cost | PowerBillPeek",
  description: "Free power bill calculator. Select your state and appliances to estimate your monthly electricity cost. Compare costs across all 50 US states.",
  alternates: { canonical: "https://powerbillpeek.com/calculator/" },
};

export default function CalculatorPage() {
  const states = getAllStates();
  const appliances = getAllAppliances();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Power Bill Calculator",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Web",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "150" }
          })
        }}
      />
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Power Bill Calculator" },
      ]} />

      <h1 className="text-3xl font-bold text-amber-800 mb-4">
        Power Bill Calculator
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Estimate your monthly electricity cost based on your state&apos;s rates and the appliances you use.
        Select your state, check the appliances in your home, and see your estimated monthly and annual power costs.
      </p>

      <PowerBillCalculator
        states={states.map(s => ({ abbr: s.abbr, state: s.state, avg_rate_kwh: s.avg_rate_kwh }))}
        appliances={appliances.map(a => ({ id: a.id, name: a.name, slug: a.slug, category: a.category, avg_watts: a.avg_watts, typical_hours_per_day: a.typical_hours_per_day }))}
      />

      <EmbedButton
        url="https://powerbillpeek.com/embed/power-calc/"
        title="Power Bill Calculator"
        site="PowerBillPeek"
        siteUrl="https://powerbillpeek.com"
      />

      <AdSlot id="1234567890" />

      <section className="mt-8 prose prose-slate max-w-3xl">
        <h2 className="text-xl font-bold text-slate-800 mb-3">How to Use This Calculator</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
          <li><strong>Select your state</strong> from the dropdown to use your local electricity rate.</li>
          <li><strong>Check the appliances</strong> you use in your home. Each appliance has a typical wattage and daily usage hours.</li>
          <li><strong>Add custom appliances</strong> by entering the wattage and hours per day for any devices not listed.</li>
          <li>View your <strong>estimated monthly and annual costs</strong>, broken down by appliance and category.</li>
          <li>Compare your costs to the <strong>national average</strong> to see if you&apos;re paying more or less.</li>
        </ol>

        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-3">Understanding Your Power Bill</h2>
        <p className="text-sm text-slate-600">
          Your electricity bill is determined by how much energy you use (measured in kilowatt-hours or kWh) and your
          utility&apos;s rate per kWh. The formula is: <strong>Monthly Cost = (Watts x Hours/Day x 30) / 1000 x Rate/kWh</strong>.
          Major factors that affect your bill include climate (heating and cooling needs), home size, insulation quality,
          appliance efficiency, and your electricity rate.
        </p>

        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-3">Tips to Lower Your Power Bill</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
          <li>Compare electricity providers in deregulated states for better rates.</li>
          <li>Invest in a smart thermostat to optimize heating and cooling schedules.</li>
          <li>Upgrade to LED lighting throughout your home.</li>
          <li>Consider solar panel installation to offset grid electricity usage.</li>
          <li>Schedule a professional home energy audit to identify efficiency improvements.</li>
          <li>Use energy-efficient appliances with Energy Star certification.</li>
        </ul>
      </section>

      <FreshnessTag source="U.S. Energy Information Administration (EIA)" />
    </>
  );
}
