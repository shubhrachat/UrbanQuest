# UrbanQuest

Civic mission control — report, verify, and track community infrastructure issues through a gamified war-room interface.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Access

Click **Demo Access — Skip Registration** on the login screen. No account needed for judges.

Or register with any email + password, then enter any 4+ digit code for 2FA (demo mode).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Recommended | Google Maps JavaScript API key from [Google Cloud Console](https://console.cloud.google.com). Enable Maps JavaScript API. |
| `GEMINI_API_KEY` | Optional | Powers live AI categorization, severity scoring, and predictive insights. Falls back to rule-based analysis without it. |

**Why Maps API?** Gemini analyzes text/images. Google Maps renders the actual geographic map, pins, and zoom. They are separate Google products.

## Features

- **Terrain Map** — Real Google Maps with warm tactical overlay, hex pins pulsing by severity and age
- **Deploy Report** — Physical card stack on a war table, step-by-step filing, live pin drop
- **Priority Queue** — Mission briefing list ranked by severity + community votes
- **Intel Control Room** — CRT monitors, mission log calendar, heatmaps, AI predictions, leaderboard
- **Community Verification** — Confirm issues, upvote priority, report spam, verified citizen badges
- **Status Pipeline** — Reported → Verified → In Progress → Resolved
- **Gamification** — XP, levels, badges, daily missions, streak bonuses
- **AI** — Categorization, severity scoring, plausible causes, municipal letter drafts
- **Witness Mode** — Proximity alert to verify nearby issues
- **Live Ticker** — Scrolling field intelligence feed
- **Before/After** — Resolved issues show comparison photos
- **Works globally** — Auto-detects your location or starts at world view

## Tech Stack

Next.js 15, React 19, Tailwind CSS, Framer Motion, Zustand, Google Maps API, Gemini API
