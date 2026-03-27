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

// --- Computed helpers ---

export function getNationalAvgRate(): number {
  const row = getDb().prepare('SELECT AVG(avg_rate_kwh) as avg FROM states').get() as { avg: number };
  return Math.round(row.avg * 100) / 100;
}

export function getNationalAvgBill(): number {
  const row = getDb().prepare('SELECT AVG(avg_monthly_bill) as avg FROM states').get() as { avg: number };
  return Math.round(row.avg);
}
