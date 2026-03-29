export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  readingTime: number;
  content: string;
}

const posts: BlogPost[] = [
  {
    slug: "why-electric-bill-so-high",
    title: "Why Your Electric Bill Is So High (10 Reasons + Fixes)",
    description:
      "Shocked by your electric bill? These 10 common causes explain most high electricity bills — and most have straightforward fixes that can save you hundreds per year.",
    publishedAt: "2024-10-15",
    updatedAt: "2025-01-10",
    category: "Energy Savings",
    readingTime: 7,
    content: `
<h2>The Biggest Culprit: Heating and Cooling</h2>
<p>Your HVAC system is responsible for <strong>40–50% of the average home's electricity use</strong>. A central air conditioner running 8 hours/day in summer can easily add $100–$150/month to your bill. If your system is more than 12–15 years old, it may be operating well below modern efficiency standards — SEER ratings on new units are 16–22 vs. 8–10 on older systems.</p>
<p><strong>Fix:</strong> Set thermostat to 78°F in summer, 68°F in winter. Each degree of adjustment saves roughly 2–3% on heating/cooling costs. A programmable or smart thermostat (Nest, Ecobee) pays for itself quickly.</p>

<h2>Water Heater: The Silent Energy Hog</h2>
<p>Water heating accounts for about 18% of home energy use. Electric resistance water heaters are particularly inefficient compared to gas or heat pump water heaters. Tank-style heaters constantly maintain water temperature — even when you're not home.</p>
<p><strong>Fix:</strong> Lower the thermostat to 120°F (saves 6–10%). Consider a heat pump water heater (up to 3x more efficient than resistance) or a tankless heater.</p>

<h2>Old, Inefficient Appliances</h2>
<p>Refrigerators from the 1990s or early 2000s can use 3–4x more electricity than modern ENERGY STAR models. Old washing machines, dishwashers, and dryers also consume significantly more energy than current models.</p>
<p><strong>Fix:</strong> Check your appliance's annual energy cost using the EnergyGuide label. ENERGY STAR refrigerators use about 450 kWh/year vs. 1,500+ for older models — saving $100+/year at national average rates.</p>

<h2>Phantom Loads (Standby Power)</h2>
<p>Electronics and appliances draw power even when "off." TVs, game consoles, cable boxes, phone chargers, and smart home devices can collectively add $100–$200/year to your bill without you realizing it.</p>
<p><strong>Fix:</strong> Use smart power strips to cut power to entertainment centers when not in use. Unplug phone chargers and rarely-used devices when not needed.</p>

<h2>Poor Insulation and Air Leaks</h2>
<p>A poorly insulated home is like trying to heat or cool a house with the windows open. Air leaks around windows, doors, outlets, and attic hatches can increase HVAC costs by 15–30%. Inadequate attic insulation is especially impactful — in cold climates, R-38 to R-60 is recommended.</p>
<p><strong>Fix:</strong> Weatherstrip doors and windows ($20–$50). Caulk gaps around electrical outlets and pipes. Add attic insulation (often qualifies for federal tax credits).</p>

<h2>Peak Pricing and Time-of-Use Rates</h2>
<p>Many utilities now charge more during peak demand hours (typically 4–9 PM on weekdays). If you're on a time-of-use (TOU) plan without knowing it, running the dishwasher or doing laundry in the evening could be costing you significantly more.</p>
<p><strong>Fix:</strong> Check your rate plan. Shift energy-intensive tasks to off-peak hours (before noon or after 9 PM). Run the dishwasher overnight.</p>

<h2>Utility Rate Increases</h2>
<p>Electricity rates have increased dramatically — the US average rose from 10.5 cents/kWh in 2011 to over 16 cents/kWh in 2023, a 52% increase. Some states (California: 30+ cents/kWh; Hawaii: 40+ cents/kWh) have seen even steeper increases.</p>

<h2>EV Charging at Home</h2>
<p>A Level 2 EV charger can add 25–50 kWh per charge session. Charging nightly can add $60–$150/month to your bill. Many utilities offer special EV rates with off-peak discounts — worth checking if you own an EV.</p>

<h2>Pool and Hot Tub</h2>
<p>A pool pump running 8 hours/day can add $50–$100/month. Hot tubs add another $30–$100/month depending on size and usage. Reducing pump run time to 6 hours or upgrading to a variable-speed pump can cut pool energy costs by 50–75%.</p>

<h2>How to Audit Your Usage</h2>
<p>Request a free energy audit from your utility — most offer them at no cost. You can also use a Kill-A-Watt meter ($25 at hardware stores) to measure individual appliance consumption and calculate annual costs. Understanding which devices use the most power is the first step to reducing your bill.</p>
`,
  },
  {
    slug: "cheapest-states-electricity-2024",
    title: "States With the Cheapest Electricity Rates in 2024",
    description:
      "Electricity rates vary by 4x across US states — from under 10 cents/kWh in the cheapest states to over 30 cents/kWh in the most expensive. Here's the full breakdown.",
    publishedAt: "2024-10-28",
    category: "State Comparisons",
    readingTime: 5,
    content: `
<h2>National Average Context</h2>
<p>The US average residential electricity rate was approximately <strong>16.2 cents per kWh</strong> in 2023, according to the EIA. But rates range from under 10 cents in the cheapest states to over 40 cents in Hawaii — making where you live one of the biggest factors in your electricity costs.</p>

<h2>Top 10 Cheapest States for Electricity</h2>
<table>
  <thead><tr><th>State</th><th>Avg Rate (¢/kWh)</th><th>Primary Reason</th></tr></thead>
  <tbody>
    <tr><td>Louisiana</td><td>9.5¢</td><td>Natural gas abundance, low transmission costs</td></tr>
    <tr><td>Oklahoma</td><td>9.8¢</td><td>Natural gas + some wind power, low regulatory costs</td></tr>
    <tr><td>Washington</td><td>10.2¢</td><td>Hydro power from Columbia River system</td></tr>
    <tr><td>Idaho</td><td>10.3¢</td><td>Hydro power, low population density costs</td></tr>
    <tr><td>Arkansas</td><td>10.4¢</td><td>Natural gas and coal, low cost of living</td></tr>
    <tr><td>North Dakota</td><td>10.6¢</td><td>Coal and wind power, low transmission costs</td></tr>
    <tr><td>Wyoming</td><td>10.7¢</td><td>Coal heavy, low state regulation</td></tr>
    <tr><td>Mississippi</td><td>11.0¢</td><td>Natural gas, low labor costs</td></tr>
    <tr><td>Montana</td><td>11.2¢</td><td>Hydro power, low population density</td></tr>
    <tr><td>Nebraska</td><td>11.3¢</td><td>Public power districts, wind energy</td></tr>
  </tbody>
</table>

<h2>Most Expensive States</h2>
<table>
  <thead><tr><th>State</th><th>Avg Rate (¢/kWh)</th><th>Primary Reason</th></tr></thead>
  <tbody>
    <tr><td>Hawaii</td><td>43.5¢</td><td>Island isolation, oil-fired generation, high import costs</td></tr>
    <tr><td>California</td><td>31.6¢</td><td>Heavy renewables mandate, grid upgrades, high labor costs</td></tr>
    <tr><td>Connecticut</td><td>27.8¢</td><td>Old nuclear plants, grid transmission costs, gas reliance</td></tr>
    <tr><td>Massachusetts</td><td>25.4¢</td><td>Limited local generation, high demand, offshore wind investment</td></tr>
    <tr><td>Rhode Island</td><td>24.9¢</td><td>Small state, no local generation, transmission-dependent</td></tr>
  </tbody>
</table>

<h2>Why Rates Differ So Much</h2>
<h3>Fuel Mix</h3>
<p>States with abundant hydro power (Washington, Oregon, Idaho) or cheap natural gas (Louisiana, Oklahoma) have dramatically lower generation costs. Hawaii, relying heavily on imported oil, pays the most.</p>

<h3>Infrastructure and Transmission</h3>
<p>States with older, denser grid infrastructure pay more for maintenance and upgrades. New England states pay significant transmission costs to move power from generation centers to consumers.</p>

<h3>State Regulation and Policy</h3>
<p>States with aggressive renewable energy mandates (California, Massachusetts) incur higher costs during the transition. Public utility commissions that allow utilities to recover more capital costs through rates lead to higher bills.</p>

<h3>Deregulation</h3>
<p>Deregulated states (Texas, Illinois, Pennsylvania) allow consumer choice of electricity supplier. In theory, this creates competition and lower prices — in practice, results are mixed, and some consumers in deregulated markets pay more if they don't actively shop for better rates.</p>

<h2>What This Means for Your Bill</h2>
<p>At the same usage level (1,000 kWh/month), a household in Louisiana pays about $95/month, while a household in Hawaii pays about $435/month — a difference of $4,080/year. If you're considering relocating, electricity rates are worth factoring into your cost-of-living calculations, especially if you're purchasing an EV or planning to electrify home heating.</p>
`,
  },
  {
    slug: "how-to-read-electric-bill",
    title: "How to Read Your Electric Bill (And Spot Billing Errors)",
    description:
      "Most people don't really understand their electric bill — and billing errors are more common than you'd think. Here's how to decode every line and spot mistakes.",
    publishedAt: "2024-11-10",
    category: "Energy Basics",
    readingTime: 6,
    content: `
<h2>The Basics: kWh Explained</h2>
<p>Your electricity is measured in <strong>kilowatt-hours (kWh)</strong>. One kWh is the energy used by a 1,000-watt appliance running for one hour — or a 100-watt light bulb running for 10 hours. The average US home uses about 877 kWh per month. Your bill multiplies your kWh usage by your rate per kWh to get your energy charge.</p>

<h2>Anatomy of a Typical Electric Bill</h2>
<h3>Account and Meter Information</h3>
<p>Your bill will show your account number, service address, billing period (usually 28–35 days), meter read dates, and meter readings (start and end). The difference between start and end readings is your usage in kWh.</p>

<h3>Generation Charges</h3>
<p>Also called "supply" or "energy" charges, this covers the actual electricity you consumed. It's typically the largest line item. If your state is deregulated, you may see a separate charge from your chosen supplier vs. your local utility.</p>

<h3>Distribution Charges</h3>
<p>This covers the cost of delivering electricity to your home through the local grid — poles, wires, transformers, substations. It includes a fixed customer charge (typically $5–$20/month regardless of usage) plus a variable charge per kWh.</p>

<h3>Transmission Charges</h3>
<p>Separate from distribution, this covers moving bulk electricity from power plants to local substations. It's often a smaller per-kWh charge rolled into the total rate.</p>

<h3>Demand Charges</h3>
<p>Common on commercial and some large residential bills. Demand charges are based on your <strong>peak demand</strong> (highest kW draw in any 15-minute window during the billing period) rather than total consumption. A single event — like starting your HVAC on a hot afternoon — can set your demand charge for the entire month. Some residential TOU plans now include demand components.</p>

<h3>Tiered Pricing</h3>
<p>California and some other states use tiered pricing where the rate increases as you use more. A typical structure: Tier 1 (first 400 kWh) at 25¢/kWh, Tier 2 (next 400 kWh) at 33¢/kWh, Tier 3 (above 800 kWh) at 45¢/kWh. Your marginal cost of electricity is what matters for efficiency decisions.</p>

<h3>Net Metering Credit</h3>
<p>If you have solar panels, excess generation exported to the grid appears as a credit on your bill. Understand your utility's net metering rate (it may be lower than the retail rate you pay for consumption).</p>

<h2>Common Billing Errors</h2>
<h3>Meter Misread</h3>
<p>Meter readers (human or automated) make mistakes. If your usage looks dramatically higher than usual with no change in your lifestyle, compare your actual meter reading to what's on your bill. Access your meter and read it yourself — the reading should match within a few kWh of what your bill shows.</p>

<h3>Wrong Rate Class</h3>
<p>Utilities offer multiple rate schedules — residential, commercial, time-of-use, special programs. If you've been accidentally assigned a commercial rate or a rate intended for a different usage profile, you could be overpaying. Call your utility to confirm you're on the correct rate schedule.</p>

<h3>Applied Wrong Period</h3>
<p>When billing periods are longer than 30 days (sometimes 35 days), it can look like a high usage month. Check the number of days in your billing period before concluding your usage has spiked.</p>

<h2>How to Dispute a Bill</h2>
<p>If you believe your bill is wrong:</p>
<ol>
  <li>Read your meter and compare to the bill</li>
  <li>Call your utility's customer service with your meter reading</li>
  <li>Request a "meter test" if you believe the meter is faulty (utilities are required to test it, usually at no charge for the first request)</li>
  <li>If unresolved, file a complaint with your state Public Utilities Commission</li>
</ol>
<p>You have the right to dispute bills and withhold the disputed amount (not the total bill) in most states while a formal dispute is under investigation.</p>
`,
  },
  {
    slug: "time-of-use-electricity-rates",
    title: "Time-of-Use Electricity Rates: How to Save by Shifting When You Use Power",
    description:
      "Time-of-use rates charge more during peak hours and less during off-peak hours. Understanding TOU pricing — and shifting your usage — can cut your electricity bill by 10–30%.",
    publishedAt: "2024-11-25",
    category: "Energy Savings",
    readingTime: 6,
    content: `
<h2>What Are Time-of-Use Rates?</h2>
<p>Time-of-use (TOU) pricing is a rate structure where electricity costs more during <strong>peak demand periods</strong> and less during off-peak periods. The logic: the electric grid has limited capacity, and the most expensive power plants (peaker plants) are only turned on during high-demand periods. By shifting load to off-peak hours, consumers help utilities avoid these expensive plants — and get rewarded with lower rates.</p>

<h2>Typical Peak and Off-Peak Hours</h2>
<p>Peak hours vary by utility, but the most common structure is:</p>
<ul>
  <li><strong>Peak (expensive)</strong>: 4 PM – 9 PM on weekdays</li>
  <li><strong>Off-peak (cheap)</strong>: 9 PM – 8 AM, and all day weekends/holidays</li>
  <li><strong>Mid-peak (intermediate)</strong>: Some utilities have a third tier</li>
</ul>
<p>The price difference can be substantial. California's TOU-C plan charges about 38¢/kWh during peak hours and 18¢/kWh off-peak — a 2:1 ratio. Some utilities have even wider spreads.</p>

<h2>Which Utilities Offer TOU?</h2>
<p>TOU plans are now available from most major investor-owned utilities across the country. In some states (California), TOU is now the default rate for residential customers. Utilities offering TOU include PG&E, SCE, Duke Energy, ConEdison, Xcel Energy, and hundreds of others. Check your utility's website or call to ask what TOU plans are available in your area.</p>

<h2>How to Shift Your Usage</h2>
<h3>Laundry</h3>
<p>Washing machines and dryers are among the easiest loads to shift. Run them after 9 PM or before 8 AM. A dryer cycle uses about 5 kWh — at a 20¢/kWh peak-to-off-peak spread, shifting one daily load saves about $365/year.</p>

<h3>Dishwasher</h3>
<p>Use your dishwasher's delay start function to run it overnight. Most modern dishwashers use 1–2 kWh per cycle — easy savings with a delay timer.</p>

<h3>EV Charging</h3>
<p>Electric vehicles are the biggest TOU opportunity. A full charge uses 50–100 kWh. Setting your EV to charge after midnight can save $5–$15 per charge compared to charging in the early evening peak. Many EVs and chargers have built-in scheduling features — use them.</p>

<h3>Pool Pumps</h3>
<p>Variable-speed pool pump controllers can be programmed to run primarily during off-peak hours. A pool pump running 8 hours off-peak instead of 8 hours on-peak can save $50–$100/month on TOU rates.</p>

<h2>Smart Home Automation</h2>
<p>Smart plugs, smart outlets, and home automation systems (Home Assistant, Google Home, SmartThings) can automate load shifting. Set smart plugs to cut power to entertainment devices during peak hours. Program smart thermostats to pre-cool the house before peak hours and coast through the peak period, avoiding AC during expensive hours.</p>

<h2>Is TOU Right for You?</h2>
<p>TOU works best if:</p>
<ul>
  <li>You can shift most major loads to off-peak hours</li>
  <li>You charge an EV at home</li>
  <li>You have solar panels (solar production is mostly off-peak morning hours)</li>
  <li>You're flexible about when you run appliances</li>
</ul>
<p>TOU may not be ideal if you're home all day using electricity continuously, or if your household has care needs that require consistent heating/cooling regardless of time.</p>

<h2>Real Savings Potential</h2>
<p>Customers who actively manage their usage on TOU plans typically save <strong>10–30% compared to a flat rate</strong>, according to utility pilot programs. The savings are highest for households with EVs, pool pumps, or smart home automation. Without any behavior change, TOU plans may actually cost more — the savings require active management.</p>
`,
  },
  {
    slug: "reduce-energy-bill-15-tips",
    title: "15 Proven Ways to Reduce Your Energy Bill This Month",
    description:
      "These 15 energy-saving strategies range from free behavioral changes to low-cost upgrades — and together they can reduce your electricity bill by 20–40%.",
    publishedAt: "2024-12-05",
    category: "Energy Savings",
    readingTime: 7,
    content: `
<h2>Immediate Actions (Free)</h2>
<h3>1. Thermostat Setback</h3>
<p>Lowering your thermostat 8°F for 8 hours per day (when sleeping or away) can save approximately <strong>10% on heating costs</strong>, according to the DOE. In summer, setting AC to 78°F instead of 72°F can reduce cooling costs by 6–18%. A programmable thermostat makes this effortless.</p>

<h3>2. Stop Heating/Cooling Empty Rooms</h3>
<p>Close vents and doors in unused rooms. While this won't significantly affect central HVAC efficiency, reducing the volume of space you're conditioning helps. Zoned systems or mini-splits can take this further.</p>

<h3>3. Use Cold Water for Laundry</h3>
<p>About 90% of washing machine energy goes to heating water. Switching to cold water for most loads saves roughly $60/year and modern detergents work just as well in cold water.</p>

<h3>4. Run Full Loads Only</h3>
<p>A dishwasher or washing machine uses nearly the same energy whether it's half-full or completely full. Running only full loads can reduce energy use per load by 30–50%.</p>

<h3>5. Take Shorter Showers</h3>
<p>Each 4-minute reduction in shower time saves about 10 gallons of hot water — meaning less energy spent heating water. For a household of 4, this can save $80–$150/year.</p>

<h2>Low-Cost Upgrades (Under $100)</h2>
<h3>6. Switch to LED Bulbs</h3>
<p>LED bulbs use 75% less energy than incandescent bulbs and last 25x longer. Replacing 15 incandescent bulbs with LEDs saves about <strong>$130/year</strong> in electricity and $70+/year in replacement bulbs. A 4-pack of good LED bulbs costs about $10.</p>

<h3>7. Seal Air Leaks</h3>
<p>Weatherstripping doors and windows ($20–$40) and caulking gaps around electrical outlets and pipes can reduce HVAC costs by 10–20%. Focus on the attic hatch, exterior doors, and around window frames where air leaks are largest.</p>

<h3>8. Lower Water Heater Temperature</h3>
<p>Most water heaters are set to 140°F at the factory. Lowering to 120°F saves 6–10% on water heating costs and reduces scalding risk. This 5-minute adjustment is free.</p>

<h3>9. Clean Refrigerator Coils</h3>
<p>Dusty condenser coils force the compressor to work harder. Vacuuming refrigerator coils twice a year improves efficiency by 10–25%. Coils are typically on the back or underneath — unplug the fridge first.</p>

<h3>10. Add a Smart Power Strip</h3>
<p>Smart power strips ($20–$40) eliminate standby power draw from entertainment systems. Plug your TV into the "master" outlet and everything else (cable box, streaming device, game console) into "slave" outlets — they automatically cut power when the TV turns off.</p>

<h2>Moderate Investments (Under $500)</h2>
<h3>11. Install a Smart Thermostat</h3>
<p>Smart thermostats (Nest, Ecobee) learn your schedule and preferences, automatically optimizing heating and cooling. Average savings: $130–$145/year, with payback typically under 2 years. Many utilities offer rebates of $25–$100.</p>

<h3>12. Add Attic Insulation</h3>
<p>If your attic has less than R-30 of insulation, adding more can reduce heating and cooling costs by 15–25%. Material costs are $0.50–$1.00/sq ft for blown-in insulation; a 1,500 sq ft attic costs $750–$1,500 in materials plus labor. Federal tax credits cover 30% of the cost (up to $1,200 per year).</p>

<h3>13. Use Ceiling Fans Correctly</h3>
<p>Ceiling fans in summer (counterclockwise) create a wind-chill effect, allowing you to raise the thermostat 4°F without reduced comfort — saving up to 10% on cooling. In winter, run fans clockwise on low speed to push warm air down from the ceiling. Fans cost 1–2¢/hour to run vs. $0.25–$0.50/hour for AC.</p>

<h2>Utility Programs</h2>
<h3>14. Get a Free Energy Audit</h3>
<p>Most utilities offer free in-home energy audits where a professional identifies efficiency opportunities specific to your home. Call your utility's customer service line and ask. Auditors often find HVAC inefficiencies, air leaks, and insulation gaps that you'd never spot yourself. Some audits come with free weatherization services included.</p>

<h3>15. Check for Utility Rebate Programs</h3>
<p>Utilities offer rebates for energy-efficient appliances, smart thermostats, HVAC upgrades, and LED bulbs. The ENERGY STAR rebate finder (energystar.gov/rebate-finder) shows available rebates by ZIP code. These programs can offset 10–50% of upgrade costs — always check before you buy.</p>
`,
  },
];

export function getAllPosts(): BlogPost[] {
  return posts;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(posts.map((p) => p.category)));
}
