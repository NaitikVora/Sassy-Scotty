# Sassy Scotty MCP Server

Model Context Protocol (MCP) server for **Sassy Scotty**, a CMU student productivity app that combines Canvas LMS integration, SIO schedule scraping, and AI-powered task management with a Gen Z-coded Kanban board.

## Features

- 📚 **Canvas LMS Integration** - Fetch courses, assignments, and calendar events
- 🗓️ **SIO Schedule Scraping** - Auto-import class schedules from CMU Student Information Online
- 📋 **Unified Task Model** - Normalize data from multiple sources into a consistent format
- 🎯 **Kanban Stage Support** - Built-in support for Gen Z-themed Kanban workflow
- 🤖 **Scotty Vibe Context** - Generate structured daily planning context for AI coaching
- 🔒 **Secure by Design** - Environment-based credentials, no hardcoded secrets

## Architecture

```
mcp-server/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── models/               # TypeScript data models
│   │   ├── Task.ts           # Unified task model with Kanban stages
│   │   ├── CanvasTypes.ts    # Canvas API types
│   │   ├── SioTypes.ts       # SIO schedule types
│   │   └── ScottyVibeTypes.ts # Vibe context types
│   ├── clients/              # External API clients
│   │   ├── canvasClient.ts   # Canvas LMS API client
│   │   └── sioClient.ts      # SIO scraper (Playwright)
│   ├── tools/                # MCP tool implementations
│   │   ├── syncAllTool.ts    # Unified sync from all sources
│   │   ├── canvasTools.ts    # Canvas-specific tools
│   │   ├── sioTools.ts       # SIO-specific tools
│   │   └── scottyVibeTool.ts # Vibe context generator
│   └── utils/                # Shared utilities
│       ├── env.ts            # Environment configuration
│       ├── logger.ts         # Logging utilities
│       ├── timeUtils.ts      # Time/date helpers
│       └── normalization.ts  # Data normalization
├── package.json
├── tsconfig.json
└── .env.example
```

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- CMU Andrew ID (for SIO access)
- Canvas API token

### Setup

1. **Clone and install dependencies:**

```bash
cd mcp-server
npm install
```

2. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Canvas API Configuration
CANVAS_API_BASE_URL=https://canvas.cmu.edu
CANVAS_API_TOKEN=your_canvas_api_token_here

# CMU SIO Configuration
SIO_USERNAME=your_andrew_id
SIO_PASSWORD=your_sio_password

# Optional: Mock SIO for development (set to true to avoid actual scraping)
MOCK_SIO=false

