import './App.css';
import Assignments from './components/Assignments';
import CreateTaskModal from './components/CreateTaskModal';
import MoodSelector from './components/MoodSelector';
import PreferencesModal from './components/PreferencesModal';
import { mockAssignments, mockScheduleEvents, type ScheduleEvent } from './data/mockData';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KanbanStage, Task } from './types/task';
import { getCurrentSprint, getSprint, isDateInSprint, type Sprint } from './utils/sprintUtils';
import { applyTheme, getStoredTheme, type Theme } from './utils/themes';
import { generateVibeCoach } from './utils/vibeCoach';

interface FocusNote {
  id: string;
  text: string;
}

interface StageConfig {
  id: KanbanStage;
  name: string;
  emoji: string;
  background: string;
}

const DEFAULT_API_ENDPOINT = '/api/assignments';

function sanitizeApiUrl(rawUrl?: string): { url: string; note?: string } {
  if (!rawUrl) {
    return { url: DEFAULT_API_ENDPOINT };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { url: DEFAULT_API_ENDPOINT };
  }

  const lower = trimmed.toLowerCase();
  const isAbsolute = lower.startsWith('http://') || lower.startsWith('https://');

  if (isAbsolute) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname.includes('canvas.')) {
        return {
          url: DEFAULT_API_ENDPOINT,
          note: 'Direct Canvas URLs are blocked in the browser. Using the local /api/assignments gateway instead.',
        };
      }
      return { url: parsed.toString() };
    } catch {
      return { url: DEFAULT_API_ENDPOINT };
    }
  }

  return { url: trimmed };
}

const rawCanvasApiUrl = import.meta.env.VITE_CANVAS_API_URL as string | undefined;
const { url: INITIAL_API_URL, note: INITIAL_API_NOTE } = sanitizeApiUrl(rawCanvasApiUrl);

const apiBaseEnv = (import.meta.env.VITE_HTTP_GATEWAY_BASE as string | undefined)?.trim() ?? '';
const API_BASE = apiBaseEnv.replace(/\/$/, '');
const CANVAS_PROXY_ENABLED = typeof __CANVAS_PROXY_ENABLED__ === 'undefined' ? true : __CANVAS_PROXY_ENABLED__;
const IS_CANVAS_GATEWAY_OFFLINE = !API_BASE && !CANVAS_PROXY_ENABLED;

const buildApiUrl = (path: string): string => {
  if (!API_BASE) return path;
  if (path.startsWith('/')) {
    return `${API_BASE}${path}`;
  }
  return `${API_BASE}/${path}`;
};

const stages: StageConfig[] = [
  { id: 'brain_dump', name: 'brain dump', emoji: '🧠', background: '#f4f4f8' },
  { id: 'kinda_urgent', name: 'kinda urgent', emoji: '⏰', background: '#fff6e1' },
  { id: 'in_progress', name: 'we balling rn', emoji: '🔥', background: '#edf5ff' },
  { id: 'done', name: 'ate & left no crumbs', emoji: '✨', background: '#ecfbf2' }
];

