import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Issue, TabId, TickerEvent, User, MonthlyStats } from "@/types";
import { getSeverityLevel } from "@/types";
import {
  generateMonthlyStats,
  DEMO_USERS,
} from "@/lib/seed";
import {
  awardXp,
  checkVerifiedCitizen,
  getDailyMissions,
  XP_REWARDS,
} from "@/lib/gamification";
import { getDefaultImage } from "@/lib/images";
import { mergeLocalWithWorld } from "@/lib/worldIssues";
import { detectLocaleForSector, type Lang } from "@/lib/i18n";
import { sfx } from "@/lib/sounds";

interface AppState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isAuthenticated: boolean;
  pending2FA: boolean;
  user: User | null;
  login: (email: string, password: string) => boolean;
  verify2FA: (code: string) => boolean;
  logout: () => void;
  demoLogin: () => void;
  issues: Issue[];
  selectedIssueId: string | null;
  selectIssue: (id: string | null) => void;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  setMapView: (lat: number, lng: number, zoom: number) => void;
  locationDetected: boolean;
  detectLocation: () => void;
  tickerEvents: TickerEvent[];
  monthlyStats: MonthlyStats[];
  newReportPin: { lat: number; lng: number } | null;
  setNewReportPin: (pin: { lat: number; lng: number } | null) => void;
  addIssue: (issue: Partial<Issue>) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  confirmIssue: (id: string) => void;
  upvoteIssue: (id: string) => void;
  reportSpam: (id: string) => void;
  elevateIssue: (id: string) => void;
  updateIssueStatus: (id: string, status: Issue["status"]) => void;
  witnessAlert: string | null;
  setWitnessAlert: (msg: string | null) => void;
  transitionDirection: "in" | "out";
  sectorName: string;
  showLocationPicker: boolean;
  setShowLocationPicker: (show: boolean) => void;
  changeSector: (lat: number, lng: number, name: string, zoom?: number) => void;
  notification: string | null;
  clearNotification: () => void;
  lang: Lang;
  setLanguage: (lang: Lang) => void;
  languagePrompt: { sector: string } | null;
  dismissLanguagePrompt: () => void;
  elevatingIssueId: string | null;
  attachMediaToIssue: (id: string, images: string[], video?: string) => void;
}

