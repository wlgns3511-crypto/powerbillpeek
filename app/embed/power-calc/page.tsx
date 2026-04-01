import { Metadata } from "next";
import { getAllStates, getAllAppliances } from "@/lib/db";
import { PowerBillCalculator } from "@/components/PowerBillCalculator";

export const metadata: Metadata = {
  title: "Power Bill Calculator - Embeddable Widget",
  robots: "noindex, nofollow",
  openGraph: { url: "/embed/power-calc/" },
};

export default function EmbedPowerCalcPage() {
  const states = getAllStates();
  const appliances = getAllAppliances();

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <PowerBillCalculator
        states={states.map(s => ({ abbr: s.abbr, state: s.state, avg_rate_kwh: s.avg_rate_kwh }))}
        appliances={appliances.map(a => ({ id: a.id, name: a.name, slug: a.slug, category: a.category, avg_watts: a.avg_watts, typical_hours_per_day: a.typical_hours_per_day }))}
      />
      <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 12 }}>
        Powered by{" "}
        <a href="https://powerbillpeek.com" target="_blank" rel="noopener" style={{ color: "#d97706", textDecoration: "underline" }}>
          PowerBillPeek
        </a>
      </p>
    </div>
  );
}
