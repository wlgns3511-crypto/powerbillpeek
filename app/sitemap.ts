import type { MetadataRoute } from "next";
import { getAllStates, getAllAppliances } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://powerbillpeek.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const states = getAllStates();
  const appliances = getAllAppliances();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/calculator`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/compare`, changeFrequency: "monthly", priority: 0.9 },
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

  return [...staticPages, ...statePages, ...appliancePages];
}
