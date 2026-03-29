import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllStates, getStateBySlug, getNationalAvgRate, getNationalAvgBill } from "@/lib/db";
import { formatCents, formatCurrency, formatPercent, getSourceLabel, getRateTextColor } from "@/lib/format";

export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return getAllStates().slice(0, 300).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) return {};
  return {
    title: `Tarifas de Electricidad en ${state.state} - ${formatCents(state.avg_rate_kwh)}/kWh`,
    description: `Tarifa residencial en ${state.state}: ${formatCents(state.avg_rate_kwh)}/kWh ($${state.avg_monthly_bill}/mes). Compare tarifas, energ&iacute;a renovable y costos.`,
    alternates: {
      canonical: `/es/state/${slug}/`,
      languages: { en: `/state/${slug}/`, es: `/es/state/${slug}/`, "x-default": `/state/${slug}/` },
    },
  };
}

export default async function StatePageEs({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();

  const nationalRate = getNationalAvgRate();
  const nationalBill = getNationalAvgBill();
  const rateDiff = state.avg_rate_kwh - nationalRate;
  const rateDiffPct = ((rateDiff / nationalRate) * 100).toFixed(1);
  const isExpensive = rateDiff > 0;

  return (
    <>
      <nav className="text-sm text-slate-500 mb-4">
        <a href="/es/" className="hover:text-amber-600">Inicio</a>
        {" > "}
        <span>{state.state}</span>
      </nav>

      <h1 className="text-3xl font-bold text-amber-800 mb-2">
        Tarifas de Electricidad en {state.state}
      </h1>
      <p className="text-lg text-slate-600 mb-2">
        La tarifa residencial promedio en {state.state} es{" "}
        <strong className={getRateTextColor(state.avg_rate_kwh)}>{formatCents(state.avg_rate_kwh)}/kWh</strong>.
        {isExpensive
          ? ` Eso es ${rateDiffPct}% m&aacute;s alto que el promedio nacional.`
          : ` Eso es ${Math.abs(Number(rateDiffPct))}% m&aacute;s bajo que el promedio nacional.`}
      </p>
      <p className="text-xs text-slate-400 mb-6">
        <a href={`/state/${slug}/`} className="text-blue-500 hover:underline">English version</a>
      </p>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Residencial</p>
          <p className="text-2xl font-bold text-amber-700">{formatCents(state.residential_rate)}</p>
          <p className="text-xs text-slate-500">por kWh</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Comercial</p>
          <p className="text-2xl font-bold text-blue-700">{formatCents(state.commercial_rate)}</p>
          <p className="text-xs text-slate-500">por kWh</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Industrial</p>
          <p className="text-2xl font-bold text-slate-700">{formatCents(state.industrial_rate)}</p>
          <p className="text-xs text-slate-500">por kWh</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Factura Mensual</p>
          <p className="text-2xl font-bold text-green-700">${state.avg_monthly_bill}</p>
          <p className="text-xs text-slate-500">residencial</p>
        </div>
      </div>

      {/* Comparaci&oacute;n con promedio nacional */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-3">{state.state} vs Promedio Nacional</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">M&eacute;trica</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">{state.state}</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Prom. Nacional</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Tarifa Residencial</td>
                <td className="px-4 py-2 text-right font-medium">{formatCents(state.residential_rate)}/kWh</td>
                <td className="px-4 py-2 text-right">{formatCents(nationalRate)}/kWh</td>
                <td className={`px-4 py-2 text-right font-medium ${isExpensive ? "text-red-600" : "text-green-600"}`}>
                  {isExpensive ? "+" : ""}{rateDiff.toFixed(2)}&cent;
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Factura Mensual</td>
                <td className="px-4 py-2 text-right font-medium">${state.avg_monthly_bill}</td>
                <td className="px-4 py-2 text-right">${nationalBill}</td>
                <td className={`px-4 py-2 text-right font-medium ${state.avg_monthly_bill > nationalBill ? "text-red-600" : "text-green-600"}`}>
                  {state.avg_monthly_bill > nationalBill ? "+" : ""}{formatCurrency(state.avg_monthly_bill - nationalBill)}
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Energ&iacute;a Renovable</td>
                <td className="px-4 py-2 text-right font-medium">{formatPercent(state.renewable_pct)}</td>
                <td className="px-4 py-2 text-right">~22%</td>
                <td className="px-4 py-2 text-right">{state.renewable_pct > 22 ? "Sobre prom." : "Bajo prom."}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">Fuente Principal</td>
                <td className="px-4 py-2 text-right font-medium" colSpan={3}>{getSourceLabel(state.primary_source)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 p-4 bg-slate-50 rounded-lg">
        <h3 className="text-sm font-semibold text-slate-500 mb-2">Recursos Relacionados</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="https://sunpowerpeek.com" className="text-amber-600 hover:underline">Ahorro de Energ&iacute;a Solar</a>
          <a href="https://propertytaxpeek.com" className="text-amber-600 hover:underline">Impuestos a la Propiedad</a>
        </div>
      </section>
    </>
  );
}
