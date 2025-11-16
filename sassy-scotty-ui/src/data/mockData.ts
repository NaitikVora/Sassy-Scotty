import type { Task } from '../types/task';

export const mockAssignments: Task[] = [
  {
    id: 'canvas-assignment-1',
    source: 'canvas',
    title: 'Mini 3 Studio Pitch Deck',
    description: 'Storyboard + deck for final design critique',
    courseCode: '51-271',
    courseName: 'Design Studio I',
    dueAt: new Date(new Date().setHours(23, 59, 0, 0)).toISOString(),
    type: 'assignment',
    status: 'pending',
    kanbanStage: 'kinda_urgent',
    priority: 'high',
    tag: 'studio',
    metadata: {
      canvasUrl: 'https://canvas.cmu.edu/courses/51/assignments/1'
    }
  },
  {
    id: 'canvas-assignment-2',
    source: 'canvas',
    title: '15-213 Bomb Lab',
    description: 'Reverse engineer stages 4-6',
    courseCode: '15-213',
    courseName: 'Intro to Computer Systems',
    dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'assignment',
    status: 'pending',
    kanbanStage: 'in_progress',
    priority: 'high',
    tag: 'project'
  },
  {
    id: 'canvas-assignment-3',
    source: 'canvas',
    title: 'Multi-Variate Quiz',
    description: 'Chapter 4 & 5',
    courseCode: '36-225',
    courseName: 'Intro Probability',
    dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'exam',
    status: 'pending',
    kanbanStage: 'kinda_urgent',
    priority: 'medium',
    tag: 'exam'
  },
  {
    id: 'canvas-assignment-4',
    source: 'canvas',
    title: 'ML Sprint Retro',
    description: 'Document findings & prepare slides',
    courseCode: '10-315',
    courseName: 'Intro to ML',
    dueAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'assignment',
    status: 'pending',
    kanbanStage: 'brain_dump',
    priority: 'medium'
  },
  {
    id: 'canvas-assignment-5',
    source: 'canvas',
    title: 'React Native Capstone feature',
    courseCode: '17-437',
    courseName: 'Mobile App Studio',
    dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'assignment',
    status: 'pending',
    kanbanStage: 'in_progress',
    priority: 'high',
    tag: 'project'
  },
  {
    id: 'canvas-assignment-6',
    source: 'canvas',
    title: 'Tech Comm 1-pager',
    courseCode: '76-270',
    courseName: 'Writing for the Professions',
    dueAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'assignment',
    status: 'pending',
    kanbanStage: 'brain_dump',
    priority: 'low'
  },
  {
    id: 'canvas-assignment-7',
    source: 'canvas',
    title: 'Discrete Structures Worksheet',
    courseCode: '15-151',
    dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    type: 'assignment',
    status: 'overdue',
    kanbanStage: 'kinda_urgent',
    priority: 'medium'
  },
  {
    id: 'canvas-assignment-8',
    source: 'canvas',
    title: 'HCI Research Critique',
    courseCode: '05-410',
    dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'assignment',
    status: 'pending',
    kanbanStage: 'brain_dump',
    priority: 'medium'
  }
];

export interface ScheduleEvent {
  id: string;
  title: string;
  context: string;
  location: string;
  time: string;
  vibe: string;
}

export const mockScheduleEvents: ScheduleEvent[] = [
  { id: 'event-1', title: 'Systems Lecture', context: '15-213', location: 'GHC 4401', time: '10:30a — 11:50a', vibe: 'lock in' },
  { id: 'event-2', title: 'Design Studio Crit', context: '51-271', location: 'HL Center', time: '1:30p — 4:20p', vibe: 'serve looks' },
  { id: 'event-3', title: 'Study Squad @ Hunt', context: 'Focus', location: 'Hunt Library 4F', time: '6:00p — 8:00p', vibe: 'deep work' },
  { id: 'event-4', title: 'Swing by Tartan Market', context: 'Break', location: 'Cohon University Center', time: '8:15p', vibe: 'treat yo self' }
];

export interface FocusBlock {
  id: string;
  title: string;
  window: string;
  description: string;
  energy: 'low' | 'medium' | 'high';
  playlist: string;
}

export const mockFocusBlocks: FocusBlock[] = [
  { id: 'focus-1', title: 'Bomb Lab grind', window: '8:00p — 10:00p', description: 'Debug phase 5 with your lab partners', energy: 'high', playlist: 'rage coding mix' },
  { id: 'focus-2', title: 'Soft prep for quiz', window: '4:30p — 5:30p', description: 'Rewatch multi-variate stats review', energy: 'medium', playlist: 'lofi math' },
  { id: 'focus-3', title: 'Draft tech comm', window: '10:00a — 11:00a', description: 'Outline the main takeaways + call-to-action', energy: 'low', playlist: 'acoustic clarity' }
];

export const vibeCoach = {
  mood: "it's giving busy busy",
  summary: 'Stacked schedule but you got this. Protect the evening focus blocks and hydrate.',
  energy: 78,
  mantra: 'keep the pressure, not the stress',
  stats: {
    dueToday: 2,
  },
  tips: [
    'front-load design studio deliverables before crit',
    'pair-program bomb lab for serotonin + progress',
    'turn your study squad into a mini accountability circle'
  ],
  wins: [
    'Submitted internship app on time',
    'Crushed the 213 quiz last week',
    'You finally slept 7+ hours last night'
  ]
};
