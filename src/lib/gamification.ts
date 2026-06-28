import type { User } from "@/types";

export const XP_REWARDS = {
  report: 100,
  verify: 50,
  upvote: 10,
  resolved: 200,
  dailyMission: 200,
  streakBonus: 75,
};

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

export function xpToNextLevel(xp: number): number {
  const level = calculateLevel(xp);
  return level * 500 - xp;
}

export function awardXp(user: User, amount: number): User {
  const newXp = user.xp + amount;
  return { ...user, xp: newXp, level: calculateLevel(newXp) };
}

export function checkVerifiedCitizen(user: User): User {
  if (user.genuineReports >= 3 && !user.badges.includes("verified_citizen")) {
    return {
      ...user,
      verified: true,
      badges: [...user.badges, "verified_citizen"],
    };
  }
  return user;
}

export function getDailyMissions() {
  return [
    {
      id: "dm-report-2",
      title: "Field Recon",
      description: "Report 2 issues in your sector today",
      xpReward: 200,
      completed: false,
    },
    {
      id: "dm-verify-3",
      title: "Eyes On Ground",
      description: "Verify 3 existing reports",
      xpReward: 150,
      completed: false,
    },
    {
      id: "dm-upvote-5",
      title: "Raise Priority",
      description: "Upvote 5 issues to elevate them",
      xpReward: 100,
      completed: false,
    },
  ];
}