const filters = ['all vibes', 'projects', 'exams', 'studio'];
const cmuSelfCareTips = [
  'Grab matcha at La Prima between classes',
  'Walk through the Cut with a friend after sunset',
  'Schedule a 20-minute stretch & reset before bed',
  'Hit the gym at CFA or Wiegand before dinner',
  'Take a study break at Schenley Park',
  'Check out a free yoga class at University Center',
  'Visit the Wellness Initiatives Office in Morewood',
  'Grab bubble tea at Kung Fu Tea on Forbes',
  'Take a power nap in a Hunt Library study pod',
  'Call the Counseling & Psychological Services (412-268-2922)',
  'Join an outdoor adventure with Venture Outdoors',
  'Meditate at the Danforth Chapel',
  'Play ping pong or pool at Cohon',
  'Watch the sunset from Flagstaff Hill',
  'Get fresh air along the Mon River Trail',
  'Visit CMU Health Services if you\'re feeling unwell',
  'Take advantage of free therapy at CaPS',
  'Try a new food spot in Oakland',
  'Study with natural light in Sorrells Library',
  'Join an intramural sports team for fun',
  'Attend a free concert at the School of Music',
  'Take a mental health day when you need it'
];

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Get or create user ID
function getUserId(): string {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const TASKS_CACHE_KEY = 'canvas_tasks_cache';
const TASKS_TIMESTAMP_KEY = 'canvas_tasks_timestamp';
const KANBAN_STATE_KEY = 'kanban_state_local';
const KANBAN_TIMESTAMP_KEY = 'kanban_state_timestamp';
const FOCUS_NOTES_KEY = 'focus_notes_cache';
const CUSTOM_TASKS_KEY = 'custom_tasks_cache';

// Cache helpers for tasks
function getCachedTasks(): Task[] | null {
  try {
    const cached = localStorage.getItem(TASKS_CACHE_KEY);
    const timestamp = localStorage.getItem(TASKS_TIMESTAMP_KEY);

    if (!cached || !timestamp) return null;

    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CACHE_DURATION) {
      // Cache expired
      localStorage.removeItem(TASKS_CACHE_KEY);
      localStorage.removeItem(TASKS_TIMESTAMP_KEY);
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to read cache:', error);
    return null;
  }
}

function setCachedTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasks));
    localStorage.setItem(TASKS_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to write cache:', error);
  }
}

// Local database helpers for kanban state
function getLocalKanbanState(): Record<string, KanbanStage> {
  try {
    const cached = localStorage.getItem(KANBAN_STATE_KEY);
    if (!cached) return {};
    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to read local kanban state:', error);
    return {};
  }
}

