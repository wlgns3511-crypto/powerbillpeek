import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllZipPower, getZipPowerBySlug, getStateByAbbr, getZipPowerByState, getNationalAvgRate, getNationalAvgBill, getAllAppliances } from "@/lib/db";
import { formatCents, formatCurrency, calcMonthlyCost } from "@/lib/format";
import { faqSchema, breadcrumbSchema } from "@/lib/schema";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdSlot } from "@/components/AdSlot";
import { FreshnessTag } from "@/components/FreshnessTag";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;
export const revalidate = false;

export async function generateStaticParams() {
  // Pre-render top 500 ZIPs; rest served via ISR
  const zips = getAllZipPower().slice(0, 1000);
  return zips.map((z) => ({ slug: z.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const zip = getZipPowerBySlug(slug);
  if (!zip) return {};
  return {
    title: `${zip.zip_code} ${zip.city}, ${zip.state} Electric Bill - ${formatCents(zip.avg_rate)}/kWh Rate & Cost Calculator`,
    description: `Electricity rates in ${zip.zip_code} ${zip.city}, ${zip.state}: ${formatCents(zip.avg_rate)}/kWh, $${zip.est_monthly_bill}/mo avg bill. Compare energy costs, calculate appliance running costs, and find savings. ${zip.energy_burden_pct ? `Energy burden: ${zip.energy_burden_pct}% of income.` : ""}`,
    alternates: { canonical: `/zip/${slug}/` },
    openGraph: { url: `/zip/${slug}/` },
  };
}

export default async function ZipPowerPage({ params }: PageProps) {
  const { slug } = await params;
  const zip = getZipPowerBySlug(slug);
  if (!zip) notFound();

  const state = getStateByAbbr(zip.state);
  const nationalRate = getNationalAvgRate();
  const nationalBill = getNationalAvgBill();
  const appliances = getAllAppliances().slice(0, 10);
  const nearbyZips = getZipPowerByState(zip.state).filter(z => z.zip_code !== zip.zip_code).slice(0, 10);

  const rateDiff = zip.avg_rate - nationalRate;
  const rateLabel = rateDiff > 2 ? "above" : rateDiff < -2 ? "below" : "near";

  const crumbs = [
    { label: "Home", href: "/" },
    { label: state?.state || zip.state, href: `/state/${state?.slug || zip.state.toLowerCase()}/` },
    { label: `${zip.zip_code} ${zip.city}` },
  ];

  const faqs = [
    {
      question: `What is the average electricity rate in ${zip.zip_code} ${zip.city}?`,
      answer: `The average residential electricity rate in ${zip.zip_code} ${zip.city}, ${zip.state} is ${formatCents(zip.avg_rate)} per kWh, which is ${rateLabel} the national average of ${formatCents(nationalRate)}/kWh.`,
    },
    {
      question: `How much is the average electric bill in ${zip.zip_code}?`,
      answer: `The estimated average monthly electricity bill in ${zip.zip_code} ${zip.city} is $${zip.est_monthly_bill}, or about $${zip.est_annual_cost} per year.`,
    },
    {
      question: `What is the energy burden in ${zip.zip_code}?`,
      answer: zip.energy_burden_pct
        ? `The energy burden in ${zip.zip_code} ${zip.city} is approximately ${zip.energy_burden_pct}% of median household income ($${zip.median_income?.toLocaleString()}/year).`
        : `Energy burden data is not available for ${zip.zip_code}.`,
    },
  ];

  return (
    <article className="max-w-4xl mx-auto">
      <Breadcrumb items={crumbs} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema(crumbs.map(c => ({ name: c.label, url: c.href || "" })))),
        }}
      />

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-amber-700 mb-3">
          Electricity Cost in {zip.zip_code} {zip.city}, {zip.state}
        </h1>
        <FreshnessTag source="U.S. Energy Information Administration (EIA)" />
      </header>

      <AdSlot id="top" />

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{formatCents(zip.avg_rate)}</div>
          <div className="text-xs text-slate-500">per kWh</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">${zip.est_monthly_bill}</div>
          <div className="text-xs text-slate-500">avg monthly bill</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">${zip.est_annual_cost}</div>
          <div className="text-xs text-slate-500">annual cost</div>
        </div>
        {zip.energy_burden_pct ? (
          <div className="bg-amber-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{zip.energy_burden_pct}%</div>
            <div className="text-xs text-slate-500">energy burden</div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-400">N/A</div>
            <div className="text-xs text-slate-500">energy burden</div>
          </div>
        )}
      </div>

      {/* Rate comparison */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Rate Comparison</h2>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold">Location</th>
                <th className="px-4 py-3 text-right font-semibold">Rate (¢/kWh)</th>
                <th className="px-4 py-3 text-right font-semibold">Monthly Bill</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-amber-50 font-medium">
                <td className="px-4 py-3">{zip.zip_code} {zip.city}</td>
                <td className="px-4 py-3 text-right">{formatCents(zip.avg_rate)}</td>
                <td className="px-4 py-3 text-right">${zip.est_monthly_bill}</td>
              </tr>
              {state && (
                <tr>
                  <td className="px-4 py-3">{state.state} (state avg)</td>
                  <td className="px-4 py-3 text-right">{formatCents(state.avg_rate_kwh)}</td>
                  <td className="px-4 py-3 text-right">${state.avg_monthly_bill}</td>
                </tr>
              )}
              <tr className="border-t">
                <td className="px-4 py-3">National Average</td>
                <td className="px-4 py-3 text-right">{formatCents(nationalRate)}</td>
                <td className="px-4 py-3 text-right">${nationalBill}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Energy burden explanation */}
      {zip.energy_burden_pct && zip.median_income > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Energy Burden</h2>
          <p className="text-slate-700 leading-relaxed">
            Households in {zip.zip_code} {zip.city} spend approximately {zip.energy_burden_pct}% of their
            median income (${zip.median_income.toLocaleString()}/year) on electricity. The U.S. Department of Energy
            considers an energy burden above 6% to be &quot;high.&quot;
            {zip.energy_burden_pct > 6
              ? ` At ${zip.energy_burden_pct}%, this ZIP code has a high energy burden.`
              : ` At ${zip.energy_burden_pct}%, this ZIP code is within the affordable range.`}
          </p>
        </section>
      )}

      <AdSlot id="middle" />

      {/* Appliance costs */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Appliance Running Costs in {zip.zip_code}
        </h2>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold">Appliance</th>
                <th className="px-4 py-3 text-right font-semibold">Watts</th>
                <th className="px-4 py-3 text-right font-semibold">Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              {appliances.map((a, i) => (
                <tr key={a.slug} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="px-4 py-2">
                    <a href={`/appliance/${a.slug}/`} className="text-amber-700 hover:underline">
                      {a.name}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-right text-slate-600">{a.avg_watts}W</td>
                  <td className="px-4 py-2 text-right font-medium">
                    ${calcMonthlyCost(a.avg_watts, a.typical_hours_per_day, zip.avg_rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Based on {formatCents(zip.avg_rate)}/kWh electricity rate and typical daily usage hours.
        </p>
      </section>

      {/* Nearby ZIP codes */}
      {nearbyZips.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Other ZIP Codes in {state?.state || zip.state}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {nearbyZips.map((nz) => (
              <a
                key={nz.zip_code}
                href={`/zip/${nz.slug}/`}
                className="block p-3 border border-slate-200 rounded-lg hover:border-amber-300 hover:shadow-sm transition-all text-sm"
              >
                <span className="font-medium text-amber-700">{nz.zip_code}</span>{" "}
                <span className="text-slate-600">{nz.city}</span>
                <div className="text-xs text-slate-400 mt-1">${nz.est_monthly_bill}/mo</div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Compare with other ZIPs in same state */}
      {nearbyZips.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Compare {zip.zip_code} Electricity Rates
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            See how {zip.zip_code} {zip.city} compares with other ZIP codes in {state?.state || zip.state}.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {nearbyZips.slice(0, 6).map((nz) => {
              const diff = nz.avg_rate - zip.avg_rate;
              const diffLabel = diff > 0 ? `${formatCents(Math.abs(diff))} higher` : diff < 0 ? `${formatCents(Math.abs(diff))} lower` : "same rate";
              return (
                <a
                  key={nz.zip_code}
                  href={`/zip/${nz.slug}/`}
                  className="flex justify-between items-center p-3 border border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-all text-sm"
                >
                  <span>
                    <span className="font-medium text-amber-700">{zip.zip_code} vs {nz.zip_code}</span>{" "}
                    <span className="text-slate-500">{nz.city}</span>
                  </span>
                  <span className={`text-xs font-medium ${diff > 0 ? "text-red-600" : diff < 0 ? "text-green-600" : "text-slate-500"}`}>
                    {diffLabel}
                  </span>
                </a>
              );
            })}
          </div>
          {state && (
            <p className="text-xs text-slate-400 mt-3">
              <a href={`/compare/${state.slug}-vs-${state.slug}-electricity/`} className="text-amber-600 hover:underline">
                Compare {state.state} with other states
              </a>
            </p>
          )}
        </section>
      )}

      <AdSlot id="bottom" />

      {/* FAQ */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details key={faq.question} className="border border-slate-200 rounded-lg">
              <summary className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-50">
                {faq.question}
              </summary>
              <p className="px-4 pb-3 text-sm text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}
