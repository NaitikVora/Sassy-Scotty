/**
 * Dynamic vibe coach generator - Scotty's got your back with witty Gen Z energy
 */

import type { Task } from '../types/task';

export interface VibeCoach {
  mood: string;
  summary: string;
  energy: number;
  mantra: string;
  stats: {
    dueToday: number;
  };
  tips: string[];
  wins: string[];
}

const MOODS = [
  "it's giving busy busy",
  "lowkey stressed but we move",
  "main character energy",
  "no thoughts just vibes",
  "it's giving productive chaos",
  "we're so back",
  "honestly thriving rn",
  "chaotic good energy",
  "literally locked in",
  "touch grass szn"
];

const MANTRAS = [
  "keep the pressure, not the stress",
  "we don't gatekeep, we dominate",
  "slay responsibly",
  "iconic behavior only",
  "rent is due, effort is not",
  "delulu is the solulu",
  "gaslight gatekeep girlboss (academically)",
  "if overthinking was a sport we'd be olympians",
  "no crumbs left, only wins",
  "it's called work ethic, look it up",
  "suffering in style since [current year]",
  "respectfully unhinged",
  "chronically online, academically on time"
];

const CHILL_TIPS = [
  "bestie you have time, go touch some grass at the cut",
  "maybe treat yourself to a la prima run?",
  "take a hot girl walk through schenley",
  "you're doing great sweetie, maybe take a nap",
  "respectfully, you deserve a snack break"
];

const MODERATE_TIPS = [
  "front-load the heavy stuff before you lose motivation",
  "batch your readings for maximum efficiency",
  "use the pomodoro technique but make it ✨aesthetic✨",
  "turn study sessions into a main character moment",
  "pair-program for serotonin + progress"
];

const URGENT_TIPS = [
  "ok bestie time to lock in fr fr",
  "no more scroll breaks, we're in the endgame now",
  "coffee + hunt library 4th floor = unstoppable",
  "group study but actually studying this time",
  "breaks are for people who aren't you rn, soldier on"
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function generateVibeCoach(tasks: Task[], completedTasks: Task[]): VibeCoach {
  const today = new Date().toDateString();
  const now = new Date();

  // Calculate stats
  const dueToday = tasks.filter(task =>
    task.dueAt && new Date(task.dueAt).toDateString() === today
  ).length;

  const dueSoon = tasks.filter(task => {
    if (!task.dueAt) return false;
    const dueDate = new Date(task.dueAt);
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 48;
  }).length;

  const overdue = tasks.filter(task => {
    if (!task.dueAt) return false;
    return new Date(task.dueAt) < now && task.kanbanStage !== 'done';
  }).length;

  const inProgress = tasks.filter(task => task.kanbanStage === 'in_progress').length;
  const totalActiveTasks = tasks.filter(task => task.kanbanStage !== 'done').length;

  // Determine mood and energy based on workload
  let mood: string;
  let energy: number;
  let tips: string[];

  if (overdue > 0) {
    mood = getRandomItem([
      "respectfully, we're cooked",
      "it's giving panic mode",
      "crisis management era",
      "not ideal but we adapt"
    ]);
    energy = Math.max(45, 60 - (overdue * 5));
    tips = getRandomItems(URGENT_TIPS, 3);
  } else if (dueToday > 3 || dueSoon > 5) {
    mood = getRandomItem([
      "it's giving busy busy",
      "lowkey stressed but we move",
      "it's giving productive chaos",
      "chaotic good energy"
    ]);
    energy = Math.max(60, 80 - (dueSoon * 3));
    tips = getRandomItems(MODERATE_TIPS, 3);
  } else if (totalActiveTasks === 0) {
    mood = getRandomItem([
      "no thoughts just vibes",
      "literally on vacation mode",
      "touch grass szn",
      "we're so back"
    ]);
    energy = 95;
    tips = getRandomItems(CHILL_TIPS, 3);
  } else {
    mood = getRandomItem([
      "main character energy",
      "honestly thriving rn",
      "we're so back",
      "literally locked in"
    ]);
    energy = Math.min(90, 75 + (completedTasks.length * 2));
    tips = getRandomItems([...MODERATE_TIPS, ...CHILL_TIPS], 3);
  }

  // Generate summary
  let summary: string;
  if (overdue > 0) {
    summary = `${overdue} overdue ${overdue === 1 ? 'task' : 'tasks'} but we're not gonna spiral. Knock out the easy wins first, then tackle the big stuff. You got this (no really).`;
  } else if (dueToday > 2) {
    summary = `${dueToday} things due today. Stacked schedule but you got this. Protect the focus blocks and hydrate.`;
  } else if (dueSoon > 4) {
    summary = `${dueSoon} things coming up soon. Time to lock in but not lose your mind. Strategic breaks = peak performance.`;
  } else if (inProgress > 0) {
    summary = `${inProgress} in progress rn. You're literally cooking. Keep that momentum going but don't forget to eat actual food.`;
  } else if (totalActiveTasks === 0) {
    summary = `No assignments on deck. Either you're insanely ahead or something's wrong. Either way, enjoy it while it lasts bestie.`;
  } else {
    summary = `Light workload today. Perfect time to get ahead or finally do that self-care thing people keep talking about.`;
  }

  // Generate wins from completed tasks
  const wins: string[] = [];
  const recentCompleted = completedTasks.slice(0, 3);

  if (recentCompleted.length > 0) {
    recentCompleted.forEach(task => {
      wins.push(`crushed ${task.title.toLowerCase()}`);
    });
  } else {
    // Motivational wins when no completions
    wins.push("showed up (literally half the battle)");
    wins.push("opened the app (accountability queen)");
    wins.push("existing (valid af)");
  }

  return {
    mood,
    summary,
    energy,
    mantra: getRandomItem(MANTRAS),
    stats: { dueToday },
    tips,
    wins: wins.slice(0, 3)
  };
}