function setLocalKanbanState(state: Record<string, KanbanStage>): void {
  try {
    localStorage.setItem(KANBAN_STATE_KEY, JSON.stringify(state));
    localStorage.setItem(KANBAN_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to write local kanban state:', error);
  }
}

function updateLocalKanbanState(taskId: string, stage: KanbanStage): void {
  const currentState = getLocalKanbanState();
  currentState[taskId] = stage;
  setLocalKanbanState(currentState);
}

// Local storage helpers for focus notes and custom tasks
function getCachedFocusNotes(): FocusNote[] {
  try {
    const cached = localStorage.getItem(FOCUS_NOTES_KEY);
    if (!cached) return [];
    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to read cached focus notes:', error);
    return [];
  }
}

function setCachedFocusNotes(notes: FocusNote[]): void {
  try {
    localStorage.setItem(FOCUS_NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Failed to cache focus notes:', error);
  }
}

function getCachedCustomTasks(): Task[] {
  try {
    const cached = localStorage.getItem(CUSTOM_TASKS_KEY);
    if (!cached) return [];
    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to read cached custom tasks:', error);
    return [];
  }
}

function setCachedCustomTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(CUSTOM_TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to cache custom tasks:', error);
  }
}

function mergeKanbanStates(local: Record<string, KanbanStage>, backend: Record<string, KanbanStage>): Record<string, KanbanStage> {
  // Merge with local taking precedence for recent changes
  const localTimestamp = localStorage.getItem(KANBAN_TIMESTAMP_KEY);
  const localAge = localTimestamp ? Date.now() - parseInt(localTimestamp, 10) : Infinity;

  // If local state is very recent (< 5 minutes), prefer it
  if (localAge < 5 * 60 * 1000) {
    return { ...backend, ...local };
  }

  // Otherwise prefer backend
  return { ...local, ...backend };
}

// Fun emojis that rotate on each refresh
const vibeEmojis = ['🎯', '🚀', '✨', '🔥', '💯', '⚡', '🎨', '🌟', '💪', '🎪', '🦄', '🌈', '🎭', '🎸', '🎮'];

function getRandomEmoji(): string {
  return vibeEmojis[Math.floor(Math.random() * vibeEmojis.length)];
}

function App() {
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customTasks, setCustomTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');
  const [apiUrl, setApiUrl] = useState(INITIAL_API_URL);
  const [apiInfo, setApiInfo] = useState<string | null>(INITIAL_API_NOTE ?? null);
  const [selectedSprint, setSelectedSprint] = useState<Sprint>(getCurrentSprint());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(getStoredTheme());
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(mockScheduleEvents);
  const [focusNotes, setFocusNotes] = useState<FocusNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [selfCareTips, setSelfCareTips] = useState<string[]>(() => getRandomItems(cmuSelfCareTips, 4));
  const [noteCardColor, setNoteCardColor] = useState<string>('#fef3c7'); // Default sticky note color
  const [brandEmoji] = useState<string>(() => getRandomEmoji()); // Random emoji on mount
  const apiUrlRef = useRef(INITIAL_API_URL);
  const userId = useRef(getUserId()).current;

  const noteCardColors = [
    { name: 'yellow', color: '#fef3c7' },
    { name: 'pink', color: '#fce7f3' },
    { name: 'blue', color: '#dbeafe' },
    { name: 'green', color: '#d1fae5' },
    { name: 'purple', color: '#e9d5ff' },
    { name: 'orange', color: '#fed7aa' },
  ];

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Load user data and cached tasks on mount
  useEffect(() => {
    apiUrlRef.current = apiUrl;

    // Load from cache immediately for fast initial render
    const cachedTasks = getCachedTasks();
    const localKanbanState = getLocalKanbanState();
    const cachedNotes = getCachedFocusNotes();
    const cachedCustomTasks = getCachedCustomTasks();

    // Load cached notes and custom tasks immediately
    if (cachedNotes.length > 0) {
      setFocusNotes(cachedNotes);
    }
    if (cachedCustomTasks.length > 0) {
      setCustomTasks(cachedCustomTasks);
    }

    if (cachedTasks && cachedTasks.length > 0) {
      // Apply local kanban state immediately for instant UI
      const tasksWithLocalState = cachedTasks.map((task: Task) => ({
        ...task,
        kanbanStage: localKanbanState[task.id.toString()] || task.kanbanStage || 'brain_dump',
      }));

      setTasks(tasksWithLocalState);
      setUsingMock(false);
      const timestamp = localStorage.getItem(TASKS_TIMESTAMP_KEY);
      if (timestamp) {
        const cacheDate = new Date(parseInt(timestamp, 10));
        setLastSync(cacheDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      }
    }

    // Load user data and sync with backend in background
    loadUserData();

    // Load campus events on mount
    fetchCampusEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard navigation for sprints
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft' && e.shiftKey && selectedSprint.number > 1) {
        e.preventDefault();
        setSelectedSprint(getSprint(selectedSprint.number - 1));
      } else if (e.key === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        setSelectedSprint(getSprint(selectedSprint.number + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSprint]);

  // Save user data whenever tasks, custom tasks, or focus notes change
  useEffect(() => {
    if (!loading) {
      saveUserData();
    }
  }, [tasks, customTasks, focusNotes]);

  const loadUserData = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/user/${userId}/data`));
      if (response.ok) {
        const data = await response.json();
        setCustomTasks(data.customTasks || []);
        setFocusNotes(data.focusNotes || []);
        if (data.settings?.selectedCourses) {
          setSelectedCourses(data.settings.selectedCourses);
        }

        // Merge backend kanban state with local state
        if (data.kanbanState) {
          const localState = getLocalKanbanState();
          const mergedState = mergeKanbanStates(localState, data.kanbanState);

          // Update local cache with merged state
          setLocalKanbanState(mergedState);

          // Apply merged state to current tasks
          setTasks((prevTasks) =>
            prevTasks.map((task) => ({
              ...task,
              kanbanStage: mergedState[task.id.toString()] || task.kanbanStage || 'brain_dump',
            }))
          );
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, [userId]);

  const saveUserData = useCallback(async () => {
    try {
      // Prepare kanban state
      const kanbanState = [...tasks, ...customTasks].reduce((acc, task) => {
        acc[task.id.toString()] = task.kanbanStage || 'brain_dump';
        return acc;
      }, {} as Record<string, KanbanStage>);

      const data = {
        customTasks,
        focusNotes,
        kanbanState,
        settings: {
          selectedSprint: selectedSprint.number,
          selectedCourses,
        },
      };

      await fetch(buildApiUrl(`/api/user/${userId}/data`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }, [userId, tasks, customTasks, selectedSprint, selectedCourses]);

  const fetchAssignments = useCallback(async (forceRefresh: boolean = false) => {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cachedTasks = getCachedTasks();
      if (cachedTasks && cachedTasks.length > 0) {
        // Use local kanban state first, then merge with backend
        const localKanbanState = getLocalKanbanState();

        try {
          const userDataResponse = await fetch(buildApiUrl(`/api/user/${userId}/data`));
          if (userDataResponse.ok) {
            const userData = await userDataResponse.json();
            const backendKanbanState = userData.kanbanState || {};
            const mergedState = mergeKanbanStates(localKanbanState, backendKanbanState);

            // Update local cache with merged state
            setLocalKanbanState(mergedState);

            const tasksWithState = cachedTasks.map((task: Task) => ({
              ...task,
              kanbanStage: mergedState[task.id.toString()] || task.kanbanStage || 'brain_dump',
            }));

            setTasks(tasksWithState);
          } else {
            // Use local state only if backend fails
            const tasksWithLocalState = cachedTasks.map((task: Task) => ({
              ...task,
              kanbanStage: localKanbanState[task.id.toString()] || task.kanbanStage || 'brain_dump',
            }));
            setTasks(tasksWithLocalState);
          }
        } catch (err) {
          console.error('Failed to load kanban state:', err);
          // Use local state as fallback
          const tasksWithLocalState = cachedTasks.map((task: Task) => ({
            ...task,
            kanbanStage: localKanbanState[task.id.toString()] || task.kanbanStage || 'brain_dump',
          }));
          setTasks(tasksWithLocalState);
        }
        return; // Use cache, skip Canvas fetch
      }
    }

    setLoading(true);
    setError(null);
    const startUrl = apiUrlRef.current ?? INITIAL_API_URL;
    const urlsToTry = startUrl === DEFAULT_API_ENDPOINT ? [startUrl] : [startUrl, DEFAULT_API_ENDPOINT];
    let lastError: Error | null = null;

    for (const url of urlsToTry) {
      try {
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!response.ok) {
          throw new Error(`Canvas API error: ${response.status}`);
        }

        const data = await response.json();
        const fetchedTasks = Array.isArray(data?.tasks)
          ? data.tasks
          : Array.isArray(data?.assignments)
            ? data.assignments
            : [];

        // Restore kanban state from backend
        let kanbanState: Record<string, KanbanStage> = {};
        try {
          const userDataResponse = await fetch(buildApiUrl(`/api/user/${userId}/data`));
          if (userDataResponse.ok) {
            const userData = await userDataResponse.json();
            kanbanState = userData.kanbanState || {};
          }
        } catch (err) {
          console.error('Failed to load kanban state:', err);
        }

        const tasksWithState = fetchedTasks.map((task: Task) => ({
          ...task,
          kanbanStage: kanbanState[task.id.toString()] || task.kanbanStage || 'brain_dump',
        }));

        // Cache the fetched tasks
        setCachedTasks(tasksWithState);

        setTasks(tasksWithState);
        setUsingMock(false);
        if (apiUrlRef.current !== url) {
          apiUrlRef.current = url;
          setApiUrl(url);
        }
        setLastSync(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
        setApiInfo(() => {
          if (INITIAL_API_NOTE) {
            return INITIAL_API_NOTE;
          }
          if (url === DEFAULT_API_ENDPOINT && urlsToTry.length > 1) {
            return 'Using fallback /api/assignments gateway. Ensure the Canvas bridge server is running or update VITE_CANVAS_API_URL.';
          }
          return null;
        });
        setLoading(false);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Failed to reach assignments API');
      }
    }

    const message = lastError?.message ?? 'Unable to reach assignments API';
    setError(`Canvas sync failed: ${message}`);
    setTasks(mockAssignments);
    setUsingMock(true);
    setLastSync('demo mode');
    setApiInfo('Serving mock data until the Canvas gateway is reachable.');
    setLoading(false);
  }, [apiUrl, userId]);

  const fetchCampusEvents = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/campus-events?limit=4`));
      if (!response.ok) {
        throw new Error(`Campus events API error: ${response.status}`);
      }

      const data = await response.json();
      const events = Array.isArray(data?.events) ? data.events : [];

      // Filter to only show today's events
      const today = new Date();
      const todayEvents = events.filter((event: any) => {
        const startDate = new Date(event.start);
        return startDate.toDateString() === today.toDateString();
      });

      // Transform campus event data to ScheduleEvent format
      const scheduleEvents: ScheduleEvent[] = todayEvents.map((event: any) => {
        const startDate = new Date(event.start);

        // Since we're only showing today's events, just show the time
        const timeStr = startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

        // Generate fun vibes based on event title
        let vibe = 'check it out';
        const title = event.title.toLowerCase();
        if (title.includes('career') || title.includes('job') || title.includes('recruit')) {
          vibe = 'secure the bag';
        } else if (title.includes('workshop') || title.includes('seminar')) {
          vibe = 'expand the brain';
        } else if (title.includes('social') || title.includes('mixer') || title.includes('party')) {
          vibe = 'touch grass';
        } else if (title.includes('food') || title.includes('lunch') || title.includes('dinner')) {
          vibe = 'free food szn';
        } else if (title.includes('competition') || title.includes('hackathon')) {
          vibe = 'lock in';
        }

        return {
          id: event.id,
          title: event.title,
          context: event.location || 'Location TBD',
          location: event.location || 'Location TBD',
          time: timeStr,
          vibe,
        };
      });

      setScheduleEvents(scheduleEvents.length > 0 ? scheduleEvents : mockScheduleEvents);
    } catch (error) {
      console.error('Failed to fetch campus events:', error);
      setScheduleEvents(mockScheduleEvents);
    }
  }, []);

  // Don't fetch automatically on mount - use cache instead
  // Only fetch when user explicitly requests it via the refresh button

  const handleTaskMove = useCallback((taskId: string | number, newStage: KanbanStage) => {
    // Save to local storage immediately for instant persistence
    updateLocalKanbanState(taskId.toString(), newStage);

    // Update UI state
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId || task.id.toString() === taskId.toString()
          ? { ...task, kanbanStage: newStage }
          : task
      )
    );
    setCustomTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId || task.id.toString() === taskId.toString()
          ? { ...task, kanbanStage: newStage }
          : task
      )
    );

    // Backend sync happens automatically via useEffect
  }, []);

  const handleCreateTask = useCallback((taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
    setCustomTasks((prev) => {
      const updated = [...prev, newTask];
      setCachedCustomTasks(updated);
      return updated;
    });
  }, []);

  const handleDeleteTask = useCallback((taskId: string | number) => {
    setCustomTasks((prev) => {
      const updated = prev.filter((task) => task.id !== taskId);
      setCachedCustomTasks(updated);
      return updated;
    });
  }, []);

  const handleAddNote = useCallback(() => {
    if (newNoteText.trim()) {
      const newNote: FocusNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        text: newNoteText.trim(),
      };
      setFocusNotes((prev) => {
        const updated = [...prev, newNote];
        setCachedFocusNotes(updated);
        return updated;
      });
      setNewNoteText('');
    }
  }, [newNoteText]);

  const handleDeleteNote = useCallback((noteId: string) => {
    setFocusNotes((prev) => {
      const updated = prev.filter((note) => note.id !== noteId);
      setCachedFocusNotes(updated);
      return updated;
    });
  }, []);

  const shuffleSelfCareTips = useCallback(() => {
    setSelfCareTips(getRandomItems(cmuSelfCareTips, 4));
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchAssignments(true); // Force refresh from Canvas
    await fetchCampusEvents(); // Also refresh campus events
  }, [fetchAssignments, fetchCampusEvents]);

  // Initialize selected courses when tasks first load
  useEffect(() => {
    if (tasks.length > 0 && selectedCourses.length === 0) {
      const allCourses = Array.from(
        new Set(
          tasks
            .filter((task) => task.courseCode)
            .map((task) => task.courseCode as string)
        )
      );
      setSelectedCourses(allCourses);
    }
  }, [tasks, selectedCourses.length]);

  // Combine Canvas tasks and custom tasks
  const allTasks = useMemo(() => [...tasks, ...customTasks], [tasks, customTasks]);

  // Filter by sprint and selected courses
  const sprintFilteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      // Filter by selected courses (if task has a course code)
      if (task.courseCode && selectedCourses.length > 0 && !selectedCourses.includes(task.courseCode)) {
        return false;
      }

      // If task has no due date, include it (user can manually manage)
      if (!task.dueAt) return true;

      // Check if task due date falls within selected sprint
      return isDateInSprint(task.dueAt, selectedSprint);
    });
  }, [allTasks, selectedSprint, selectedCourses]);

  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case 'projects':
        return sprintFilteredTasks.filter((task) => task.tag === 'project' || task.type === 'assignment');
      case 'exams':
        return sprintFilteredTasks.filter((task) => task.tag === 'exam' || task.type === 'exam');
      case 'studio':
        return sprintFilteredTasks.filter((task) => task.tag === 'studio');
      default:
        return sprintFilteredTasks;
    }
  }, [activeFilter, sprintFilteredTasks]);

  const completedTasks = useMemo(() => {
    return sprintFilteredTasks.filter((task) => task.kanbanStage === 'done');
  }, [sprintFilteredTasks]);

  // Generate dynamic vibe coach based on actual tasks
  const vibeCoach = useMemo(() => {
    return generateVibeCoach(sprintFilteredTasks, completedTasks);
  }, [sprintFilteredTasks, completedTasks]);

  const urgentTasks = useMemo(() => sprintFilteredTasks.filter((task) => task.kanbanStage === 'kinda_urgent'), [sprintFilteredTasks]);
  const hotList = useMemo(() => urgentTasks.slice(0, 3), [urgentTasks]);
  const dueTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return sprintFilteredTasks.filter((task) => task.dueAt && new Date(task.dueAt).toDateString() === today).length;
  }, [sprintFilteredTasks]);
  const inProgressCount = useMemo(() => sprintFilteredTasks.filter((task) => task.kanbanStage === 'in_progress').length, [sprintFilteredTasks]);

  const stats = [
    { label: 'due today', value: dueTodayCount },
    { label: 'in progress', value: inProgressCount },
    { label: 'quick notes', value: focusNotes.length },
    { label: 'wins logged', value: vibeCoach.wins.length }
  ];

  const heroStatusLabel = loading ? 'syncing' : usingMock ? 'demo mode' : 'last sync';
  const heroStatusValue = loading ? 'connecting…' : lastSync;

  return (
    <div className="app-shell">
      <header className="hero card">
        <div className="brand">
          <div className="brand__badge">{brandEmoji}</div>
          <div>
            <h1 className="brand__title">scotty szn</h1>
            <p className="brand__tagline">cmu productivity hits different</p>
          </div>
        </div>
        <div className="hero__actions">
          <MoodSelector currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
          <div className="hero__meta">
            <span>{heroStatusLabel}</span>
            <strong>{heroStatusValue}</strong>
          </div>
          <button className="primary-btn" disabled={loading} onClick={handleRefresh}>
            {loading ? 'syncing…' : '🔄 sync canvas'}
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="left-column">
          <article className="card vibe-card">
            <div className="vibe-card__header">
              <div>
                <p>scotty&apos;s take</p>
                <h2>{vibeCoach.mood}</h2>
              </div>
              <div className="vibe-card__emoji">🔥</div>
            </div>
            <p className="vibe-card__summary">{vibeCoach.summary}</p>
            <div className="vibe-card__mantra">
              <p>mantra</p>
              <strong>{vibeCoach.mantra}</strong>
            </div>
            <div className="vibe-card__energy">
              <div>
                <span>energy</span>
                <strong>{vibeCoach.energy}%</strong>
              </div>
              <div>
                <span>focus streak</span>
                <strong>3 days</strong>
              </div>
            </div>
            <ul className="vibe-card__tips">
              {vibeCoach.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </article>

          <article className="card mini-card">
            <header>
              <p>daily wins</p>
            </header>
            <ul className="wins-list">
              {vibeCoach.wins.map((win) => (
                <li key={win}>{win}</li>
              ))}
            </ul>
          </article>

          <article className="card mini-card">
            <header>
              <p>quick stats</p>
            </header>
            <div className="stats-grid">
              {stats.map((stat) => (
                <div key={stat.label} className="stats-item">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="card mini-card">
            <header>
              <p>hot list</p>
              <span>{hotList.length}</span>
            </header>
            <ul className="hot-list">
              {hotList.map((task) => (
                <li key={task.id}>
                  <div>
                    <p className="hot-list__tag">{task.tag || task.type}</p>
                    <strong>{task.title}</strong>
                    <span>{task.courseCode}</span>
                  </div>
                  {task.dueAt && (
                    <time>{new Date(task.dueAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</time>
                  )}
                </li>
              ))}
            </ul>
          </article>

          <article className="card">
            <header className="section-header compact">
              <div>
                <p>tartan connect</p>
                <h3>campus events today</h3>
              </div>
            </header>
            <div className="campus-events-grid">
              {scheduleEvents.slice(0, 4).map((event) => (
                <div key={event.id} className="campus-event-tile">
                  <strong className="event-title">{event.title}</strong>
                  <p className="event-time">{event.time}</p>
                  <p className="event-location">{event.location}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="main-column">
          <article className="card board-card">
            <header className="section-header">
              <div>
                <p>today&apos;s mission</p>
                <h2>assignments & vibes</h2>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="filter-bar">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      className={filter === activeFilter ? 'chip active' : 'chip'}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <button className="primary-btn" onClick={() => setIsCreateModalOpen(true)}>
                  + new task
                </button>
                <button
                  onClick={() => setIsPreferencesOpen(true)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-card-background)',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  title="Filter courses"
                >
                  ⚙️ preferences
                </button>
              </div>
            </header>

            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-background-secondary)',
              transition: 'background-color 0.3s ease'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Sprint:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedSprint(getSprint(selectedSprint.number - 1))}
                      disabled={selectedSprint.number <= 1}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--color-card-background)',
                        color: 'var(--color-text-primary)',
                        cursor: selectedSprint.number <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        opacity: selectedSprint.number <= 1 ? 0.4 : 1,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px var(--color-shadow)',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedSprint.number > 1) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px var(--color-shadow)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px var(--color-shadow)';
                      }}
                      title="Previous sprint (Shift + ←)"
                    >
                      ←
                    </button>
                    <div style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      background: 'var(--color-primary)',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      minWidth: '220px',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px var(--color-shadow)',
                    }}>
                      {selectedSprint.label}
                    </div>
                    <button
                      onClick={() => setSelectedSprint(getSprint(selectedSprint.number + 1))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--color-card-background)',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px var(--color-shadow)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px var(--color-shadow)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px var(--color-shadow)';
                      }}
                      title="Next sprint (Shift + →)"
                    >
                      →
                    </button>
                  </div>
                  {selectedSprint.number !== getCurrentSprint().number && (
                    <button
                      onClick={() => setSelectedSprint(getCurrentSprint())}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-primary)',
                        background: 'transparent',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-primary)';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      title="Jump to current sprint"
                    >
                      Today
                    </button>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '13px',
                  color: 'var(--color-text-muted)'
                }}>
                  <span>
                    <strong style={{ color: 'var(--color-primary)' }}>{filteredTasks.length}</strong> active
                  </span>
                  {completedTasks.length > 0 && (
                    <span>
                      <strong style={{ color: 'var(--color-success)' }}>{completedTasks.length}</strong> completed
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="board-status">
              {loading && <div className="alert alert--info">Syncing with Canvas…</div>}
              {error && (
                <div className="alert alert--error">
                  {error}
                  <span>Showing mock data while we get reconnected.</span>
                </div>
              )}
              {!loading && !error && usingMock && (
                <div className="alert alert--info">Showing demo data. Connect the Canvas server and refresh.</div>
              )}
              {!loading && !error && apiInfo && (
                <div className="alert alert--info">{apiInfo}</div>
              )}
            </div>

            <Assignments stages={stages} tasks={filteredTasks} onTaskMove={handleTaskMove} />
          </article>

          {completedTasks.length > 0 && (
            <article className="card" style={{ marginTop: '20px' }}>
              <header
                style={{
                  padding: '16px 20px',
                  borderBottom: showCompleted ? '1px solid var(--color-border)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'border-color 0.3s ease',
                }}
                onClick={() => setShowCompleted(!showCompleted)}
              >
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, transition: 'color 0.3s ease' }}>completed this sprint</p>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', color: 'var(--color-text-primary)', transition: 'color 0.3s ease' }}>
                    {completedTasks.length} {completedTasks.length === 1 ? 'task' : 'tasks'} done
                  </h3>
                </div>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {showCompleted ? '▼' : '▶'}
                </button>
              </header>
              {showCompleted && (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          padding: '12px 16px',
                          background: 'var(--color-background-secondary)',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background-color 0.3s ease',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '18px' }}>✅</span>
                            <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)', transition: 'color 0.3s ease' }}>{task.title}</strong>
                          </div>
                          {task.courseCode && (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, transition: 'color 0.3s ease' }}>{task.courseCode}</p>
                          )}
                        </div>
                        {task.source === 'manual' && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-danger)',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '4px 8px',
                              transition: 'color 0.3s ease',
                            }}
                          >
                            delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )}

          <div className="grid-two">
            <article className="card">
              <header className="section-header compact">
                <div>
                  <h3>jot it down</h3>
                </div>
                <div className="color-picker">
                  {noteCardColors.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setNoteCardColor(item.color)}
                      className={`color-dot ${noteCardColor === item.color ? 'active' : ''}`}
                      style={{ backgroundColor: item.color }}
                      aria-label={`${item.name} color`}
                      title={item.name}
                    />
                  ))}
                </div>
              </header>
              <div className="focus-notes">
                <div className="focus-notes__input">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddNote();
                      }
                    }}
                    placeholder="Add a note or task..."
                    className="note-input"
                  />
                  <button onClick={handleAddNote} className="btn btn--primary btn--sm">
                    Add
                  </button>
                </div>
                {focusNotes.length === 0 ? (
                  <div className="focus-notes__empty">No notes yet. Pick a color and start jotting things down!</div>
                ) : (
                  <ul className="focus-notes__list post-it-grid">
                    {focusNotes.map((note) => (
                      <li
                        key={note.id}
                        className="post-it-note"
                        style={{ backgroundColor: noteCardColor }}
                      >
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="note-delete note-delete--floating"
                          aria-label="Delete note"
                        >
                          ×
                        </button>
                        <span>{note.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>

            <article className="card">
              <header className="section-header compact">
                <div>
                  <p>self care</p>
                  <h3>take a break</h3>
                </div>
                <button
                  onClick={shuffleSelfCareTips}
                  className="shuffle-btn"
                  aria-label="Shuffle tips"
                  title="Get new tips"
                >
                  ↻
                </button>
              </header>
              <div className="self-care-list">
                {selfCareTips.map((tip, index) => (
                  <div key={`${tip}-${index}`} className="self-care-tip">
                    <div className="self-care-tip__index">{index + 1}</div>
                    <p>{tip}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </main>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
      />
      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        tasks={allTasks}
        selectedCourses={selectedCourses}
        onSavePreferences={setSelectedCourses}
      />

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-made-by">made with 💙 at cmu</span>
          </div>
          <div className="footer-right">
            <a
              href="https://www.linkedin.com/in/naitikvora/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              linkedin
            </a>
            <span className="footer-separator">•</span>
            <a
              href="mailto:nvora@andrew.cmu.edu"
              className="footer-link"
            >
              nvora@andrew.cmu.edu
            </a>
            <span className="footer-separator">•</span>
            <span className="footer-credit">by naitik vora</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


export default App;
