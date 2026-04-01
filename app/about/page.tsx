import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About PowerBillPeek",
  description: "Learn about PowerBillPeek, our mission, and data sources for US electricity rates.",
  alternates: { canonical: "/about/" },
  openGraph: { url: "/about/" },
};

export default function AboutPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-700 mb-6">About PowerBillPeek</h1>

      <p>
        PowerBillPeek is a free resource that helps homeowners, renters, and businesses understand electricity
        costs across the United States. We provide detailed electricity rate data for all 50 states, appliance
        running cost estimates, and tools to help you reduce your power bill.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Our Mission</h2>
      <p>
        We believe energy cost transparency empowers better decisions. Whether you are considering a move to a
        new state, evaluating solar panel installation, comparing electricity providers, or simply trying to
        understand your monthly power bill, PowerBillPeek provides the data you need.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Data Sources</h2>
      <p>
        All electricity rate data on this site comes from the <strong>U.S. Energy Information Administration (EIA)</strong>,
        specifically the Electric Power Monthly report. The EIA collects data from electric utilities, power
        producers, and regulatory agencies to provide comprehensive energy statistics. Appliance wattage data
        is sourced from Department of Energy publications and manufacturer specifications. We update our data
        regularly to ensure accuracy.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact Us</h2>
      <p>
        Have questions or feedback? Visit our <a href="/contact" className="text-amber-600 hover:underline">Contact page</a> to get in touch.
      </p>
    </article>
  );
}
