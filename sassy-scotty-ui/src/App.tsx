import './App.css';
import Assignments from './components/Assignments';
import CreateTaskModal from './components/CreateTaskModal';
import MoodSelector from './components/MoodSelector';
import { mockAssignments, mockFocusBlocks, mockScheduleEvents, vibeCoach } from './data/mockData';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KanbanStage, Task } from './types/task';
import { getCurrentSprint, getAvailableSprints, getSprint, isDateInSprint, type Sprint } from './utils/sprintUtils';
import { applyTheme, getStoredTheme, type Theme } from './utils/themes';

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

const stages: StageConfig[] = [
  { id: 'brain_dump', name: 'brain dump', emoji: '🧠', background: '#f4f4f8' },
  { id: 'kinda_urgent', name: 'kinda urgent', emoji: '⏰', background: '#fff6e1' },
  { id: 'in_progress', name: 'we balling rn', emoji: '🔥', background: '#edf5ff' },
  { id: 'done', name: 'ate & left no crumbs', emoji: '✨', background: '#ecfbf2' }
];

const filters = ['all vibes', 'projects', 'exams', 'studio'];
const selfCareIdeas = [
  'Grab matcha at La Prima between classes',
  'Walk through the Cut with a friend after sunset',
  'Schedule a 20-minute stretch & reset before bed'
];

// Get or create user ID
function getUserId(): string {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
}

const API_BASE = 'http://localhost:3001';

