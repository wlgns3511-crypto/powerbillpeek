export function AuthorBox() {
  return (
    <div className="mt-10 flex gap-4 p-5 bg-yellow-50 border-yellow-200 border rounded-xl">
      <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
        <span>⚡</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-slate-900 text-sm">PowerBillPeek Energy Research Team</span>
          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-medium">Electricity Cost & Energy Market Analysts</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          Our energy market researchers track utility rates, time-of-use pricing, solar incentives, and energy efficiency data nationwide. Rate data sourced from EIA, state PUC filings, and utility rate schedules.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">✓ EIA Data Sourced</span>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">✓ All 50 States</span>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">✓ Monthly Updates</span>
        </div>
      </div>
    </div>
  );
}
