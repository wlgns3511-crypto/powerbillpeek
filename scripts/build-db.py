#!/usr/bin/env python3
"""
Build SQLite database for PowerBillPeek with real EIA electricity rate data.
Source: U.S. Energy Information Administration (EIA) - Electric Power Monthly
Data reflects 2024 average retail prices of electricity by state.
"""

import sqlite3
import os
import re

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'power.db')

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

# EIA 2024 data: avg residential rate (cents/kWh), avg monthly bill ($),
# residential rate, commercial rate, industrial rate, renewable %, primary source
# Source: EIA Electric Power Monthly Table 5.6.A, state profiles
STATES_DATA = [
    ("Alabama", "AL", 14.87, 163, 14.87, 12.83, 7.58, 12, "gas"),
    ("Alaska", "AK", 24.21, 133, 24.21, 20.15, 19.82, 28, "gas"),
    ("Arizona", "AZ", 14.78, 142, 14.78, 11.85, 7.32, 16, "gas"),
    ("Arkansas", "AR", 13.04, 131, 13.04, 10.53, 7.12, 10, "gas"),
    ("California", "CA", 31.22, 179, 31.22, 25.41, 20.98, 38, "gas"),
    ("Colorado", "CO", 15.56, 115, 15.56, 11.85, 8.49, 30, "gas"),
    ("Connecticut", "CT", 29.98, 176, 29.98, 22.54, 19.43, 6, "gas"),
    ("Delaware", "DE", 14.94, 131, 14.94, 11.68, 9.38, 5, "gas"),
    ("Florida", "FL", 16.22, 167, 16.22, 12.07, 9.71, 6, "gas"),
    ("Georgia", "GA", 14.27, 155, 14.27, 11.74, 7.02, 12, "gas"),
    ("Hawaii", "HI", 43.18, 193, 43.18, 38.05, 33.12, 18, "solar"),
    ("Idaho", "ID", 11.15, 107, 11.15, 8.69, 6.87, 73, "hydro"),
    ("Illinois", "IL", 16.27, 115, 16.27, 11.38, 8.14, 13, "nuclear"),
    ("Indiana", "IN", 15.42, 145, 15.42, 13.07, 8.39, 11, "coal"),
    ("Iowa", "IA", 15.14, 128, 15.14, 13.27, 7.45, 62, "wind"),
    ("Kansas", "KS", 15.28, 133, 15.28, 12.26, 8.85, 47, "wind"),
    ("Kentucky", "KY", 13.19, 140, 13.19, 11.02, 6.77, 8, "coal"),
    ("Louisiana", "LA", 12.52, 141, 12.52, 10.42, 6.11, 5, "gas"),
    ("Maine", "ME", 26.37, 113, 26.37, 18.14, 14.47, 75, "hydro"),
    ("Maryland", "MD", 16.57, 145, 16.57, 12.84, 10.03, 12, "nuclear"),
    ("Massachusetts", "MA", 28.58, 157, 28.58, 22.38, 20.14, 14, "gas"),
    ("Michigan", "MI", 19.34, 126, 19.34, 14.59, 9.14, 12, "gas"),
    ("Minnesota", "MN", 15.63, 119, 15.63, 12.55, 9.15, 29, "wind"),
    ("Mississippi", "MS", 13.54, 142, 13.54, 11.95, 7.29, 5, "gas"),
    ("Missouri", "MO", 13.78, 133, 13.78, 10.94, 7.97, 10, "coal"),
    ("Montana", "MT", 12.81, 107, 12.81, 10.92, 6.35, 48, "hydro"),
    ("Nebraska", "NE", 13.08, 119, 13.08, 10.47, 8.22, 28, "wind"),
    ("Nevada", "NV", 14.92, 140, 14.92, 10.15, 7.61, 24, "gas"),
    ("New Hampshire", "NH", 25.78, 136, 25.78, 19.69, 16.72, 10, "nuclear"),
    ("New Jersey", "NJ", 18.48, 121, 18.48, 14.02, 12.05, 8, "gas"),
    ("New Mexico", "NM", 15.34, 100, 15.34, 12.08, 7.36, 28, "gas"),
    ("New York", "NY", 24.33, 123, 24.33, 18.93, 6.55, 28, "gas"),
    ("North Carolina", "NC", 14.09, 139, 14.09, 10.35, 7.22, 13, "nuclear"),
    ("North Dakota", "ND", 12.43, 128, 12.43, 10.68, 8.29, 34, "wind"),
    ("Ohio", "OH", 15.21, 126, 15.21, 11.67, 7.73, 4, "gas"),
    ("Oklahoma", "OK", 12.82, 131, 12.82, 10.38, 6.62, 42, "wind"),
    ("Oregon", "OR", 12.55, 113, 12.55, 9.88, 6.42, 72, "hydro"),
    ("Pennsylvania", "PA", 18.36, 139, 18.36, 12.06, 8.24, 6, "nuclear"),
    ("Rhode Island", "RI", 28.08, 131, 28.08, 21.44, 19.64, 9, "gas"),
    ("South Carolina", "SC", 14.43, 155, 14.43, 11.69, 6.77, 9, "nuclear"),
    ("South Dakota", "SD", 13.74, 133, 13.74, 11.52, 9.11, 35, "wind"),
    ("Tennessee", "TN", 12.91, 142, 12.91, 11.38, 7.33, 13, "nuclear"),
    ("Texas", "TX", 15.06, 155, 15.06, 10.68, 7.92, 28, "gas"),
    ("Utah", "UT", 11.41, 95, 11.41, 9.30, 6.67, 16, "coal"),
    ("Vermont", "VT", 21.43, 111, 21.43, 18.24, 14.02, 99, "hydro"),
    ("Virginia", "VA", 14.64, 151, 14.64, 9.89, 7.54, 11, "gas"),
    ("Washington", "WA", 11.26, 106, 11.26, 9.56, 5.23, 74, "hydro"),
    ("West Virginia", "WV", 13.44, 137, 13.44, 10.74, 7.36, 7, "coal"),
    ("Wisconsin", "WI", 17.38, 119, 17.38, 13.69, 9.28, 13, "gas"),
    ("Wyoming", "WY", 11.72, 101, 11.72, 9.95, 7.04, 22, "coal"),
]

