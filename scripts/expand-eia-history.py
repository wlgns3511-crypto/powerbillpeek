#!/usr/bin/env python3
"""
Expand PowerBillPeek with:
1. Historical electricity rate data (2001-2025) from EIA API - adds rate_history table
2. ZIP-level electricity cost pages using ZipPeek data - adds zip_power table

This creates:
- 50 state rate history pages (/state/[slug]/history/)
- 30,000+ ZIP code electricity pages (/zip/[slug]/)
"""

import sqlite3
import os
import sys
import json
import re
import urllib.request

EIA_API_KEY = "ccPYGnfRU5kZ1PGbubKKFKWrYFdnagldjH63bF8C"
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'power.db')
ZIPPEEK_DB = os.path.join(os.path.dirname(__file__), '..', '..', 'zippeek', 'data', 'zippeek.db')
CACHE_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'eia_history_cache.json')

US_STATES = {
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
    'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
}


def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def fetch_eia_history():
    """Fetch all residential electricity data from EIA API."""
    if os.path.exists(CACHE_FILE):
        print("  Loading from cache...")
        with open(CACHE_FILE) as f:
            return json.load(f)

    print("  Fetching from EIA API...")
    url = (
        f"https://api.eia.gov/v2/electricity/retail-sales/data/"
        f"?api_key={EIA_API_KEY}"
        f"&frequency=annual"
        f"&data[0]=price"
        f"&data[1]=customers"
        f"&data[2]=sales"
        f"&data[3]=revenue"
        f"&facets[sectorid][]=RES"
        f"&sort[0][column]=period&sort[0][direction]=desc"
        f"&length=5000"
    )
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
        records = data.get('response', {}).get('data', [])

    with open(CACHE_FILE, 'w') as f:
        json.dump(records, f)
    print(f"  Fetched {len(records)} records, cached")
    return records


def build_rate_history(conn, records):
    """Create rate_history table with yearly electricity rates per state."""
    print("\n--- Building rate_history table ---")

    conn.execute('DROP TABLE IF EXISTS rate_history')
    conn.execute('''
        CREATE TABLE rate_history (
            state TEXT NOT NULL,
            year INTEGER NOT NULL,
            price REAL,
            customers INTEGER,
            sales_mwh REAL,
            revenue_million REAL,
            PRIMARY KEY (state, year)
        )
    ''')
    conn.execute('CREATE INDEX idx_rh_state ON rate_history(state)')
    conn.execute('CREATE INDEX idx_rh_year ON rate_history(year)')

    inserted = 0
    for r in records:
        state = r.get('stateid', '')
        if state not in US_STATES:
            continue
        try:
            year = int(r.get('period', 0))
            price = float(r['price']) if r.get('price') else None
            customers = int(float(r['customers'])) if r.get('customers') else None
            sales = float(r['sales']) if r.get('sales') else None
            revenue = float(r['revenue']) if r.get('revenue') else None

            conn.execute('''
                INSERT OR REPLACE INTO rate_history (state, year, price, customers, sales_mwh, revenue_million)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (state, year, price, customers, sales, revenue))
            inserted += 1
        except (ValueError, TypeError):
            continue

    conn.commit()
    print(f"  Inserted {inserted} rate history records")

    # Show sample
    sample = conn.execute(
        'SELECT state, year, price FROM rate_history WHERE state = ? ORDER BY year DESC LIMIT 5', ('CA',)
    ).fetchall()
    print("  Sample (CA):", [(s, y, p) for s, y, p in sample])


def build_zip_power(conn):
    """Create zip_power table with electricity estimates per ZIP code."""
    print("\n--- Building zip_power table ---")

    if not os.path.exists(ZIPPEEK_DB):
        print(f"  ERROR: ZipPeek DB not found at {ZIPPEEK_DB}")
        return

    conn.execute('DROP TABLE IF EXISTS zip_power')
    conn.execute('''
        CREATE TABLE zip_power (
            zip_code TEXT PRIMARY KEY,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            avg_rate REAL,
            est_monthly_bill REAL,
            est_annual_cost REAL,
            median_income INTEGER,
            energy_burden_pct REAL
        )
    ''')
    conn.execute('CREATE INDEX idx_zp_state ON zip_power(state)')
    conn.execute('CREATE INDEX idx_zp_slug ON zip_power(slug)')

    # Load state rates
    state_rates = {}
    for r in conn.execute('SELECT abbr, avg_rate_kwh, avg_monthly_bill FROM states').fetchall():
        state_rates[r[0]] = {'rate': r[1], 'bill': r[2]}

    # Load ZipPeek data
    zconn = sqlite3.connect(ZIPPEEK_DB)
    zconn.row_factory = sqlite3.Row
    zips = zconn.execute('SELECT zip_code, city, state, median_income FROM zips').fetchall()
    zconn.close()

    inserted = 0
    for z in zips:
        state = z['state']
        if state not in US_STATES or state not in state_rates:
            # DC → use MD rates
            if state == 'DC':
                sr = state_rates.get('MD', state_rates.get('VA'))
            else:
                continue
        else:
            sr = state_rates[state]

        rate = sr['rate']
        monthly_bill = sr['bill']
        annual_cost = round(monthly_bill * 12, 2)
        income = z['median_income'] or 0
        # Energy burden = annual electricity cost / annual income × 100
        burden = round(annual_cost / income * 100, 1) if income > 0 else None

        slug = f"{z['zip_code']}-{slugify(z['city'])}-{state.lower()}-electricity"

        try:
            conn.execute('''
                INSERT OR IGNORE INTO zip_power
                (zip_code, city, state, slug, avg_rate, est_monthly_bill, est_annual_cost,
                 median_income, energy_burden_pct)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                z['zip_code'], z['city'], state, slug,
                rate, monthly_bill, annual_cost,
                income, burden
            ))
            inserted += 1
        except sqlite3.IntegrityError:
            pass

    conn.commit()
    print(f"  Inserted {inserted} ZIP electricity records")

    total = conn.execute('SELECT COUNT(*) FROM zip_power').fetchone()[0]
    print(f"  Total in DB: {total}")


def main():
    print("=== PowerBillPeek EIA + ZIP Expansion ===\n")

    conn = sqlite3.connect(DB_PATH)

    # 1. Historical rates
    records = fetch_eia_history()
    build_rate_history(conn, records)

    # 2. ZIP-level data
    build_zip_power(conn)

    # Summary
    tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    print(f"\n=== Final DB Summary ===")
    for t in tables:
        count = conn.execute(f"SELECT COUNT(*) FROM [{t[0]}]").fetchone()[0]
        print(f"  {t[0]}: {count} rows")

    conn.close()


if __name__ == '__main__':
    main()