# Optional: Log level (debug, info, error)
LOG_LEVEL=info
```

3. **Get Canvas API Token:**

   - Go to Canvas → Account → Settings
   - Scroll to "Approved Integrations"
   - Click "+ New Access Token"
   - Copy the token to your `.env` file

4. **Install Playwright browsers:**

```bash
npx playwright install chromium
```

## Usage

### Development Mode

```bash
npm run dev
```

### Build and Run

```bash
npm run build
npm start
```

### Run Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

## MCP Tools

The server exposes the following MCP tools:

### 1. `sync_all`

Fetch and normalize data from all sources (Canvas + SIO).

**Input:**
```json
{
  "timeWindowDays": 14,
  "includeCompletedAssignments": false,
  "weeksOfSchedule": 4
}
```

**Output:**
```json
{
  "tasks": [/* Array of Task objects */]
}
```

### 2. `fetch_canvas_courses`

Fetch all Canvas courses.

**Input:**
```json
{
  "includeCompleted": false
}
```

**Output:**
```json
{
  "courses": [
    {
      "id": 12345,
      "name": "15-112 Fundamentals of Programming",
      "courseCode": "15-112",
      "workflowState": "available"
    }
  ]
}
```

### 3. `fetch_canvas_assignments`

Fetch Canvas assignments with optional filtering.

**Input:**
```json
{
  "courseId": 12345,
  "includeCompleted": false,
  "dueAfter": "2025-01-01T00:00:00Z",
  "dueBefore": "2025-12-31T23:59:59Z"
}
```

**Output:**
```json
{
  "tasks": [/* Array of Task objects */]
}
```

### 4. `fetch_canvas_calendar_events`

Fetch Canvas calendar events.

**Input:**
```json
{
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-01-31T23:59:59Z",
  "daysAhead": 7
}
```

**Output:**
```json
{
  "tasks": [/* Array of Task objects */]
}
```

### 5. `fetch_sio_schedule`

Fetch class schedule from SIO and generate recurring task entries.

**Input:**
```json
{
  "termCode": "S25",
  "weeksAhead": 4
}
```

**Output:**
```json
{
  "tasks": [/* Array of Task objects for class meetings */]
}
```

### 6. `scotty_vibe_context`

Generate structured daily planning and coaching context.

**Input:**
```json
{
  "tasks": [/* Array of Task objects */],
  "now": "2025-01-15T12:00:00Z",
  "preferences": {
    "wakeTime": "08:00",
    "sleepTime": "23:00",
    "socialEnergy": "medium",
    "preferredLocations": ["Hunt Library", "Gates"]
  }
}
```

**Output:**
```json
{
  "context": {
    "summary": {
      "date": "2025-01-15",
      "dayLoad": "busy",
      "totalTasksToday": 8,
      "totalDueToday": 3,
      "totalOverdue": 1,
      "freeBlockMinutes": 180
    },
    "focusBlocks": [/* Recommended work blocks */],
    "breakIdeas": [/* Suggested breaks */],
    "riskyTasks": [/* Tasks needing attention */],
    "suggestedOrder": [/* Task IDs in priority order */],
    "notesForCoach": [/* Hints for AI coaching */]
  }
}
```

## Task Model

All tasks follow a unified schema with Kanban stage support:

```typescript
interface Task {
  id: string;                    // Unique ID
  source: "canvas" | "sio" | "manual";
  title: string;
  description?: string;
  courseCode?: string;           // e.g., "15-112"
  courseName?: string;
  dueAt?: string;                // ISO 8601
  startAt?: string;              // ISO 8601
  endAt?: string;                // ISO 8601
  location?: string;
  type: "assignment" | "exam" | "lecture" | "lab" | "recitation" | "event" | "todo";
  priority?: "low" | "medium" | "high";
  status?: "pending" | "completed" | "overdue";
  kanbanStage?: "brain_dump" | "kinda_urgent" | "in_progress" | "done";
  rawSourceId?: string;
  metadata?: Record<string, unknown>;
}
```

### Kanban Stages

The backend supports these Kanban stages (front-end maps to Gen Z labels):

- `brain_dump` → Front-end: "brain dump 🧠"
- `kinda_urgent` → Front-end: "kinda urgent ngl"
- `in_progress` → Front-end: "we balling rn"
- `done` → Front-end: "ate & left no crumbs"

Tasks are automatically assigned stages based on due date proximity:
- Due within 48 hours → `kinda_urgent`
- Due later or no due date → `brain_dump`
- Submitted/completed → `done`

## Development

### Mock Mode

For development without actual SIO credentials, set `MOCK_SIO=true` in `.env`. This uses sample schedule data.

### Logging

Adjust log verbosity with the `LOG_LEVEL` environment variable:
- `debug` - Verbose logging including API requests
- `info` - Standard operational logs (default)
- `error` - Errors only

### SIO Scraping Notes

The SIO client uses Playwright for web scraping. The current implementation includes placeholder selectors that need to be updated based on the actual SIO HTML structure:

1. Inspect the SIO schedule page in your browser
2. Update selectors in `src/clients/sioClient.ts` → `scrapeSchedule()` method
3. Test with real credentials or use `MOCK_SIO=true` for development

## Security

- ✅ No credentials hardcoded in source
- ✅ Environment-based configuration
- ✅ Sensitive data redaction in logs
- ✅ Designed for future per-user token support
- ⚠️ Store `.env` securely and never commit it

## Testing

Unit tests cover core utilities:

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm test -- --coverage
```

Test files:
- `src/utils/timeUtils.test.ts` - Time/date utilities
- `src/utils/normalization.test.ts` - Data normalization

## Contributing

This MCP server is designed for the Sassy Scotty CMU productivity app. When contributing:

1. Follow TypeScript strict mode conventions
2. Add tests for new utilities
3. Update README for new MCP tools
4. Never commit credentials or `.env` files

## Roadmap

- [ ] Enhanced SIO scraping with retry logic
- [ ] Per-user credential management
- [ ] Canvas gradebook integration
- [ ] Task suggestion engine (ML-based)
- [ ] Multi-semester schedule support
- [ ] Calendar sync (iCal export)

## License

MIT

## Support

For issues or questions:
1. Check the logs (set `LOG_LEVEL=debug`)
2. Verify environment variables
3. Test with `MOCK_SIO=true` to isolate issues
4. Review Canvas API documentation: https://canvas.instructure.com/doc/api/

---

Built with ❤️ for CMU students by CMU students