# Common household appliances with typical wattages
APPLIANCES_DATA = [
    # Cooling
    ("Central Air Conditioner", "cooling", 3500, 8, "A central AC unit for a typical 2000 sq ft home"),
    ("Window Air Conditioner", "cooling", 1200, 8, "A standard window-mounted AC unit for a single room"),
    ("Portable Air Conditioner", "cooling", 1100, 8, "A freestanding portable AC unit"),
    ("Ceiling Fan", "cooling", 75, 12, "A standard 52-inch ceiling fan on medium speed"),
    ("Tower Fan", "cooling", 55, 8, "An oscillating tower fan"),
    ("Evaporative Cooler", "cooling", 250, 8, "A swamp cooler for dry climates"),
    ("Whole House Fan", "cooling", 300, 6, "A large fan that cools by pulling air through the house"),
    # Heating
    ("Electric Space Heater", "heating", 1500, 8, "A standard 1500W portable electric heater"),
    ("Electric Furnace", "heating", 10000, 6, "A whole-house electric furnace"),
    ("Electric Baseboard Heater", "heating", 1000, 10, "A standard room baseboard heater"),
    ("Heat Pump", "heating", 3000, 8, "An air-source heat pump for heating"),
    ("Electric Fireplace", "heating", 1400, 4, "A decorative electric fireplace insert"),
    ("Heated Blanket", "heating", 200, 8, "An electric heated blanket"),
    ("Water Heater (Electric)", "heating", 4500, 3, "A 50-gallon electric water heater"),
    ("Tankless Water Heater", "heating", 7000, 1, "An on-demand electric tankless water heater"),
    # Kitchen
    ("Refrigerator", "kitchen", 150, 24, "A standard 20 cu ft refrigerator running continuously"),
    ("Freezer (Upright)", "kitchen", 100, 24, "A standalone upright freezer"),
    ("Chest Freezer", "kitchen", 80, 24, "A chest-style deep freezer"),
    ("Electric Oven", "kitchen", 2500, 1, "A standard electric oven during use"),
    ("Electric Stove Burner", "kitchen", 1500, 1.5, "One large burner on an electric stove"),
    ("Microwave Oven", "kitchen", 1200, 0.5, "A standard countertop microwave"),
    ("Dishwasher", "kitchen", 1800, 1, "A standard dishwasher per cycle"),
    ("Toaster Oven", "kitchen", 1200, 0.3, "A countertop toaster oven"),
    ("Coffee Maker", "kitchen", 900, 0.25, "A drip coffee maker per brew cycle"),
    ("Electric Kettle", "kitchen", 1500, 0.15, "An electric kettle per boil"),
    ("Instant Pot", "kitchen", 1000, 0.5, "A pressure cooker / Instant Pot"),
    ("Blender", "kitchen", 400, 0.1, "A countertop blender"),
    ("Food Processor", "kitchen", 500, 0.1, "A standard food processor"),
    ("Garbage Disposal", "kitchen", 500, 0.1, "An in-sink garbage disposal"),
    # Laundry
    ("Washing Machine", "laundry", 500, 1, "A standard top-load washing machine per cycle"),
    ("Clothes Dryer (Electric)", "laundry", 3000, 1, "A standard electric clothes dryer per cycle"),
    ("Iron", "laundry", 1200, 0.5, "A steam iron during use"),
    ("Sewing Machine", "laundry", 100, 1, "A standard home sewing machine"),
    # Electronics
    ("Desktop Computer", "electronics", 200, 8, "A standard desktop PC during typical use"),
    ("Gaming PC", "electronics", 500, 4, "A high-end gaming desktop during gameplay"),
    ("Laptop", "electronics", 50, 8, "A standard laptop while in use"),
    ("LED TV (55 inch)", "electronics", 80, 5, "A 55-inch LED television"),
    ("OLED TV (65 inch)", "electronics", 120, 5, "A 65-inch OLED television"),
    ("Gaming Console", "electronics", 150, 3, "A modern gaming console (PS5/Xbox) during play"),
    ("Wi-Fi Router", "electronics", 12, 24, "A standard home Wi-Fi router running 24/7"),
    ("Cable / Satellite Box", "electronics", 35, 24, "A cable or satellite set-top box"),
    ("Sound Bar", "electronics", 30, 4, "A standard sound bar speaker system"),
    ("Smart Speaker", "electronics", 5, 24, "An Alexa, Google Home, or similar device"),
    ("Phone Charger", "electronics", 5, 3, "A smartphone charger while charging"),
    ("Tablet Charger", "electronics", 12, 2, "A tablet charger while charging"),
    ("Home Security System", "electronics", 15, 24, "Cameras, sensors, and hub"),
    ("Electric Vehicle Charger (Level 2)", "electronics", 7200, 4, "A Level 2 EV home charger at 240V"),
    ("Crypto Mining Rig", "electronics", 1500, 24, "A multi-GPU cryptocurrency mining setup"),
    # Lighting
    ("LED Bulb (10W)", "lighting", 10, 8, "A single 10W LED bulb (60W equivalent)"),
    ("CFL Bulb (13W)", "lighting", 13, 8, "A single 13W CFL bulb (60W equivalent)"),
    ("Incandescent Bulb (60W)", "lighting", 60, 8, "A traditional 60W incandescent bulb"),
    ("LED Flood Light (15W)", "lighting", 15, 6, "An outdoor LED flood light"),
    ("Holiday String Lights (LED)", "lighting", 25, 6, "A 100-bulb LED string light set"),
    ("Pool Pump", "cooling", 1500, 8, "A standard 1.5 HP pool pump"),
    ("Hot Tub", "heating", 3000, 4, "A standard 4-person hot tub heater"),
    ("Dehumidifier", "cooling", 300, 12, "A 50-pint whole-room dehumidifier"),
    ("Humidifier", "heating", 50, 12, "An ultrasonic room humidifier"),
    ("Air Purifier", "electronics", 50, 24, "A HEPA air purifier for a medium room"),
    ("Robot Vacuum", "electronics", 30, 1.5, "An autonomous robot vacuum per charge cycle"),
    ("Garage Door Opener", "electronics", 550, 0.05, "A motorized garage door opener per use"),
    ("Sump Pump", "electronics", 800, 0.5, "A basement sump pump during operation"),
]

