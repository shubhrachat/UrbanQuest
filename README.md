# UrbanQuest
Report, verify, and track community infrastructure issues — potholes, water leaks, broken streetlights, waste — through a live map and AI-powered dashboard.

## Quick Start
npm install
cp .env.example .env.local
npm run dev

Open http://localhost:3000

## Demo Access
Click **Demo Access — Skip Registration** on the login screen. No account needed.
Or register with any email + password and enter any 4+ digit code for 2FA.

## Environment Variables
| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Recommended | Google Maps JavaScript API key. Enable Maps JavaScript API in Google Cloud Console. |
| `GEMINI_API_KEY` | Optional | Powers AI categorization, severity scoring, and predictive insights. Falls back to rule-based analysis without it. |

## Features
- **Terrain Map** — Live Google Maps with tactical overlay, hex pins pulsing by severity
- **Deploy Report** — Step-by-step issue filing with photo upload and live pin drop
- **Priority Queue** — Issues ranked by severity and community votes
- **Intel Control Room** — Heatmaps, AI predictions, mission log calendar, leaderboard
- **Community Verification** — Confirm issues, upvote priority, earn verified badges
- **Status Pipeline** — Reported → Verified → In Progress → Resolved
- **Gamification** — XP, levels, badges, daily missions, streak bonuses
- **AI Engine** — Categorization, severity scoring, cause analysis, municipal letter drafts
- **Witness Mode** — Proximity alerts to verify nearby issues
- **Live Ticker** — Real-time activity feed
- **Works globally** — Auto-detects your location

## Tech Stack
Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Zustand, Google Maps API, Gemini API
