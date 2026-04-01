import type { Metadata } from "next";
import { getAllStates, getHighestRateStates, getLowestRateStates, getNationalAvgRate, getNationalAvgBill } from "@/lib/db";
import { formatCents, formatCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "PowerBillPeek - Tarifas de Electricidad por Estado en EE.UU.",
  description: "Compare tarifas de electricidad en los 50 estados de EE.UU. Calcule su factura mensual de energ&iacute;a.",
  alternates: {
    canonical: "/es/",
    languages: { en: "/", es: "/es/", "x-default": "/" },
  },
  openGraph: { url: "/es/" },
};

export default function HomeEs() {
  const states = getAllStates();
  const mostExpensive = getHighestRateStates(5);
  const cheapest = getLowestRateStates(5);
  const nationalRate = getNationalAvgRate();
  const nationalBill = getNationalAvgBill();

  return (
    <>
      <h1 className="text-3xl font-bold text-amber-800 mb-4">
        Tarifas de Electricidad por Estado en EE.UU.
      </h1>
      <p className="text-slate-600 mb-2">
        Compare tarifas de electricidad en los 50 estados. Tarifa promedio nacional: {formatCents(nationalRate)}/kWh.
        Factura mensual promedio: {formatCurrency(nationalBill)}.
      </p>
      <p className="text-xs text-slate-400 mb-8">
        <a href="/" className="text-blue-500 hover:underline">English version</a>
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <section>
          <h2 className="text-xl font-bold mb-4 text-red-700">Estados M&aacute;s Caros</h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {mostExpensive.map((s, i) => (
              <a
                key={s.abbr}
                href={`/es/state/${s.slug}/`}
                className="flex justify-between items-center p-3 hover:bg-slate-50 border-b border-slate-100"
              >
                <span className="text-sm">
                  <span className="text-slate-400 mr-2">{i + 1}.</span>
                  {s.state}
                </span>
                <span className="text-sm font-medium text-red-600">{formatCents(s.avg_rate_kwh)}/kWh</span>
              </a>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-4 text-green-700">Estados M&aacute;s Econ&oacute;micos</h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {cheapest.map((s, i) => (
              <a
                key={s.abbr}
                href={`/es/state/${s.slug}/`}
                className="flex justify-between items-center p-3 hover:bg-slate-50 border-b border-slate-100"
              >
                <span className="text-sm">
                  <span className="text-slate-400 mr-2">{i + 1}.</span>
                  {s.state}
                </span>
                <span className="text-sm font-medium text-green-600">{formatCents(s.avg_rate_kwh)}/kWh</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      {/* Todos los estados */}
      <section>
        <h2 className="text-xl font-bold mb-4">Todos los Estados</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {states.map((s) => (
            <a
              key={s.abbr}
              href={`/es/state/${s.slug}/`}
              className="p-3 border border-slate-200 rounded-lg hover:border-amber-300 hover:shadow-sm transition-all text-center"
            >
              <div className="font-semibold text-sm">{s.abbr}</div>
              <div className="text-xs text-slate-500">{formatCents(s.avg_rate_kwh)}/kWh</div>
              <div className="text-xs text-slate-400">${s.avg_monthly_bill}/mes</div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
