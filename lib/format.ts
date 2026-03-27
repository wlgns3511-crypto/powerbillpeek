export function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCents(n: number): string {
  return n.toFixed(2) + '¢';
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatPercent(n: number): string {
  return n.toFixed(1) + '%';
}

export function calcMonthlyCost(watts: number, hoursPerDay: number, ratePerKwh: number): number {
  return (watts * hoursPerDay * 30) / 1000 * (ratePerKwh / 100);
}

export function calcYearlyCost(watts: number, hoursPerDay: number, ratePerKwh: number): number {
  return (watts * hoursPerDay * 365) / 1000 * (ratePerKwh / 100);
}

export function getRateColor(rate: number): string {
  if (rate <= 12) return 'bg-green-500';
  if (rate <= 14) return 'bg-green-400';
  if (rate <= 16) return 'bg-yellow-400';
  if (rate <= 20) return 'bg-orange-400';
  if (rate <= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getRateTextColor(rate: number): string {
  if (rate <= 12) return 'text-green-700';
  if (rate <= 14) return 'text-green-600';
  if (rate <= 16) return 'text-yellow-700';
  if (rate <= 20) return 'text-orange-600';
  if (rate <= 25) return 'text-orange-700';
  return 'text-red-700';
}

export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    coal: 'Coal',
    gas: 'Natural Gas',
    nuclear: 'Nuclear',
    hydro: 'Hydroelectric',
    solar: 'Solar',
    wind: 'Wind',
  };
  return labels[source] || source;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
