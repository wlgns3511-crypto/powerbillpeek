"use client";

import { useState } from "react";

interface StateInfo {
  abbr: string;
  state: string;
  slug: string;
  avg_rate_kwh: number;
  avg_monthly_bill: number;
  residential_rate: number;
  commercial_rate: number;
  industrial_rate: number;
  renewable_pct: number;
  primary_source: string;
}

const SOURCE_LABELS: Record<string, string> = {
  coal: "Coal",
  gas: "Natural Gas",
  nuclear: "Nuclear",
  hydro: "Hydroelectric",
  solar: "Solar",
  wind: "Wind",
};

function fmt(n: number): string {
  return n.toFixed(2) + "¢";
}

export function CompareSelector({ states, nationalRate }: { states: StateInfo[]; nationalRate: number }) {
  const [stateA, setStateA] = useState("TX");
  const [stateB, setStateB] = useState("CA");

  const a = states.find(s => s.abbr === stateA);
  const b = states.find(s => s.abbr === stateB);

  if (!a || !b) return null;

  const rows = [
    { label: "Residential Rate", a: fmt(a.residential_rate) + "/kWh", b: fmt(b.residential_rate) + "/kWh", winner: a.residential_rate < b.residential_rate ? "a" : "b" },
    { label: "Commercial Rate", a: fmt(a.commercial_rate) + "/kWh", b: fmt(b.commercial_rate) + "/kWh", winner: a.commercial_rate < b.commercial_rate ? "a" : "b" },
    { label: "Industrial Rate", a: fmt(a.industrial_rate) + "/kWh", b: fmt(b.industrial_rate) + "/kWh", winner: a.industrial_rate < b.industrial_rate ? "a" : "b" },
    { label: "Avg Monthly Bill", a: "$" + a.avg_monthly_bill, b: "$" + b.avg_monthly_bill, winner: a.avg_monthly_bill < b.avg_monthly_bill ? "a" : "b" },
    { label: "Renewable Energy", a: a.renewable_pct + "%", b: b.renewable_pct + "%", winner: a.renewable_pct > b.renewable_pct ? "a" : "b" },
    { label: "Primary Source", a: SOURCE_LABELS[a.primary_source] || a.primary_source, b: SOURCE_LABELS[b.primary_source] || b.primary_source, winner: "" },
  ];

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">State A</label>
          <select
            value={stateA}
            onChange={(e) => setStateA(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
          >
            {states.map(s => (
              <option key={s.abbr} value={s.abbr}>{s.state}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end justify-center pb-2">
          <span className="text-xl font-bold text-slate-400">VS</span>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">State B</label>
          <select
            value={stateB}
            onChange={(e) => setStateB(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
          >
            {states.map(s => (
              <option key={s.abbr} value={s.abbr}>{s.state}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Metric</th>
              <th className="text-right px-4 py-3 font-medium text-amber-700">{a.state}</th>
              <th className="text-right px-4 py-3 font-medium text-blue-700">{b.state}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="px-4 py-2">{row.label}</td>
                <td className={`px-4 py-2 text-right font-medium ${row.winner === "a" ? "text-green-600" : ""}`}>
                  {row.a} {row.winner === "a" && <span className="text-green-500 text-xs ml-1">Better</span>}
                </td>
                <td className={`px-4 py-2 text-right font-medium ${row.winner === "b" ? "text-green-600" : ""}`}>
                  {row.b} {row.winner === "b" && <span className="text-green-500 text-xs ml-1">Better</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-3 text-sm">
        <a href={`/state/${a.slug}/`} className="text-amber-600 hover:underline">View {a.state} details</a>
        <span className="text-slate-300">|</span>
        <a href={`/state/${b.slug}/`} className="text-amber-600 hover:underline">View {b.state} details</a>
      </div>
    </div>
  );
}