# Top utility companies by state
UTILITIES_DATA = [
    ("Alabama Power", "AL", "electric", 14.87, 1500000, "https://www.alabamapower.com"),
    ("Tennessee Valley Authority", "AL", "electric", 12.50, 600000, "https://www.tva.com"),
    ("Huntsville Utilities", "AL", "both", 13.20, 200000, "https://www.hsvutil.org"),
    ("Golden Valley Electric", "AK", "electric", 24.21, 45000, "https://www.gvea.com"),
    ("Chugach Electric", "AK", "electric", 22.50, 90000, "https://www.chugachelectric.com"),
    ("Arizona Public Service", "AZ", "electric", 14.78, 1300000, "https://www.aps.com"),
    ("Salt River Project", "AZ", "electric", 12.85, 1100000, "https://www.srpnet.com"),
    ("Tucson Electric Power", "AZ", "electric", 13.90, 430000, "https://www.tep.com"),
    ("Entergy Arkansas", "AR", "electric", 13.04, 710000, "https://www.entergy.com"),
    ("Empire District Electric", "AR", "electric", 12.80, 170000, "https://www.libertyutilities.com"),
    ("Pacific Gas & Electric", "CA", "both", 31.22, 5500000, "https://www.pge.com"),
    ("Southern California Edison", "CA", "electric", 29.50, 5000000, "https://www.sce.com"),
    ("San Diego Gas & Electric", "CA", "both", 33.40, 1400000, "https://www.sdge.com"),
    ("Los Angeles DWP", "CA", "both", 20.50, 1500000, "https://www.ladwp.com"),
    ("Xcel Energy", "CO", "both", 15.56, 1400000, "https://www.xcelenergy.com"),
    ("Colorado Springs Utilities", "CO", "both", 13.50, 260000, "https://www.csu.org"),
    ("Eversource Energy", "CT", "electric", 29.98, 1300000, "https://www.eversource.com"),
    ("United Illuminating", "CT", "electric", 28.40, 340000, "https://www.uinet.com"),
    ("Delmarva Power", "DE", "electric", 14.94, 310000, "https://www.delmarva.com"),
    ("Florida Power & Light", "FL", "electric", 16.22, 5700000, "https://www.fpl.com"),
    ("Duke Energy Florida", "FL", "electric", 15.80, 1900000, "https://www.duke-energy.com"),
    ("Tampa Electric", "FL", "electric", 15.40, 800000, "https://www.tampaelectric.com"),
    ("Georgia Power", "GA", "electric", 14.27, 2700000, "https://www.georgiapower.com"),
    ("Hawaiian Electric", "HI", "electric", 43.18, 460000, "https://www.hawaiianelectric.com"),
    ("Idaho Power", "ID", "electric", 11.15, 600000, "https://www.idahopower.com"),
    ("Avista Utilities", "ID", "electric", 10.80, 120000, "https://www.myavista.com"),
    ("ComEd", "IL", "electric", 16.27, 4000000, "https://www.comed.com"),
    ("Ameren Illinois", "IL", "both", 15.10, 1200000, "https://www.ameren.com"),
    ("Indiana Michigan Power", "IN", "electric", 15.42, 600000, "https://www.indianamichiganpower.com"),
    ("Duke Energy Indiana", "IN", "electric", 14.90, 850000, "https://www.duke-energy.com"),
    ("Indianapolis Power & Light", "IN", "electric", 14.60, 500000, "https://www.aes-indiana.com"),
    ("MidAmerican Energy", "IA", "both", 15.14, 790000, "https://www.midamericanenergy.com"),
    ("Alliant Energy", "IA", "both", 14.50, 500000, "https://www.alliantenergy.com"),
    ("Evergy", "KS", "electric", 15.28, 700000, "https://www.evergy.com"),
    ("Kentucky Utilities", "KY", "electric", 13.19, 550000, "https://lge-ku.com"),
    ("Louisville Gas & Electric", "KY", "both", 12.80, 420000, "https://lge-ku.com"),
    ("Entergy Louisiana", "LA", "electric", 12.52, 1100000, "https://www.entergy.com"),
    ("SWEPCO", "LA", "electric", 11.90, 280000, "https://www.swepco.com"),
    ("Central Maine Power", "ME", "electric", 26.37, 640000, "https://www.cmpco.com"),
    ("BGE (Baltimore Gas & Electric)", "MD", "both", 16.57, 1300000, "https://www.bge.com"),
    ("Pepco", "MD", "electric", 15.80, 590000, "https://www.pepco.com"),
    ("National Grid", "MA", "both", 28.58, 1300000, "https://www.nationalgridus.com"),
    ("Eversource MA", "MA", "electric", 27.90, 1500000, "https://www.eversource.com"),
    ("DTE Energy", "MI", "both", 19.34, 2300000, "https://www.dteenergy.com"),
    ("Consumers Energy", "MI", "both", 18.50, 1900000, "https://www.consumersenergy.com"),
    ("Xcel Energy MN", "MN", "both", 15.63, 1200000, "https://www.xcelenergy.com"),
    ("Minnesota Power", "MN", "electric", 14.20, 150000, "https://www.mnpower.com"),
    ("Mississippi Power", "MS", "electric", 13.54, 190000, "https://www.mississippipower.com"),
    ("Entergy Mississippi", "MS", "electric", 13.10, 460000, "https://www.entergy.com"),
    ("Ameren Missouri", "MO", "both", 13.78, 1200000, "https://www.ameren.com"),
    ("Evergy Missouri", "MO", "electric", 13.50, 550000, "https://www.evergy.com"),
    ("NorthWestern Energy", "MT", "both", 12.81, 380000, "https://www.northwesternenergy.com"),
    ("NPPD", "NE", "electric", 13.08, 250000, "https://www.nppd.com"),
    ("OPPD", "NE", "electric", 12.40, 400000, "https://www.oppd.com"),
    ("NV Energy", "NV", "electric", 14.92, 1000000, "https://www.nvenergy.com"),
    ("Eversource NH", "NH", "electric", 25.78, 530000, "https://www.eversource.com"),
    ("Liberty Utilities NH", "NH", "electric", 24.50, 45000, "https://www.libertyutilities.com"),
    ("PSE&G", "NJ", "both", 18.48, 2300000, "https://www.pseg.com"),
    ("JCP&L", "NJ", "electric", 17.80, 1100000, "https://www.firstenergycorp.com"),
    ("PNM", "NM", "electric", 15.34, 540000, "https://www.pnm.com"),
    ("El Paso Electric NM", "NM", "electric", 14.80, 100000, "https://www.epelectric.com"),
    ("Con Edison", "NY", "both", 24.33, 3500000, "https://www.coned.com"),
    ("National Grid NY", "NY", "both", 22.80, 1700000, "https://www.nationalgridus.com"),
    ("NYSEG", "NY", "electric", 20.50, 900000, "https://www.nyseg.com"),
    ("Duke Energy Carolinas", "NC", "electric", 14.09, 2600000, "https://www.duke-energy.com"),
    ("Duke Energy Progress NC", "NC", "electric", 13.80, 1700000, "https://www.duke-energy.com"),
    ("Xcel Energy ND", "ND", "electric", 12.43, 95000, "https://www.xcelenergy.com"),
    ("Montana-Dakota Utilities", "ND", "both", 11.90, 80000, "https://www.montana-dakota.com"),
    ("AEP Ohio", "OH", "electric", 15.21, 1500000, "https://www.aepohio.com"),
    ("Duke Energy Ohio", "OH", "both", 14.80, 720000, "https://www.duke-energy.com"),
    ("FirstEnergy Ohio", "OH", "electric", 14.50, 2000000, "https://www.firstenergycorp.com"),
    ("OG&E", "OK", "electric", 12.82, 870000, "https://www.oge.com"),
    ("PSO", "OK", "electric", 12.40, 560000, "https://www.psoklahoma.com"),
    ("Portland General Electric", "OR", "electric", 12.55, 900000, "https://www.portlandgeneral.com"),
    ("PacifiCorp Oregon", "OR", "electric", 11.80, 610000, "https://www.pacificpower.net"),
    ("PPL Electric", "PA", "electric", 18.36, 1500000, "https://www.pplelectric.com"),
    ("PECO Energy", "PA", "both", 17.50, 1700000, "https://www.peco.com"),
    ("Duquesne Light", "PA", "electric", 16.80, 600000, "https://www.duquesnelight.com"),
    ("National Grid RI", "RI", "both", 28.08, 500000, "https://www.nationalgridus.com"),
    ("Duke Energy Carolinas SC", "SC", "electric", 14.43, 750000, "https://www.duke-energy.com"),
    ("Dominion Energy SC", "SC", "electric", 14.10, 760000, "https://www.dominionenergy.com"),
    ("Xcel Energy SD", "SD", "electric", 13.74, 110000, "https://www.xcelenergy.com"),
    ("Black Hills Energy SD", "SD", "electric", 13.10, 72000, "https://www.blackhillsenergy.com"),
    ("TVA / Local Cooperatives", "TN", "electric", 12.91, 800000, "https://www.tva.com"),
    ("Nashville Electric Service", "TN", "electric", 12.60, 400000, "https://www.nespower.com"),
    ("Oncor / TXU Energy", "TX", "electric", 15.06, 3600000, "https://www.txu.com"),
    ("CenterPoint Energy", "TX", "both", 14.50, 2600000, "https://www.centerpointenergy.com"),
    ("AEP Texas", "TX", "electric", 14.80, 1100000, "https://www.aeptexas.com"),
    ("Rocky Mountain Power", "UT", "electric", 11.41, 1000000, "https://www.rockymountainpower.net"),
    ("Green Mountain Power", "VT", "electric", 21.43, 270000, "https://www.greenmountainpower.com"),
    ("Dominion Energy Virginia", "VA", "electric", 14.64, 2700000, "https://www.dominionenergy.com"),
    ("Appalachian Power VA", "VA", "electric", 13.90, 530000, "https://www.appalachianpower.com"),
    ("Puget Sound Energy", "WA", "both", 11.26, 1200000, "https://www.pse.com"),
    ("Avista WA", "WA", "both", 10.80, 250000, "https://www.myavista.com"),
    ("Seattle City Light", "WA", "electric", 10.20, 440000, "https://www.seattle.gov/city-light"),
    ("Appalachian Power WV", "WV", "electric", 13.44, 480000, "https://www.appalachianpower.com"),
    ("Mon Power", "WV", "electric", 12.90, 390000, "https://www.firstenergycorp.com"),
    ("We Energies", "WI", "both", 17.38, 1100000, "https://www.we-energies.com"),
    ("Alliant Energy WI", "WI", "both", 16.50, 480000, "https://www.alliantenergy.com"),
    ("Rocky Mountain Power WY", "WY", "electric", 11.72, 200000, "https://www.rockymountainpower.net"),
    ("Black Hills Energy WY", "WY", "both", 11.30, 42000, "https://www.blackhillsenergy.com"),
]


