#!/usr/bin/env python3
"""
Expand PowerBillPeek utilities from ~101 to 3,000+ using EIA API.

EIA API v2: https://api.eia.gov/v2/electricity/retail-sales/data/
Returns utility-level electricity retail sales data.

Usage:
  python3 scripts/expand-utilities-eia.py
"""

import sqlite3
import os
import sys
import json
import re
import urllib.request
import urllib.error

EIA_API_KEY = "ccPYGnfRU5kZ1PGbubKKFKWrYFdnagldjH63bF8C"
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'power.db')
CACHE_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'eia_cache.json')

# State FIPS to abbreviation mapping
FIPS_TO_ABBR = {
    'AL': 'AL', 'AK': 'AK', 'AZ': 'AZ', 'AR': 'AR', 'CA': 'CA',
    'CO': 'CO', 'CT': 'CT', 'DE': 'DE', 'FL': 'FL', 'GA': 'GA',
    'HI': 'HI', 'ID': 'ID', 'IL': 'IL', 'IN': 'IN', 'IA': 'IA',
    'KS': 'KS', 'KY': 'KY', 'LA': 'LA', 'ME': 'ME', 'MD': 'MD',
    'MA': 'MA', 'MI': 'MI', 'MN': 'MN', 'MS': 'MS', 'MO': 'MO',
    'MT': 'MT', 'NE': 'NE', 'NV': 'NV', 'NH': 'NH', 'NJ': 'NJ',
    'NM': 'NM', 'NY': 'NY', 'NC': 'NC', 'ND': 'ND', 'OH': 'OH',
    'OK': 'OK', 'OR': 'OR', 'PA': 'PA', 'RI': 'RI', 'SC': 'SC',
    'SD': 'SD', 'TN': 'TN', 'TX': 'TX', 'UT': 'UT', 'VT': 'VT',
    'VA': 'VA', 'WA': 'WA', 'WV': 'WV', 'WI': 'WI', 'WY': 'WY', 'DC': 'DC'
}

VALID_STATES = set(FIPS_TO_ABBR.values())


def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def fetch_eia_utilities():
    """Fetch utility-level electricity data from EIA API v2."""
    all_data = []
    offset = 0
    page_size = 5000

    while True:
        url = (
            f"https://api.eia.gov/v2/electricity/retail-sales/data/"
            f"?api_key={EIA_API_KEY}"
            f"&frequency=annual"
            f"&data[0]=revenue"
            f"&data[1]=sales"
            f"&data[2]=customers"
            f"&data[3]=price"
            f"&facets[sectorid][]=RES"
            f"&sort[0][column]=period"
            f"&sort[0][direction]=desc"
            f"&offset={offset}"
            f"&length={page_size}"
        )

        print(f"  Fetching offset={offset}...")
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode())
                data = result.get('response', {}).get('data', [])
                total = result.get('response', {}).get('total', 0)

                if not data:
                    break

                all_data.extend(data)
                offset += page_size

                print(f"    Got {len(data)} records (total so far: {len(all_data)}/{total})")

                if len(all_data) >= total or len(data) < page_size:
                    break

        except Exception as e:
            print(f"  EIA API error at offset {offset}: {e}")
            break

    return all_data


def process_utilities(raw_data):
    """Process EIA data into utility records."""
    # Group by utility (latest year only)
    utilities = {}

    for row in raw_data:
        state = row.get('stateid', '')
        if state not in VALID_STATES:
            continue

        name = row.get('stateName', '') if row.get('sectorid') == 'RES' else ''
        util_name = row.get('entityName', row.get('name', ''))
        if not util_name or util_name in ('Total Electric Industry', 'Retail Sales Total'):
            continue

        period = row.get('period', '')
        price = row.get('price')
        customers = row.get('customers')

        # Skip if no useful data
        if not price and not customers:
            continue

        key = f"{util_name}|{state}"
        if key not in utilities or period > utilities[key].get('period', ''):
            utilities[key] = {
                'name': util_name,
                'state': state,
                'period': period,
                'avg_rate': float(price) if price else None,
                'customers': int(float(customers)) if customers else None,
            }

    # Filter: must have rate and customers
    valid = [u for u in utilities.values() if u['avg_rate'] and u['avg_rate'] > 0 and u['customers'] and u['customers'] > 0]

    # Sort by customers desc
    valid.sort(key=lambda x: x['customers'] or 0, reverse=True)

    return valid


def main():
    print("=== PowerBillPeek EIA Utility Expansion ===\n")

    if not os.path.exists(DB_PATH):
        print(f"ERROR: DB not found at {DB_PATH}")
        sys.exit(1)

    # Check cache first
    if os.path.exists(CACHE_FILE):
        print("Loading from cache...")
        with open(CACHE_FILE) as f:
            raw_data = json.load(f)
        print(f"  {len(raw_data)} cached records")
    else:
        print("Fetching from EIA API...")
        raw_data = fetch_eia_utilities()
        print(f"  Total raw records: {len(raw_data)}")
        # Save cache
        with open(CACHE_FILE, 'w') as f:
            json.dump(raw_data, f)
        print("  Cached for future runs")

    print("\nProcessing utilities...")
    utilities = process_utilities(raw_data)
    print(f"  Valid utilities: {len(utilities)}")

    # Load existing
    conn = sqlite3.connect(DB_PATH)
    existing_slugs = {r[0] for r in conn.execute('SELECT slug FROM utilities').fetchall()}
    print(f"  Existing in DB: {len(existing_slugs)}")

    # Insert new utilities
    inserted = 0
    skipped = 0

    for u in utilities:
        slug = slugify(u['name'])
        if not slug or len(slug) < 3:
            continue

        # Handle slug collisions
        if slug in existing_slugs:
            slug = f"{slug}-{u['state'].lower()}"
        if slug in existing_slugs:
            skipped += 1
            continue

        try:
            conn.execute('''
                INSERT INTO utilities (name, slug, state, type, avg_rate, customers, website)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                u['name'],
                slug,
                u['state'],
                'electric',
                u['avg_rate'],
                u['customers'],
                '',  # website unknown from EIA
            ))
            existing_slugs.add(slug)
            inserted += 1
        except sqlite3.IntegrityError:
            skipped += 1

    conn.commit()

    # Final count
    total = conn.execute('SELECT COUNT(*) FROM utilities').fetchone()[0]
    by_state = conn.execute('''
        SELECT state, COUNT(*) as cnt FROM utilities
        GROUP BY state ORDER BY cnt DESC LIMIT 10
    ''').fetchall()

    conn.close()

    print(f"\n=== Done ===")
    print(f"  New utilities inserted: {inserted}")
    print(f"  Skipped (duplicates): {skipped}")
    print(f"  Total utilities in DB: {total}")
    print(f"\n  Top states by utility count:")
    for state, cnt in by_state:
        print(f"    {state}: {cnt}")


if __name__ == '__main__':
    main()
