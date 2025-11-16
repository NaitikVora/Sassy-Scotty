import './App.css';
import Assignments from './components/Assignments';
import { mockAssignments, mockFocusBlocks, mockScheduleEvents, vibeCoach } from './data/mockData';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KanbanStage } from './types/task';

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

function App() {
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [tasks, setTasks] = useState(mockAssignments);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(true);
  const [lastSync, setLastSync] = useState<string>('demo mode');
  const [apiUrl, setApiUrl] = useState(INITIAL_API_URL);
  const [apiInfo, setApiInfo] = useState<string | null>(INITIAL_API_NOTE ?? null);
  const apiUrlRef = useRef(INITIAL_API_URL);

  useEffect(() => {
    apiUrlRef.current = apiUrl;
  }, []);

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

        setTasks(fetchedTasks);
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
  }, [apiUrl]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case 'projects':
        return tasks.filter((task) => task.tag === 'project' || task.type === 'assignment');
      case 'exams':
        return tasks.filter((task) => task.tag === 'exam' || task.type === 'exam');
      case 'studio':
        return tasks.filter((task) => task.tag === 'studio');
      default:
        return tasks;
    }
  }, [activeFilter, tasks]);

  const urgentTasks = useMemo(() => tasks.filter((task) => task.kanbanStage === 'kinda_urgent'), [tasks]);
  const hotList = useMemo(() => urgentTasks.slice(0, 3), [urgentTasks]);
  const dueTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.filter((task) => task.dueAt && new Date(task.dueAt).toDateString() === today).length;
  }, [tasks]);
  const inProgressCount = useMemo(() => tasks.filter((task) => task.kanbanStage === 'in_progress').length, [tasks]);

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
            </header>

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

            <Assignments stages={stages} tasks={filteredTasks} />
          </article>

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
    </div>
  );
}

export default App;
