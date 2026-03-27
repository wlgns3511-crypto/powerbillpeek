import type { MetadataRoute } from "next";
import { getAllStates, getAllAppliances, getTopComparisonPairs, getAllUtilities, getUtilityComparisonPairs } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://powerbillpeek.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const states = getAllStates();
  const appliances = getAllAppliances();
  const comparisons = getTopComparisonPairs();
  const utilities = getAllUtilities();
  const utilityComparisons = getUtilityComparisonPairs();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/calculator`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/compare`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/utility`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/utility-compare`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const statePages: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${SITE_URL}/state/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const appliancePages: MetadataRoute.Sitemap = appliances.map((a) => ({
    url: `${SITE_URL}/appliance/${a.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // State x Appliance combination pages (50 states x N appliances)
  const costPages: MetadataRoute.Sitemap = [];
  for (const state of states) {
    for (const appliance of appliances) {
      costPages.push({
        url: `${SITE_URL}/cost/${appliance.slug}-in-${state.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  }

  // State vs State comparison pages
  const comparePages: MetadataRoute.Sitemap = comparisons.map((c) => ({
    url: `${SITE_URL}/compare/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Utility pages
  const utilityPages: MetadataRoute.Sitemap = utilities.map((u) => ({
    url: `${SITE_URL}/utility/${u.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Utility comparison pages
  const utilityComparePages: MetadataRoute.Sitemap = utilityComparisons.map((uc) => ({
    url: `${SITE_URL}/utility-compare/${uc.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...statePages, ...appliancePages, ...costPages, ...comparePages, ...utilityPages, ...utilityComparePages];
}
