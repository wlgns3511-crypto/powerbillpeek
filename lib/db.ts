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

// --- ZIP power queries ---

export interface ZipPower {
  zip_code: string;
  city: string;
  state: string;
  slug: string;
  avg_rate: number;
  est_monthly_bill: number;
  est_annual_cost: number;
  median_income: number;
  energy_burden_pct: number;
}

export function getAllZipPower(): ZipPower[] {
  return getDb().prepare('SELECT * FROM zip_power ORDER BY zip_code').all() as ZipPower[];
}

export function getZipPowerBySlug(slug: string): ZipPower | undefined {
  return getDb().prepare('SELECT * FROM zip_power WHERE slug = ?').get(slug) as ZipPower | undefined;
}

export function getZipPowerByState(stateAbbr: string): ZipPower[] {
  return getDb().prepare('SELECT * FROM zip_power WHERE state = ? ORDER BY est_annual_cost DESC').all(stateAbbr) as ZipPower[];
}

export function getHighestBurdenZips(limit = 20): ZipPower[] {
  return getDb().prepare('SELECT * FROM zip_power WHERE energy_burden_pct IS NOT NULL AND energy_burden_pct > 0 ORDER BY energy_burden_pct DESC LIMIT ?').all(limit) as ZipPower[];
}

// --- Rate history queries ---

export interface RateHistory {
  state: string;
  year: number;
  price: number;
  customers: number;
  sales_mwh: number;
  revenue_million: number;
}

export function getRateHistoryByState(stateAbbr: string): RateHistory[] {
  return getDb().prepare('SELECT * FROM rate_history WHERE state = ? ORDER BY year DESC').all(stateAbbr) as RateHistory[];
}

export function getRateHistoryAllStates(year: number): RateHistory[] {
  return getDb().prepare('SELECT * FROM rate_history WHERE year = ? ORDER BY price DESC').all(year) as RateHistory[];
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

// --- Search ---

export function searchPowerBill(query: string): { states: State[]; appliances: Appliance[]; utilities: Utility[] } {
  const pattern = `%${query}%`;
  const states = getDb().prepare('SELECT * FROM states WHERE state LIKE ? OR abbr LIKE ? ORDER BY state LIMIT 10').all(pattern, pattern) as State[];
  const appliances = getDb().prepare('SELECT * FROM appliances WHERE name LIKE ? OR category LIKE ? ORDER BY name LIMIT 10').all(pattern, pattern) as Appliance[];
  const utilities = getDb().prepare('SELECT * FROM utilities WHERE name LIKE ? OR state LIKE ? ORDER BY customers DESC LIMIT 10').all(pattern, pattern) as Utility[];
  return { states, appliances, utilities };
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

// --- Ranking helpers ---

export function getRateRank(slug: string): { rank: number; total: number } {
  const total = (getDb().prepare("SELECT COUNT(*) as c FROM states").get() as { c: number }).c;
  const state = getStateBySlug(slug);
  if (!state) return { rank: 0, total };
  // Rank 1 = cheapest
  const cheaper = (getDb().prepare(
    "SELECT COUNT(*) as c FROM states WHERE avg_rate_kwh < ?"
  ).get(state.avg_rate_kwh) as { c: number }).c;
  return { rank: cheaper + 1, total };
}

export function getBillRank(slug: string): { rank: number; total: number } {
  const total = (getDb().prepare("SELECT COUNT(*) as c FROM states").get() as { c: number }).c;
  const state = getStateBySlug(slug);
  if (!state) return { rank: 0, total };
  const lower = (getDb().prepare(
    "SELECT COUNT(*) as c FROM states WHERE avg_monthly_bill < ?"
  ).get(state.avg_monthly_bill) as { c: number }).c;
  return { rank: lower + 1, total };
}

export function getRenewableRank(slug: string): { rank: number; total: number } {
  const total = (getDb().prepare("SELECT COUNT(*) as c FROM states WHERE renewable_pct IS NOT NULL").get() as { c: number }).c;
  const state = getStateBySlug(slug);
  if (!state) return { rank: 0, total };
  const higher = (getDb().prepare(
    "SELECT COUNT(*) as c FROM states WHERE renewable_pct IS NOT NULL AND renewable_pct > ?"
  ).get(state.renewable_pct) as { c: number }).c;
  return { rank: higher + 1, total };
}

// --- Related appliances (same category) ---

export function getRelatedAppliances(category: string, excludeSlug: string, limit = 6): Appliance[] {
  return getDb().prepare(
    'SELECT * FROM appliances WHERE category = ? AND slug != ? ORDER BY avg_watts DESC LIMIT ?'
  ).all(category, excludeSlug, limit) as Appliance[];
}
