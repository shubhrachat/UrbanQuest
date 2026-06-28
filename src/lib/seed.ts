import type { Issue, MonthlyStats, User } from "@/types";

const IMG = (category: string, idx = 0) => {
  const map: Record<string, string[]> = {
    pothole: [
      "https://blog.ipleaders.in/wp-content/uploads/2021/01/022018_pothole.jpg",
      "https://blog.ipleaders.in/wp-content/uploads/2021/01/022018_pothole.jpg",
    ],
    water_leak: [
      "https://t4.ftcdn.net/jpg/02/34/73/61/360_F_234736184_B3VyLGwx2eq7dsSZNzUnIGddJNSnU1PW.jpg",
      "https://t4.ftcdn.net/jpg/02/34/73/61/360_F_234736184_B3VyLGwx2eq7dsSZNzUnIGddJNSnU1PW.jpg",
    ],
    streetlight: [
      "https://images.unsplash.com/photo-1708440889870-a2538074d177?fm=jpg&q=60&w=3000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1708440889870-a2538074d177?fm=jpg&q=60&w=3000&auto=format&fit=crop",
    ],
    waste: [
      "https://img.youtube.com/vi/_HqJo8Okydk/maxresdefault.jpg",
      "https://img.youtube.com/vi/_HqJo8Okydk/maxresdefault.jpg",
    ],
    infrastructure: [
      "https://i.redd.it/1ylvye1ntokc1.jpeg",
      "https://i.redd.it/1ylvye1ntokc1.jpeg",
    ],
    other: [
      "https://thearchitectsdiary.com/wp-content/uploads/2024/01/Graffiti-in-India_Image-05-jpg.webp",
      "https://thearchitectsdiary.com/wp-content/uploads/2024/01/Graffiti-in-India_Image-05-jpg.webp",
    ],
  };
  const imgs = map[category] || map.other;
  return imgs[idx % imgs.length];
};

function seededRng(lat: number, lng: number) {
  let seed = Math.abs(Math.round(lat * 1000) * 31337 + Math.round(lng * 1000) * 7919);
  return () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
}

const ZONE_NAMES_BY_REGION = {
  india: ["Koramangala", "Indiranagar", "Whitefield", "HSR Layout", "Jayanagar", "Rajajinagar", "Malleshwaram", "Vijayanagar", "Basavanagudi", "Yelahanka", "BTM Layout", "Electronic City"],
  us: ["Downtown", "Midtown", "East Side", "West End", "Northgate", "South District", "Harbor View", "Uptown", "Riverside", "Oak Park", "Lakeview", "Central Ave"],
  europe: ["Old Town", "City Centre", "Northern Quarter", "East End", "West District", "Harbour", "Newtown", "Southside", "Canal Zone", "Market District", "Cathedral Quarter", "Docklands"],
  default: ["North Sector", "East Quarter", "Central District", "West Ward", "South Block", "Harbor Zone", "Uptown", "Old Town", "Market Row", "Riverside", "Tech Park", "Green Valley"],
};

function getZoneNames(lat: number, lng: number): string[] {
  if (lat >= 8 && lat <= 37 && lng >= 68 && lng <= 97) return ZONE_NAMES_BY_REGION.india;
  if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -65) return ZONE_NAMES_BY_REGION.us;
  if (lat >= 35 && lat <= 72 && lng >= -10 && lng <= 40) return ZONE_NAMES_BY_REGION.europe;
  return ZONE_NAMES_BY_REGION.default;
}