function addTicker(
  events: TickerEvent[],
  message: string
): TickerEvent[] {
  const event: TickerEvent = {
    id: `t-${Date.now()}`,
    message,
    timestamp: new Date().toISOString(),
  };
  return [event, ...events].slice(0, 50);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeTab: "map",
      setActiveTab: (tab) =>
        set({ activeTab: tab, transitionDirection: "in" }),

      isAuthenticated: false,
      pending2FA: false,
      user: null,

      login: (email, _password) => {
        const found = DEMO_USERS.find((u) => u.email === email);
        if (found || email.includes("@")) {
          set({
            pending2FA: true,
            user: found || {
              id: "u-new",
              callsign: email.split("@")[0].toUpperCase().slice(0, 10),
              email,
              xp: 0,
              level: 1,
              badges: [],
              verified: false,
              genuineReports: 0,
              reportsCount: 0,
              verificationsCount: 0,
              streak: 0,
              dailyMissionsCompleted: [],
              lastMissionDate: "",
            },
          });
          return true;
        }
        return false;
      },

      verify2FA: (code) => {
        if (code.length >= 4) {
          set({ isAuthenticated: true, pending2FA: false });
          return true;
        }
        return false;
      },

      logout: () =>
        set({ isAuthenticated: false, pending2FA: false, user: null }),

      demoLogin: () => {
        const demo = DEMO_USERS[0];
        const lat = 12.9716;
        const lng = 77.5946;
        set({
          isAuthenticated: true,
          pending2FA: false,
          user: { ...demo },
          activeTab: "map",
          mapCenter: { lat, lng },
          mapZoom: 3,
          locationDetected: true,
          sectorName: "Global Operations",
          issues: mergeLocalWithWorld(lat, lng),
          monthlyStats: generateMonthlyStats(),
          tickerEvents: [
            {
              id: "t0",
              message: "SECTOR ONLINE — Demo map loaded. Allow location to focus on your area.",
              timestamp: new Date().toISOString(),
            },
          ],
        });
        // Refine to user's actual location if available
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            set({
              mapCenter: { lat, lng },
              mapZoom: 14,
              sectorName: "Your Location",
              issues: mergeLocalWithWorld(lat, lng),
              tickerEvents: [
                {
                  id: "t1",
                  message: `SECTOR LOCKED — Your area (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
                  timestamp: new Date().toISOString(),
                },
              ],
            });
          });
        }
      },

      issues: [],
      selectedIssueId: null,
      selectIssue: (id) => set({ selectedIssueId: id }),

      mapCenter: { lat: 20, lng: 0 },
      mapZoom: 2,
      setMapView: (lat, lng, zoom) =>
        set({ mapCenter: { lat, lng }, mapZoom: zoom }),

      locationDetected: false,
      detectLocation: () => {
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude: lat, longitude: lng } = pos.coords;
              set({
                mapCenter: { lat, lng },
                mapZoom: 14,
                locationDetected: true,
                issues: mergeLocalWithWorld(lat, lng),
                monthlyStats: generateMonthlyStats(),
                tickerEvents: [
                  {
                    id: "t0",
                    message: `SECTOR LOCKED — Operating in your area (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
                    timestamp: new Date().toISOString(),
                  },
                ],
              });
              setTimeout(() => {
                set({
                  witnessAlert:
                    "WITNESS MODE — Issue reported 200m from your position. Can you verify?",
                });
              }, 8000);
            },
            () => {
              set({
                mapCenter: { lat: 12.9716, lng: 77.5946 },
                mapZoom: 12,
                locationDetected: true,
                issues: mergeLocalWithWorld(12.9716, 77.5946),
                monthlyStats: generateMonthlyStats(),
                tickerEvents: [
                  {
                    id: "t0",
                    message: "GLOBAL VIEW — Click any sector or enable location to focus",
                    timestamp: new Date().toISOString(),
                  },
                ],
              });
            }
          );
        } else {
          set({
            mapCenter: { lat: 12.9716, lng: 77.5946 },
            mapZoom: 12,
            locationDetected: true,
            issues: mergeLocalWithWorld(12.9716, 77.5946),
            monthlyStats: generateMonthlyStats(),
          });
        }
      },

      tickerEvents: [],
      monthlyStats: [],

      newReportPin: null,
      setNewReportPin: (pin) => set({ newReportPin: pin }),

      addIssue: (partial) => {
        const state = get();
        const user = state.user;
        const id = `issue-${Date.now()}`;
        const severity = partial.severity ?? 5;
        const issue: Issue = {
          id,
          title: partial.title || "New Field Report",
          description: partial.description || "",
          category: partial.category || "other",
          status: "reported",
          severity,
          severityLevel: getSeverityLevel(severity),
          lat: partial.lat ?? state.mapCenter.lat,
          lng: partial.lng ?? state.mapCenter.lng,
          address: partial.address || "Field coordinates logged",
          zone: partial.zone || "Unassigned Sector",
          images: partial.images?.length
            ? partial.images
            : [getDefaultImage(partial.category || "other")],
          video: partial.video,
          hasUserMedia: !!(partial.images?.length || partial.video),
          reporterId: user?.id || "anon",
          reporterName: user?.callsign || "ANON",
          confirmations: 0,
          upvotes: 0,
          spamReports: 0,
          aiCategory: partial.aiCategory || "Pending field assessment",
          aiCauses: partial.aiCauses || [],
          aiLetter: partial.aiLetter,
          aiSummary: partial.aiSummary,
          aiConfidence: partial.aiConfidence,
          aiRecommendedAction: partial.aiRecommendedAction,
          aiEstimatedFixDays: partial.aiEstimatedFixDays,
          aiUrgencyLabel: partial.aiUrgencyLabel,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          daysOpen: 0,
        };

        let updatedUser = user;
        if (user) {
          updatedUser = awardXp(
            { ...user, reportsCount: user.reportsCount + 1 },
            XP_REWARDS.report
          );
          if (!updatedUser.badges.includes("first_report")) {
            updatedUser = {
              ...updatedUser,
              badges: [...updatedUser.badges, "first_report"],
            };
          }
        }

        set({
          issues: [issue, ...state.issues],
          user: updatedUser,
          newReportPin: null,
          selectedIssueId: id,
          activeTab: "map",
          mapCenter: { lat: issue.lat, lng: issue.lng },
          mapZoom: 16,
          tickerEvents: addTicker(
            state.tickerEvents,
            `NEW REPORT: ${issue.title} in ${issue.zone}`
          ),
          notification: `PIN DEPLOYED — ${issue.title} is live on the map`,
        });
        sfx.deploy();
      },

      updateIssue: (id, updates) => {
        set((s) => ({
          issues: s.issues.map((i) =>
            i.id === id
              ? { ...i, ...updates, updatedAt: new Date().toISOString() }
              : i
          ),
        }));
      },

      confirmIssue: (id) => {
        const state = get();
        const issue = state.issues.find((i) => i.id === id);
        if (!issue) return;

        const confirmations = issue.confirmations + 1;
        const updates: Partial<Issue> = {
          confirmations,
          severity: Math.min(10, issue.severity + 0.5),
        };
        if (confirmations >= 3 && issue.status === "reported") {
          updates.status = "verified";
          updates.severityLevel = getSeverityLevel(updates.severity!);
        }

        let user = state.user;
        if (user) {
          user = awardXp(
            { ...user, verificationsCount: user.verificationsCount + 1 },
            XP_REWARDS.verify
          );
          if (user.verificationsCount >= 5 && !user.badges.includes("verifier")) {
            user = { ...user, badges: [...user.badges, "verifier"] };
          }
        }

        set({
          issues: state.issues.map((i) =>
            i.id === id
              ? {
                  ...i,
                  ...updates,
                  severityLevel:
                    updates.severityLevel || getSeverityLevel(updates.severity ?? i.severity),
                  updatedAt: new Date().toISOString(),
                }
              : i
          ),
          user,
          tickerEvents: addTicker(
            state.tickerEvents,
            `VERIFIED: ${issue.title} — ${confirmations} confirmations`
          ),
        });
      },

      upvoteIssue: (id) => {
        const state = get();
        const issue = state.issues.find((i) => i.id === id);
        if (!issue) return;

        const upvotes = issue.upvotes + 1;
        const severity = Math.min(10, issue.severity + 0.3);

        let user = state.user;
        if (user) user = awardXp(user, XP_REWARDS.upvote);

        set({
          issues: state.issues.map((i) =>
            i.id === id
              ? {
                  ...i,
                  upvotes,
                  severity,
                  severityLevel: getSeverityLevel(severity),
                  updatedAt: new Date().toISOString(),
                }
              : i
          ),
          user,
        });
      },

      reportSpam: (id) => {
        set((s) => ({
          issues: s.issues.map((i) =>
            i.id === id ? { ...i, spamReports: i.spamReports + 1 } : i
          ),
        }));
      },

      elevateIssue: (id) => {
        const state = get();
        const issue = state.issues.find((i) => i.id === id);
        if (!issue || issue.confirmations < 3) return;

        sfx.elevate();
        set({ elevatingIssueId: id });

        const severity = Math.min(10, issue.severity + 1);
        setTimeout(() => {
          set({
            elevatingIssueId: null,
            issues: state.issues.map((i) =>
              i.id === id
                ? {
                    ...i,
                    severity,
                    severityLevel: getSeverityLevel(severity),
                    upvotes: i.upvotes + 5,
                  }
                : i
            ),
            tickerEvents: addTicker(
              state.tickerEvents,
              `PRIORITY ELEVATED: ${issue.title} — community push successful`
            ),
            notification: `"${issue.title}" promoted up the mission queue`,
          });
        }, 800);
      },

      updateIssueStatus: (id, status) => {
        const state = get();
        const issue = state.issues.find((i) => i.id === id);
        if (!issue) return;

        let user = state.user;
        if (status === "resolved" && user && issue.reporterId === user.id) {
          user = awardXp(user, XP_REWARDS.resolved);
          user = checkVerifiedCitizen({
            ...user,
            genuineReports: user.genuineReports + 1,
          });
          if (!user.badges.includes("resolver")) {
            user = { ...user, badges: [...user.badges, "resolver"] };
          }
        }

        set({
          issues: state.issues.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status,
                  resolvedAt:
                    status === "resolved" ? new Date().toISOString() : i.resolvedAt,
                  updatedAt: new Date().toISOString(),
                }
              : i
          ),
          user,
          tickerEvents: addTicker(
            state.tickerEvents,
            `STATUS UPDATE: ${issue.title} → ${status.toUpperCase().replace("_", " ")}`
          ),
          notification: `Mission "${issue.title}" moved to ${status.toUpperCase().replace("_", " ")}`,
        });
      },

      sectorName: "Global Sector",
      showLocationPicker: false,
      setShowLocationPicker: (show) => set({ showLocationPicker: show }),

      changeSector: (lat, lng, name, zoom = 13) => {
        const state = get();
        const locale = detectLocaleForSector(name, lat, lng);
        set({
          mapCenter: { lat, lng },
          mapZoom: zoom,
          sectorName: name,
          locationDetected: true,
          issues: mergeLocalWithWorld(lat, lng),
          monthlyStats: generateMonthlyStats(),
          activeTab: "map",
          selectedIssueId: null,
          tickerEvents: addTicker(
            state.tickerEvents,
            `SECTOR RELOCATED — Now monitoring ${name}`
          ),
          notification: `Sector locked on ${name}`,
          languagePrompt: locale === "es" ? { sector: name } : null,
        });
      },

      notification: null,
      clearNotification: () => set({ notification: null }),

      lang: "en" as Lang,
      setLanguage: (lang) => set({ lang, languagePrompt: null }),
      languagePrompt: null,
      dismissLanguagePrompt: () => set({ languagePrompt: null }),

      elevatingIssueId: null,

      attachMediaToIssue: (id, images, video) => {
        set((s) => ({
          issues: s.issues.map((i) =>
            i.id === id
              ? {
                  ...i,
                  images: [...i.images, ...images],
                  video: video || i.video,
                  hasUserMedia: true,
                  updatedAt: new Date().toISOString(),
                }
              : i
          ),
          notification: "Field evidence attached to mission",
        }));
      },

      witnessAlert: null,
      setWitnessAlert: (msg) => set({ witnessAlert: msg }),

      transitionDirection: "in",
    }),
    {
      name: "urbanquest-storage",
      partialize: (s) => ({
        user: s.user,
        isAuthenticated: s.isAuthenticated,
        issues: s.issues,
      }),
    }
  )
);

export { getDailyMissions };
