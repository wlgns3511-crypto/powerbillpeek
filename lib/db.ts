import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'power.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  }
  return _db;
}

// --- Types ---

export interface State {
  state: string;
  abbr: string;
  slug: string;
  avg_rate_kwh: number;
  avg_monthly_bill: number;
  residential_rate: number;
  commercial_rate: number;
  industrial_rate: number;
  renewable_pct: number;
  primary_source: string;
}

export interface Appliance {
  id: number;
  name: string;
  slug: string;
  category: string;
  avg_watts: number;
  typical_hours_per_day: number;
  description: string;
}

export interface Utility {
  id: number;
  name: string;
  slug: string;
  state: string;
  type: string;
  avg_rate: number;
  customers: number;
  website: string;
}

// --- State queries ---

export function getAllStates(): State[] {
  return getDb().prepare('SELECT * FROM states ORDER BY state').all() as State[];
}

export function getStateBySlug(slug: string): State | undefined {
  return getDb().prepare('SELECT * FROM states WHERE slug = ?').get(slug) as State | undefined;
}

export function getStateByAbbr(abbr: string): State | undefined {
  return getDb().prepare('SELECT * FROM states WHERE abbr = ?').get(abbr) as State | undefined;
}

export function getHighestRateStates(limit = 10): State[] {
  return getDb().prepare('SELECT * FROM states ORDER BY avg_rate_kwh DESC LIMIT ?').all(limit) as State[];
}

export function getLowestRateStates(limit = 10): State[] {
  return getDb().prepare('SELECT * FROM states ORDER BY avg_rate_kwh ASC LIMIT ?').all(limit) as State[];
}

// --- Appliance queries ---

export function getAllAppliances(): Appliance[] {
  return getDb().prepare('SELECT * FROM appliances ORDER BY name').all() as Appliance[];
}

export function getApplianceBySlug(slug: string): Appliance | undefined {
  return getDb().prepare('SELECT * FROM appliances WHERE slug = ?').get(slug) as Appliance | undefined;
}

export function getAppliancesByCategory(category: string): Appliance[] {
  return getDb().prepare('SELECT * FROM appliances WHERE category = ? ORDER BY name').all(category) as Appliance[];
}

export function getApplianceCategories(): { category: string; count: number }[] {
  return getDb().prepare('SELECT category, COUNT(*) as count FROM appliances GROUP BY category ORDER BY category').all() as { category: string; count: number }[];
}

// --- Utility queries ---

export function getUtilitiesByState(stateAbbr: string): Utility[] {
  return getDb().prepare('SELECT * FROM utilities WHERE state = ? ORDER BY customers DESC').all(stateAbbr) as Utility[];
}

export function getAllUtilities(): Utility[] {
  return getDb().prepare('SELECT * FROM utilities ORDER BY customers DESC').all() as Utility[];
}

export function getUtilityBySlug(slug: string): Utility | undefined {
  return getDb().prepare('SELECT * FROM utilities WHERE slug = ?').get(slug) as Utility | undefined;
}

// --- Utility comparison pairs (top 50 utilities by customer count) ---

export function getUtilityComparisonPairs(): { slug: string; util1Slug: string; util2Slug: string }[] {
  const utilities = getDb().prepare('SELECT slug FROM utilities ORDER BY customers DESC LIMIT 25').all() as { slug: string }[];
  const slugs = utilities.map((u) => u.slug);
  const pairs: { slug: string; util1Slug: string; util2Slug: string }[] = [];
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      pairs.push({
        util1Slug: slugs[i],
        util2Slug: slugs[j],
        slug: `${slugs[i]}-vs-${slugs[j]}`,
      });
    }
  }
  return pairs;
}

// --- Computed helpers ---

export function getNationalAvgRate(): number {
  const row = getDb().prepare('SELECT AVG(avg_rate_kwh) as avg FROM states').get() as { avg: number };
  return Math.round(row.avg * 100) / 100;
}

export function getNationalAvgBill(): number {
  const row = getDb().prepare('SELECT AVG(avg_monthly_bill) as avg FROM states').get() as { avg: number };
  return Math.round(row.avg);
}

// --- Neighboring states map ---

