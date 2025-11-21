/**
 * Theme system - fun mood-based themes
 */

export interface Theme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  colors: {
    // Background colors
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;

    // Card colors
    cardBackground: string;
    cardBorder: string;

    // Text colors
    textPrimary: string;
    textSecondary: string;
    textMuted: string;

    // Brand/accent colors
    primary: string;
    primaryHover: string;
    secondary: string;

    // Status colors
    success: string;
    warning: string;
    danger: string;
    info: string;

    // Kanban stage colors
    stageBrainDump: string;
    stageUrgent: string;
    stageInProgress: string;
    stageDone: string;

    // UI elements
    border: string;
    shadow: string;
    overlay: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'library-mode',
    name: 'library mode',
    emoji: '📚',
    description: 'classic & focused',
    colors: {
      background: '#ffffff',
      backgroundSecondary: '#f9fafb',
      backgroundTertiary: '#f3f4f6',
      cardBackground: '#ffffff',
      cardBorder: '#e5e7eb',
      textPrimary: '#1f2937',
      textSecondary: '#4b5563',
      textMuted: '#9ca3af',
      primary: '#8b5cf6',
      primaryHover: '#7c3aed',
      secondary: '#6366f1',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
      stageBrainDump: '#f4f4f8',
      stageUrgent: '#fff6e1',
      stageInProgress: '#edf5ff',
      stageDone: '#ecfbf2',
      border: '#e5e7eb',
      shadow: 'rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
  },
  {
    id: 'late-night-grind',
    name: 'late night grind',
    emoji: '🌙',
    description: '3am energy',
    colors: {
      background: '#0f172a',
      backgroundSecondary: '#1e293b',
      backgroundTertiary: '#334155',
      cardBackground: '#1e293b',
      cardBorder: '#334155',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#64748b',
      primary: '#a78bfa',
      primaryHover: '#8b5cf6',
      secondary: '#818cf8',
      success: '#34d399',
      warning: '#fbbf24',
      danger: '#f87171',
      info: '#60a5fa',
      stageBrainDump: '#1e293b',
      stageUrgent: '#422006',
      stageInProgress: '#1e3a8a',
      stageDone: '#065f46',
      border: '#334155',
      shadow: 'rgba(0, 0, 0, 0.4)',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
  },
  {
    id: 'coffee-shop',
    name: 'coffee shop',
    emoji: '☕',
    description: 'warm & cozy',
    colors: {
      background: '#fef3e2',
      backgroundSecondary: '#fde9c9',
      backgroundTertiary: '#fad7a0',
      cardBackground: '#ffffff',
      cardBorder: '#f5d5a8',
      textPrimary: '#3e2723',
      textSecondary: '#5d4037',
      textMuted: '#8d6e63',
      primary: '#d97706',
      primaryHover: '#b45309',
      secondary: '#ea580c',
      success: '#16a34a',
      warning: '#ca8a04',
      danger: '#dc2626',
      info: '#0284c7',
      stageBrainDump: '#fef3e2',
      stageUrgent: '#fed7aa',
      stageInProgress: '#dbeafe',
      stageDone: '#d1fae5',
      border: '#f5d5a8',
      shadow: 'rgba(217, 119, 6, 0.15)',
      overlay: 'rgba(62, 39, 35, 0.5)',
    },
  },
  {
    id: 'neon-hustle',
    name: 'neon hustle',
    emoji: '⚡',
    description: 'electric focus',
    colors: {
      background: '#18181b',
      backgroundSecondary: '#27272a',
      backgroundTertiary: '#3f3f46',
      cardBackground: '#27272a',
      cardBorder: '#52525b',
      textPrimary: '#fafafa',
      textSecondary: '#e4e4e7',
      textMuted: '#a1a1aa',
      primary: '#22d3ee',
      primaryHover: '#06b6d4',
      secondary: '#a855f7',
      success: '#4ade80',
      warning: '#fb923c',
      danger: '#f43f5e',
      info: '#38bdf8',
      stageBrainDump: '#27272a',
      stageUrgent: '#713f12',
      stageInProgress: '#1e3a8a',
      stageDone: '#14532d',
      border: '#52525b',
      shadow: 'rgba(34, 211, 238, 0.2)',
      overlay: 'rgba(0, 0, 0, 0.75)',
    },
  },
  {
    id: 'sunrise-vibes',
    name: 'sunrise vibes',
    emoji: '🌅',
    description: 'fresh start energy',
    colors: {
      background: '#fff7ed',
      backgroundSecondary: '#ffedd5',
      backgroundTertiary: '#fed7aa',
      cardBackground: '#ffffff',
      cardBorder: '#fdba74',
      textPrimary: '#7c2d12',
      textSecondary: '#9a3412',
      textMuted: '#c2410c',
      primary: '#f97316',
      primaryHover: '#ea580c',
      secondary: '#fb923c',
      success: '#22c55e',
      warning: '#eab308',
      danger: '#ef4444',
      info: '#3b82f6',
      stageBrainDump: '#fff7ed',
      stageUrgent: '#fef3c7',
      stageInProgress: '#dbeafe',
      stageDone: '#d1fae5',
      border: '#fdba74',
      shadow: 'rgba(249, 115, 22, 0.15)',
      overlay: 'rgba(124, 45, 18, 0.5)',
    },
  },
  {
    id: 'zen-focus',
    name: 'zen focus',
    emoji: '🧘',
    description: 'calm productivity',
    colors: {
      background: '#f0fdf4',
      backgroundSecondary: '#dcfce7',
      backgroundTertiary: '#bbf7d0',
      cardBackground: '#ffffff',
      cardBorder: '#86efac',
      textPrimary: '#14532d',
      textSecondary: '#166534',
      textMuted: '#22c55e',
      primary: '#16a34a',
      primaryHover: '#15803d',
      secondary: '#4ade80',
      success: '#10b981',
      warning: '#facc15',
      danger: '#f43f5e',
      info: '#0ea5e9',
      stageBrainDump: '#f0fdf4',
      stageUrgent: '#fef9c3',
      stageInProgress: '#e0f2fe',
      stageDone: '#d1fae5',
      border: '#86efac',
      shadow: 'rgba(22, 163, 74, 0.1)',
      overlay: 'rgba(20, 83, 45, 0.5)',
    },
  },
  {
    id: 'lavender-dream',
    name: 'lavender dream',
    emoji: '💜',
    description: 'soft & aesthetic',
    colors: {
      background: '#faf5ff',
      backgroundSecondary: '#f3e8ff',
      backgroundTertiary: '#e9d5ff',
      cardBackground: '#ffffff',
      cardBorder: '#d8b4fe',
      textPrimary: '#581c87',
      textSecondary: '#6b21a8',
      textMuted: '#a855f7',
      primary: '#a855f7',
      primaryHover: '#9333ea',
      secondary: '#c084fc',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#f43f5e',
      info: '#8b5cf6',
      stageBrainDump: '#faf5ff',
      stageUrgent: '#fef3c7',
      stageInProgress: '#ddd6fe',
      stageDone: '#d1fae5',
      border: '#d8b4fe',
      shadow: 'rgba(168, 85, 247, 0.15)',
      overlay: 'rgba(88, 28, 135, 0.5)',
    },
  },
  {
    id: 'ocean-breeze',
    name: 'ocean breeze',
    emoji: '🌊',
    description: 'cool & refreshing',
    colors: {
      background: '#ecfeff',
      backgroundSecondary: '#cffafe',
      backgroundTertiary: '#a5f3fc',
      cardBackground: '#ffffff',
      cardBorder: '#67e8f9',
      textPrimary: '#164e63',
      textSecondary: '#0e7490',
      textMuted: '#06b6d4',
      primary: '#06b6d4',
      primaryHover: '#0891b2',
      secondary: '#22d3ee',
      success: '#14b8a6',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
      stageBrainDump: '#ecfeff',
      stageUrgent: '#fef3c7',
      stageInProgress: '#bae6fd',
      stageDone: '#ccfbf1',
      border: '#67e8f9',
      shadow: 'rgba(6, 182, 212, 0.15)',
      overlay: 'rgba(22, 78, 99, 0.5)',
    },
  },
];

export function getTheme(id: string): Theme {
  return themes.find((theme) => theme.id === id) || themes[0];
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case for CSS variables
    const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });

  // Store theme ID in localStorage
  localStorage.setItem('selectedTheme', theme.id);
}

export function getStoredTheme(): Theme {
  const storedId = localStorage.getItem('selectedTheme');
  return storedId ? getTheme(storedId) : themes[0];
}