export function generateSeedIssues(centerLat: number, centerLng: number): Issue[] {
  const rng = seededRng(centerLat, centerLng);
  const zones = getZoneNames(centerLat, centerLng);

  const offsets = Array.from({ length: 12 }, (_, i) => {
    const angle = rng() * Math.PI * 2;
    const dist = 0.005 + rng() * 0.022;
    return {
      lat: Math.cos(angle) * dist,
      lng: Math.sin(angle) * dist,
      zone: zones[i % zones.length],
    };
  });

  const VID: Record<string, string> = {
    pothole: "https://www.shutterstock.com/shutterstock/videos/3979737745/preview/stock-footage--k-pothole-on-road-or-street-in-need-of-repair-damaged-tarmac-with-pot-hole-vertical-stock.webm",
    water_leak: "https://static.vecteezy.com/system/resources/previews/071/728/703/watermarked/leaky-pipes-in-dark-basement-causing-water-damage-and-potential-problems-free-video.mp4",
    streetlight: "https://v.ftcdn.net/03/05/62/86/700_F_305628644_ZGNYFOTvNOEk5JDCQMAmYqDnaqGYnzgD_ST.mp4",
    waste: "https://www.shutterstock.com/shutterstock/videos/3779749089/preview/stock-footage-tracking-shot-of-a-huge-pile-of-garbage-at-dump-yeard-filled-with-plastic-and-waste-material.webm",
    infrastructure: "https://www.shutterstock.com/shutterstock/videos/4024614047/preview/stock-footage-aerial-view-of-electricity-transmission-towers-in-a-snowy-field-during-sunset-symbolizing-energy.webm",
    other: "https://www.shutterstock.com/shutterstock/videos/3737846161/preview/stock-footage-london-united-kingdom-uk-a-vibrant-view-of-leake-street-graffiti-tunnel-with.webm",
  };

  const templates: Omit<Issue, "id" | "lat" | "lng" | "zone" | "address" | "createdAt" | "updatedAt" | "daysOpen">[] = [
    {
      title: "Deep pothole on main arterial",
      description: "Large crater forming near intersection. Vehicles swerving dangerously. Water pooling inside after rain.",
      category: "pothole", status: "verified", severity: 8, severityLevel: "high",
      images: [IMG("pothole", 0), IMG("pothole", 1)],
      video: VID["pothole"],
      reporterId: "u2", reporterName: "Priya S", confirmations: 5, upvotes: 12, spamReports: 0,
      aiCategory: "Road Surface Damage — Pothole (Critical)",
      aiCauses: ["Heavy traffic", "Poor drainage", "Aging asphalt"],
      aiSummary: "Critical road crater causing vehicle swerving and water pooling after rainfall.",
      aiConfidence: 91, aiRecommendedAction: "Emergency patch crew within 24 hours.", aiEstimatedFixDays: 5, aiUrgencyLabel: "CRITICAL",
    },
    {
      title: "Burst water main — street flooding",
      description: "Water gushing from underground pipe for 3 days. Sidewalk submerged. Pedestrians rerouting.",
      category: "water_leak", status: "in_progress", severity: 9, severityLevel: "high",
      images: [IMG("water_leak", 0), IMG("water_leak", 1)],
      video: VID["water_leak"],
      reporterId: "u3", reporterName: "Rahul M", confirmations: 8, upvotes: 24, spamReports: 0,
      aiCategory: "Water Infrastructure — Main Line Breach",
      aiCauses: ["Corroded pipe joint", "Pressure surge", "Ground settlement"],
      aiSummary: "Active water main breach flooding sidewalk for 72+ hours.",
      aiConfidence: 94, aiRecommendedAction: "Shut off valve immediately. Deploy repair crew.", aiEstimatedFixDays: 2, aiUrgencyLabel: "CRITICAL",
    },
    {
      title: "Streetlight out — dark stretch",
      description: "Three consecutive lamps non-functional. Safety concern for evening commuters.",
      category: "streetlight", status: "reported", severity: 5, severityLevel: "medium",
      images: [IMG("streetlight", 0)],
      video: VID["streetlight"],
      reporterId: "u4", reporterName: "Anita K", confirmations: 2, upvotes: 6, spamReports: 0,
      aiCategory: "Electrical — Street Lighting Failure",
      aiCauses: ["Bulb burnout", "Wiring fault", "Timer malfunction"],
    },
    {
      title: "Illegal dumping site growing",
      description: "Construction debris and household waste accumulating at vacant lot corner.",
      category: "waste", status: "verified", severity: 6, severityLevel: "medium",
      images: [IMG("waste", 0), IMG("waste", 1)],
      video: VID["waste"],
      reporterId: "u5", reporterName: "Suresh P", confirmations: 4, upvotes: 9, spamReports: 1,
      aiCategory: "Sanitation — Illegal Waste Dumping",
      aiCauses: ["Lack of surveillance", "No collection schedule", "Contractor negligence"],
    },
    {
      title: "Broken pedestrian railing",
      description: "Metal railing snapped along bridge walkway. Gap wide enough for child to fall through.",
      category: "infrastructure", status: "resolved", severity: 7, severityLevel: "high",
      images: [IMG("infrastructure", 0)], afterImage: IMG("infrastructure", 1),
      video: VID["infrastructure"],
      reporterId: "u2", reporterName: "Priya S", confirmations: 6, upvotes: 15, spamReports: 0,
      aiCategory: "Public Safety — Pedestrian Barrier Damage",
      aiCauses: ["Rust corrosion", "Vehicle collision", "Deferred maintenance"],
      resolvedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      title: "Sinkhole forming near drain",
      description: "Pavement cracking and sinking. Hole approximately 30cm and expanding.",
      category: "pothole", status: "reported", severity: 7, severityLevel: "high",
      images: [IMG("pothole", 0)],
      video: VID["pothole"],
      reporterId: "u6", reporterName: "Vikram N", confirmations: 1, upvotes: 3, spamReports: 0,
      aiCategory: "Geological — Early Sinkhole Indicators",
      aiCauses: ["Subsurface erosion", "Broken sewer line", "Clay soil shrinkage"],
    },
    {
      title: "Overflowing public bin",
      description: "Municipal bin not emptied in over a week. Attracting pests and odor complaints.",
      category: "waste", status: "in_progress", severity: 4, severityLevel: "medium",
      images: [IMG("waste", 1)],
      video: VID["waste"],
      reporterId: "u7", reporterName: "Meera J", confirmations: 3, upvotes: 5, spamReports: 0,
      aiCategory: "Sanitation — Collection Schedule Failure",
      aiCauses: ["Route skip", "Holiday backlog", "Insufficient bin capacity"],
    },
    {
      title: "Flickering traffic signal",
      description: "Signal at busy junction intermittently failing. Near-miss accidents reported.",
      category: "infrastructure", status: "verified", severity: 8, severityLevel: "high",
      images: [IMG("infrastructure", 0)],
      video: VID["infrastructure"],
      reporterId: "u3", reporterName: "Rahul M", confirmations: 7, upvotes: 18, spamReports: 0,
      aiCategory: "Traffic Systems — Signal Malfunction",
      aiCauses: ["Power fluctuation", "Controller board fault", "Weather damage"],
    },
    {
      title: "Road surface cracking",
      description: "Hairline cracks appearing along curb. Not yet hazardous but worsening.",
      category: "pothole", status: "resolved", severity: 3, severityLevel: "low",
      images: [IMG("pothole", 1)], afterImage: IMG("infrastructure", 0),
      video: VID["pothole"],
      reporterId: "u8", reporterName: "Arun T", confirmations: 2, upvotes: 2, spamReports: 0,
      aiCategory: "Road Surface — Early Deterioration",
      aiCauses: ["Thermal expansion", "Tree root pressure"],
      resolvedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      title: "Leaking fire hydrant",
      description: "Hydrant dripping continuously. Water waste estimated at 200L/day.",
      category: "water_leak", status: "reported", severity: 5, severityLevel: "medium",
      images: [IMG("water_leak", 1)],
      video: VID["water_leak"],
      reporterId: "u4", reporterName: "Anita K", confirmations: 0, upvotes: 1, spamReports: 0,
      aiCategory: "Water Infrastructure — Hydrant Seal Failure",
      aiCauses: ["Worn gasket", "Freeze-thaw damage", "Vandalism attempt"],
    },
    {
      title: "Damaged bus shelter roof",
      description: "Roof panel detached after storm. Exposed commuters to rain.",
      category: "infrastructure", status: "verified", severity: 6, severityLevel: "medium",
      images: [IMG("infrastructure", 0), IMG("infrastructure", 1)],
      video: VID["infrastructure"],
      reporterId: "u5", reporterName: "Suresh P", confirmations: 4, upvotes: 8, spamReports: 0,
      aiCategory: "Transit Infrastructure — Shelter Damage",
      aiCauses: ["Storm wind damage", "Rust at mounting points"],
    },
    {
      title: "Graffiti on public wall",
      description: "Vandalism on heritage marker. Requires professional cleaning.",
      category: "other", status: "reported", severity: 2, severityLevel: "low",
      images: [IMG("other", 0)],
      video: VID["other"],
      reporterId: "u6", reporterName: "Vikram N", confirmations: 1, upvotes: 0, spamReports: 2,
      aiCategory: "Vandalism — Public Property Defacement",
      aiCauses: ["Lack of night patrol", "Unmonitored area"],
    },
  ];

  const now = Date.now();

  return templates.map((t, i) => {
    const off = offsets[i % offsets.length];
    const daysAgo = Math.floor(rng() * 20) + 1;
    const created = new Date(now - daysAgo * 86400000).toISOString();
    const streetNum = 10 + Math.floor(rng() * 200);
    return {
      ...t,
      id: `issue-${i + 1}`,
      lat: centerLat + off.lat,
      lng: centerLng + off.lng,
      zone: off.zone,
      address: `${streetNum} ${off.zone} Road`,
      hasUserMedia: true,
      createdAt: created,
      updatedAt: created,
      daysOpen: t.status === "resolved" ? Math.max(1, daysAgo - 2) : daysAgo,
    };
  });
}