def build():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Create tables
    c.execute('''CREATE TABLE states (
        state TEXT NOT NULL,
        abbr TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        avg_rate_kwh REAL NOT NULL,
        avg_monthly_bill REAL NOT NULL,
        residential_rate REAL NOT NULL,
        commercial_rate REAL NOT NULL,
        industrial_rate REAL NOT NULL,
        renewable_pct REAL NOT NULL,
        primary_source TEXT NOT NULL
    )''')

    c.execute('''CREATE TABLE appliances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        avg_watts INTEGER NOT NULL,
        typical_hours_per_day REAL NOT NULL,
        description TEXT
    )''')

    c.execute('''CREATE TABLE utilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        state TEXT NOT NULL,
        type TEXT NOT NULL,
        avg_rate REAL NOT NULL,
        customers INTEGER NOT NULL,
        website TEXT,
        FOREIGN KEY (state) REFERENCES states(abbr)
    )''')

    # Insert states
    for row in STATES_DATA:
        state, abbr, rate, bill, res, comm, ind, ren, source = row
        slug = slugify(state)
        c.execute('INSERT INTO states VALUES (?,?,?,?,?,?,?,?,?,?)',
                  (state, abbr, slug, rate, bill, res, comm, ind, ren, source))

    # Insert appliances
    seen_slugs = set()
    for row in APPLIANCES_DATA:
        name, category, watts, hours, desc = row
        slug = slugify(name)
        # Handle duplicate slugs
        if slug in seen_slugs:
            slug = slug + '-' + category
        seen_slugs.add(slug)
        c.execute('INSERT INTO appliances (name, slug, category, avg_watts, typical_hours_per_day, description) VALUES (?,?,?,?,?,?)',
                  (name, slug, category, watts, hours, desc))

    # Insert utilities
    seen_util_slugs = set()
    for row in UTILITIES_DATA:
        name, state, utype, rate, customers, website = row
        slug = slugify(name)
        if slug in seen_util_slugs:
            slug = slug + '-' + state.lower()
        seen_util_slugs.add(slug)
        c.execute('INSERT INTO utilities (name, slug, state, type, avg_rate, customers, website) VALUES (?,?,?,?,?,?,?)',
                  (name, slug, state, utype, rate, customers, website))

    # Create indices
    c.execute('CREATE INDEX idx_states_slug ON states(slug)')
    c.execute('CREATE INDEX idx_appliances_slug ON appliances(slug)')
    c.execute('CREATE INDEX idx_appliances_category ON appliances(category)')
    c.execute('CREATE INDEX idx_utilities_state ON utilities(state)')
    c.execute('CREATE INDEX idx_utilities_slug ON utilities(slug)')
    c.execute('CREATE INDEX idx_states_rate ON states(avg_rate_kwh)')

    conn.commit()
    conn.close()

    print(f"Database built at {DB_PATH}")
    print(f"  States: {len(STATES_DATA)}")
    print(f"  Appliances: {len(APPLIANCES_DATA)}")
    print(f"  Utilities: {len(UTILITIES_DATA)}")


if __name__ == '__main__':
    build()