const NEIGHBORS: Record<string, string[]> = {
  AL: ['MS', 'TN', 'GA', 'FL'],
  AK: [],
  AZ: ['CA', 'NV', 'UT', 'CO', 'NM'],
  AR: ['MO', 'TN', 'MS', 'LA', 'TX', 'OK'],
  CA: ['OR', 'NV', 'AZ'],
  CO: ['WY', 'NE', 'KS', 'OK', 'NM', 'UT'],
  CT: ['NY', 'MA', 'RI'],
  DE: ['MD', 'PA', 'NJ'],
  FL: ['GA', 'AL'],
  GA: ['FL', 'AL', 'TN', 'NC', 'SC'],
  HI: [],
  ID: ['MT', 'WY', 'UT', 'NV', 'OR', 'WA'],
  IL: ['WI', 'IA', 'MO', 'KY', 'IN'],
  IN: ['MI', 'OH', 'KY', 'IL'],
  IA: ['MN', 'WI', 'IL', 'MO', 'NE', 'SD'],
  KS: ['NE', 'MO', 'OK', 'CO'],
  KY: ['IN', 'OH', 'WV', 'VA', 'TN', 'MO', 'IL'],
  LA: ['TX', 'AR', 'MS'],
  ME: ['NH'],
  MD: ['PA', 'DE', 'WV', 'VA'],
  MA: ['NH', 'VT', 'NY', 'CT', 'RI'],
  MI: ['OH', 'IN', 'WI'],
  MN: ['WI', 'IA', 'SD', 'ND'],
  MS: ['TN', 'AL', 'LA', 'AR'],
  MO: ['IA', 'IL', 'KY', 'TN', 'AR', 'OK', 'KS', 'NE'],
  MT: ['ND', 'SD', 'WY', 'ID'],
  NE: ['SD', 'IA', 'MO', 'KS', 'CO', 'WY'],
  NV: ['OR', 'ID', 'UT', 'AZ', 'CA'],
  NH: ['VT', 'ME', 'MA'],
  NJ: ['NY', 'PA', 'DE'],
  NM: ['CO', 'OK', 'TX', 'AZ', 'UT'],
  NY: ['VT', 'MA', 'CT', 'NJ', 'PA'],
  NC: ['VA', 'TN', 'GA', 'SC'],
  ND: ['MN', 'SD', 'MT'],
  OH: ['MI', 'IN', 'KY', 'WV', 'PA'],
  OK: ['KS', 'MO', 'AR', 'TX', 'NM', 'CO'],
  OR: ['WA', 'ID', 'NV', 'CA'],
  PA: ['NY', 'NJ', 'DE', 'MD', 'WV', 'OH'],
  RI: ['CT', 'MA'],
  SC: ['NC', 'GA'],
  SD: ['ND', 'MN', 'IA', 'NE', 'WY', 'MT'],
  TN: ['KY', 'VA', 'NC', 'GA', 'AL', 'MS', 'AR', 'MO'],
  TX: ['NM', 'OK', 'AR', 'LA'],
  UT: ['ID', 'WY', 'CO', 'NM', 'AZ', 'NV'],
  VT: ['NH', 'MA', 'NY'],
  VA: ['MD', 'WV', 'KY', 'TN', 'NC'],
  WA: ['ID', 'OR'],
  WV: ['OH', 'PA', 'MD', 'VA', 'KY'],
  WI: ['MN', 'IA', 'IL', 'MI'],
  WY: ['MT', 'SD', 'NE', 'CO', 'UT', 'ID'],
};

export function getNeighboringStates(abbr: string): State[] {
  const neighborAbbrs = NEIGHBORS[abbr] || [];
  if (neighborAbbrs.length === 0) return [];
  const placeholders = neighborAbbrs.map(() => '?').join(',');
  return getDb().prepare(`SELECT * FROM states WHERE abbr IN (${placeholders}) ORDER BY state`).all(...neighborAbbrs) as State[];
}

// --- All state vs state comparison pairs (50*49/2 = 1,225 pairs) ---

export function getTopComparisonPairs(): { state1: string; state2: string; slug: string }[] {
  const states = getDb().prepare('SELECT slug FROM states ORDER BY state').all() as { slug: string }[];
  const slugs = states.map((s) => s.slug);
  const pairs: { state1: string; state2: string; slug: string }[] = [];
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      pairs.push({ state1: slugs[i], state2: slugs[j], slug: `${slugs[i]}-vs-${slugs[j]}-electricity` });
    }
  }
  return pairs;
}