export const DEMO_USERS: User[] = [
  { id: "u1", callsign: "COMMANDER", email: "demo@urbanquest.io", xp: 1250, level: 5, badges: ["first_report", "verifier", "streak_3"], verified: true, genuineReports: 5, reportsCount: 8, verificationsCount: 12, streak: 3, dailyMissionsCompleted: [], lastMissionDate: "" },
  { id: "u2", callsign: "RECON-7", email: "recon@demo.io", xp: 2100, level: 7, badges: ["verified_citizen", "top_reporter"], verified: true, genuineReports: 8, reportsCount: 12, verificationsCount: 20, streak: 5, dailyMissionsCompleted: [], lastMissionDate: "" },
  { id: "u3", callsign: "WATCHDOG-3", email: "watch@demo.io", xp: 1800, level: 6, badges: ["verified_citizen", "water_warrior"], verified: true, genuineReports: 6, reportsCount: 9, verificationsCount: 15, streak: 2, dailyMissionsCompleted: [], lastMissionDate: "" },
];

export function generateMonthlyStats(): MonthlyStats[] {
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentYear = now.getFullYear();
  const result: MonthlyStats[] = [];
  for (let i = 5; i >= 0; i--) {
    let monthIndex = currentMonthIndex - i;
    let year = currentYear;
    if (monthIndex < 0) { monthIndex += 12; year -= 1; }
    const idx = 5 - i;
    result.push({
      month: MONTH_NAMES[monthIndex], year,
      reported: 40 + Math.floor(Math.random() * 60) + idx * 3,
      resolved: 25 + Math.floor(Math.random() * 40) + idx * 2,
      pending: 10 + Math.floor(Math.random() * 20),
      topZones: [
        { zone: "Central District", count: 12 + idx },
        { zone: "Riverside", count: 8 + idx },
        { zone: "West Ward", count: 6 + idx },
      ],
      topReporters: [
        { name: "RECON-7", count: 5 + idx },
        { name: "WATCHDOG-3", count: 4 + idx },
        { name: "CLEAN-SWEEP", count: 3 + idx },
      ],
    });
  }
  return result;
}

export const BADGE_INFO: Record<string, { label: string; description: string }> = {
  first_report: { label: "First Report", description: "Submitted your first issue" },
  verifier: { label: "Verifier", description: "Confirmed 5 community issues" },
  streak_3: { label: "On A Streak", description: "3 consecutive days of activity" },
  verified_citizen: { label: "Verified Citizen", description: "3+ genuine reports confirmed" },
  top_reporter: { label: "Top Reporter", description: "Among highest issue reporters" },
  water_warrior: { label: "Water Warrior", description: "Reported 3+ water infrastructure issues" },
  resolver: { label: "Problem Solver", description: "Had an issue you reported get resolved" },
};