function App() {
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [tasks, setTasks] = useState(mockAssignments);
  const [customTasks, setCustomTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(true);
  const [lastSync, setLastSync] = useState<string>('demo mode');
  const [apiUrl, setApiUrl] = useState(INITIAL_API_URL);
  const [apiInfo, setApiInfo] = useState<string | null>(INITIAL_API_NOTE ?? null);
  const [selectedSprint, setSelectedSprint] = useState<Sprint>(getCurrentSprint());
  const [availableSprints] = useState<Sprint[]>(getAvailableSprints());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(getStoredTheme());
  const apiUrlRef = useRef(INITIAL_API_URL);
  const userId = useRef(getUserId()).current;

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Load user data on mount
  useEffect(() => {
    apiUrlRef.current = apiUrl;
    loadUserData();
  }, []);

  // Save user data whenever tasks or custom tasks change
  useEffect(() => {
    if (!loading) {
      saveUserData();
    }
  }, [tasks, customTasks]);

  const loadUserData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/user/${userId}/data`);
      if (response.ok) {
        const data = await response.json();
        setCustomTasks(data.customTasks || []);
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
        kanbanState,
        settings: {
          selectedSprint: selectedSprint.number,
        },
      };

      await fetch(`${API_BASE}/api/user/${userId}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }, [userId, tasks, customTasks, selectedSprint]);

  const fetchAssignments = useCallback(async () => {
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
          const userDataResponse = await fetch(`${API_BASE}/api/user/${userId}/data`);
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

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleTaskMove = useCallback((taskId: string | number, newStage: KanbanStage) => {
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
  }, []);

  const handleCreateTask = useCallback((taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
    setCustomTasks((prev) => [...prev, newTask]);
  }, []);

  const handleDeleteTask = useCallback((taskId: string | number) => {
    setCustomTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  // Combine Canvas tasks and custom tasks
  const allTasks = useMemo(() => [...tasks, ...customTasks], [tasks, customTasks]);

  // Filter by sprint (only show tasks within current sprint date range)
  const sprintFilteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      // If task has no due date, include it (user can manually manage)
      if (!task.dueAt) return true;

      // Check if task due date falls within selected sprint
      return isDateInSprint(task.dueAt, selectedSprint);
    });
  }, [allTasks, selectedSprint]);

  const filteredTasks = useMemo(() => {
    const tasksToFilter = sprintFilteredTasks.filter((task) => task.kanbanStage !== 'done');

    switch (activeFilter) {
      case 'projects':
        return tasksToFilter.filter((task) => task.tag === 'project' || task.type === 'assignment');
      case 'exams':
        return tasksToFilter.filter((task) => task.tag === 'exam' || task.type === 'exam');
      case 'studio':
        return tasksToFilter.filter((task) => task.tag === 'studio');
      default:
        return tasksToFilter;
    }
  }, [activeFilter, sprintFilteredTasks]);

  const completedTasks = useMemo(() => {
    return sprintFilteredTasks.filter((task) => task.kanbanStage === 'done');
  }, [sprintFilteredTasks]);

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
    { label: 'focus blocks', value: mockFocusBlocks.length },
    { label: 'wins logged', value: vibeCoach.wins.length }
  ];

  const heroStatusLabel = loading ? 'syncing' : usingMock ? 'demo mode' : 'last sync';
  const heroStatusValue = loading ? 'connecting…' : lastSync;

  return (
    <div className="app-shell">
      <header className="hero card">
        <div className="brand">
          <div className="brand__badge">✨</div>
          <div>
            <p className="brand__eyebrow">CMU productivity, but make it cute</p>
            <h1>Sassy Scotty HQ</h1>
            <p className="brand__tagline">your vibe command center</p>
          </div>
        </div>
        <div className="hero__actions">
          <MoodSelector currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
          <div className="hero__meta">
            <span>{heroStatusLabel}</span>
            <strong>{heroStatusValue}</strong>
          </div>
          <button className="primary-btn" disabled={loading} onClick={fetchAssignments}>
            {loading ? 'syncing…' : '🔄 refresh the vibes'}
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
              </div>
            </header>

            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>
                  Sprint:
                </label>
                <select
                  value={selectedSprint.number}
                  onChange={(e) => setSelectedSprint(getSprint(Number(e.target.value)))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {availableSprints.map((sprint) => (
                    <option key={sprint.number} value={sprint.number}>
                      {sprint.label}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: 'auto' }}>
                  {filteredTasks.length} active tasks
                </span>
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
                  borderBottom: showCompleted ? '1px solid #e5e7eb' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onClick={() => setShowCompleted(!showCompleted)}
              >
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>completed this sprint</p>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '16px' }}>
                    {completedTasks.length} {completedTasks.length === 1 ? 'task' : 'tasks'} done
                  </h3>
                </div>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#6b7280',
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
                          background: '#f9fafb',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '18px' }}>✅</span>
                            <strong style={{ fontSize: '14px' }}>{task.title}</strong>
                          </div>
                          {task.courseCode && (
                            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{task.courseCode}</p>
                          )}
                        </div>
                        {task.source === 'manual' && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '4px 8px',
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
            <article className="card schedule-card">
              <header className="section-header compact">
                <div>
                  <p>campus schedule</p>
                  <h3>where you gotta be</h3>
                </div>
                <span>{mockScheduleEvents.length} stops</span>
              </header>
              <ul className="schedule-list">
                {mockScheduleEvents.map((event) => (
                  <li key={event.id}>
                    <div>
                      <p className="schedule-list__context">{event.context}</p>
                      <strong>{event.title}</strong>
                      <span>{event.location}</span>
                    </div>
                    <div className="schedule-list__meta">
                      <strong>{event.time}</strong>
                      <span>{event.vibe}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <div className="vertical-stack">
              <article className="card focus-card">
                <header>
                  <p>focus blocks</p>
                </header>
                <ul>
                  {mockFocusBlocks.map((block) => (
                    <li key={block.id}>
                      <div>
                        <p className="focus-card__window">{block.window}</p>
                        <strong>{block.title}</strong>
                        <span>{block.description}</span>
                      </div>
                      <div className="focus-card__meta">
                        <span>{block.energy} energy</span>
                        <p>{block.playlist}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="card mini-card">
                <header>
                  <p>self care</p>
                </header>
                <ul className="self-care">
                  {selfCareIdeas.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>
      </main>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}


export default App;
