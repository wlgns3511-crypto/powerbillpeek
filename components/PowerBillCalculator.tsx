"use client";

import { useState, useMemo } from "react";

interface StateOption {
  abbr: string;
  state: string;
  avg_rate_kwh: number;
}

interface ApplianceOption {
  id: number;
  name: string;
  slug: string;
  category: string;
  avg_watts: number;
  typical_hours_per_day: number;
}

interface Props {
  states: StateOption[];
  appliances: ApplianceOption[];
  defaultState?: string;
}

const NATIONAL_AVG = 16.5;

const CATEGORY_COLORS: Record<string, string> = {
  cooling: "bg-blue-400",
  heating: "bg-red-400",
  kitchen: "bg-orange-400",
  laundry: "bg-purple-400",
  electronics: "bg-cyan-400",
  lighting: "bg-yellow-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  cooling: "Cooling",
  heating: "Heating",
  kitchen: "Kitchen",
  laundry: "Laundry",
  electronics: "Electronics",
  lighting: "Lighting",
};

function fmt(n: number): string {
  return "$" + n.toFixed(2);
}

export function PowerBillCalculator({ states, appliances, defaultState }: Props) {
  const [selectedState, setSelectedState] = useState(defaultState || "TX");
  const [selectedAppliances, setSelectedAppliances] = useState<Set<number>>(new Set([
    appliances.find(a => a.slug === "refrigerator")?.id,
    appliances.find(a => a.slug === "led-tv-55-inch")?.id,
    appliances.find(a => a.slug === "washing-machine")?.id,
    appliances.find(a => a.slug === "central-air-conditioner")?.id,
    appliances.find(a => a.slug === "wi-fi-router")?.id,
  ].filter(Boolean) as number[]));
  const [customWatts, setCustomWatts] = useState(0);
  const [customHours, setCustomHours] = useState(0);
  const [daysPerMonth, setDaysPerMonth] = useState(30);

  const stateData = states.find(s => s.abbr === selectedState);
  const rate = stateData?.avg_rate_kwh || NATIONAL_AVG;

  const toggleAppliance = (id: number) => {
    setSelectedAppliances(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const results = useMemo(() => {
    const items: { name: string; category: string; monthlyCost: number }[] = [];

    for (const app of appliances) {
      if (!selectedAppliances.has(app.id)) continue;
      const kwhPerMonth = (app.avg_watts * app.typical_hours_per_day * daysPerMonth) / 1000;
      const monthlyCost = kwhPerMonth * (rate / 100);
      items.push({ name: app.name, category: app.category, monthlyCost });
    }

    if (customWatts > 0 && customHours > 0) {
      const kwhPerMonth = (customWatts * customHours * daysPerMonth) / 1000;
      const monthlyCost = kwhPerMonth * (rate / 100);
      items.push({ name: "Custom Appliance", category: "electronics", monthlyCost });
    }

    return items;
  }, [appliances, selectedAppliances, customWatts, customHours, daysPerMonth, rate]);

  const totalMonthly = results.reduce((sum, r) => sum + r.monthlyCost, 0);
  const totalAnnual = totalMonthly * 12;
  const nationalMonthly = results.reduce((sum, r) => {
    const app = appliances.find(a => a.name === r.name);
    if (!app) return sum + r.monthlyCost * (NATIONAL_AVG / rate);
    const kwh = (app.avg_watts * app.typical_hours_per_day * daysPerMonth) / 1000;
    return sum + kwh * (NATIONAL_AVG / 100);
  }, 0);
  const savings = nationalMonthly - totalMonthly;

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const r of results) {
      totals[r.category] = (totals[r.category] || 0) + r.monthlyCost;
    }
    return totals;
  }, [results]);

  const categories = [...new Set(appliances.map(a => a.category))];

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 my-8 border border-amber-200">
      <h2 className="text-xl font-bold text-amber-900 mb-2">Power Bill Calculator</h2>
      <p className="text-sm text-slate-600 mb-4">
        Estimate your monthly electricity cost based on your state and the appliances you use.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
          >
            {states.map(s => (
              <option key={s.abbr} value={s.abbr}>{s.state} ({s.avg_rate_kwh}¢/kWh)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Custom Wattage</label>
          <input
            type="number"
            value={customWatts || ""}
            onChange={(e) => setCustomWatts(Number(e.target.value))}
            placeholder="e.g. 1500"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Hours / Day (Custom)</label>
          <input
            type="number"
            value={customHours || ""}
            onChange={(e) => setCustomHours(Number(e.target.value))}
            placeholder="e.g. 8"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            min={0}
            max={24}
            step={0.5}
          />
        </div>
      </div>

      {/* Appliance checkboxes by category */}
      <div className="mb-6 space-y-3">
        {categories.map(cat => (
          <details key={cat} open={cat === "kitchen" || cat === "cooling"}>
            <summary className="cursor-pointer text-sm font-semibold text-slate-700 select-none">
              {CATEGORY_LABELS[cat] || cat} ({appliances.filter(a => a.category === cat).length} appliances)
            </summary>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 mt-2 pl-2">
              {appliances.filter(a => a.category === cat).map(app => (
                <label key={app.id} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAppliances.has(app.id)}
                    onChange={() => toggleAppliance(app.id)}
                    className="accent-amber-500"
                  />
                  {app.name} <span className="text-slate-400">({app.avg_watts}W)</span>
                </label>
              ))}
            </div>
          </details>
        ))}
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl p-5 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Monthly Cost</p>
            <p className="text-2xl font-bold text-amber-600">{fmt(totalMonthly)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Annual Cost</p>
            <p className="text-2xl font-bold text-amber-600">{fmt(totalAnnual)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Rate</p>
            <p className="text-2xl font-bold text-slate-700">{rate}¢/kWh</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">vs National Avg</p>
            <p className={`text-2xl font-bold ${savings > 0 ? "text-green-600" : "text-red-500"}`}>
              {savings > 0 ? "-" : "+"}{fmt(Math.abs(savings))}/mo
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown bar */}
      {totalMonthly > 0 && (
        <div className="bg-white rounded-xl p-5 mb-4">
          <h3 className="font-semibold text-slate-800 mb-3">Cost Breakdown by Category</h3>
          <div className="h-6 rounded-full overflow-hidden flex bg-slate-100">
            {Object.entries(categoryTotals).map(([cat, total]) => (
              <div
                key={cat}
                style={{ width: `${(total / totalMonthly) * 100}%` }}
                className={`${CATEGORY_COLORS[cat] || "bg-gray-400"}`}
                title={`${CATEGORY_LABELS[cat] || cat}: ${fmt(total)}/mo`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
            {Object.entries(categoryTotals).map(([cat, total]) => (
              <span key={cat} className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded inline-block ${CATEGORY_COLORS[cat] || "bg-gray-400"}`} />
                {CATEGORY_LABELS[cat] || cat}: {fmt(total)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-appliance breakdown */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl p-5 mb-4">
          <h3 className="font-semibold text-slate-800 mb-3">Per-Appliance Costs</h3>
          <div className="space-y-1">
            {results.sort((a, b) => b.monthlyCost - a.monthlyCost).map((r, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100 text-sm">
                <span className="text-slate-600">{r.name}</span>
                <span className="font-medium text-slate-800">{fmt(r.monthlyCost)}/mo</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300">
              <span className="font-bold text-slate-800">Total</span>
              <span className="font-bold text-amber-600 text-lg">{fmt(totalMonthly)}/mo</span>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-3">
        * Estimates based on average wattage and typical usage. Actual costs may vary based on your specific appliance models and usage patterns.
        Looking to reduce your power bill? Consider getting a <strong>home energy audit</strong>, comparing
        <strong> electricity provider rates</strong>, or exploring <strong>solar panel installation quotes</strong> for your area.
        <strong> Smart thermostats</strong> and <strong>energy-efficient appliances</strong> can also significantly lower your monthly costs.
      </p>
    </div>
  );
}
