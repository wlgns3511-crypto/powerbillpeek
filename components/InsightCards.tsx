import { getRateRank, getBillRank, getRenewableRank, getNationalAvgRate, getNationalAvgBill } from "@/lib/db";
import type { State } from "@/lib/db";

interface Props {
  state: State;
}

export function InsightCards({ state }: Props) {
  const rateRank = getRateRank(state.slug);
  const billRank = getBillRank(state.slug);
  const renewableRank = getRenewableRank(state.slug);
  const nationalRate = getNationalAvgRate();
  const nationalBill = getNationalAvgBill();

  const billDiff = Math.round(((state.avg_monthly_bill - nationalBill) / nationalBill) * 100);

  const costTier = state.avg_rate_kwh <= 10 ? "Very Cheap" : state.avg_rate_kwh <= 13 ? "Cheap" : state.avg_rate_kwh <= 16 ? "Average" : state.avg_rate_kwh <= 22 ? "Expensive" : "Very Expensive";
  const costColor = state.avg_rate_kwh <= 10 ? "text-amber-700" : state.avg_rate_kwh <= 13 ? "text-green-600" : state.avg_rate_kwh <= 16 ? "text-yellow-600" : state.avg_rate_kwh <= 22 ? "text-orange-600" : "text-red-600";

  const cards: { label: string; value: string; sub: string; color: string }[] = [];

  if (rateRank.rank > 0) {
    cards.push({
      label: "Rate Rank",
      value: `#${rateRank.rank}`,
      sub: `of ${rateRank.total} states (cheapest)`,
      color: rateRank.rank <= 15 ? "text-amber-700" : rateRank.rank <= 35 ? "text-yellow-600" : "text-red-600",
    });
  }

  cards.push({
    label: "Bill vs National",
    value: `${billDiff > 0 ? "+" : ""}${billDiff}%`,
    sub: `$${state.avg_monthly_bill} vs $${nationalBill} avg`,
    color: billDiff <= 0 ? "text-amber-700" : billDiff <= 15 ? "text-yellow-600" : "text-red-600",
  });

  if (renewableRank.rank > 0) {
    cards.push({
      label: "Renewable %",
      value: `${state.renewable_pct.toFixed(0)}%`,
      sub: `#${renewableRank.rank} of ${renewableRank.total} states`,
      color: state.renewable_pct >= 40 ? "text-amber-700" : state.renewable_pct >= 20 ? "text-green-600" : "text-yellow-600",
    });
  }

  cards.push({
    label: "Cost Tier",
    value: costTier,
    sub: `${state.avg_rate_kwh.toFixed(1)}\u00A2/kWh`,
    color: costColor,
  });

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-amber-900 mb-3">Energy Insights</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center"
          >
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
