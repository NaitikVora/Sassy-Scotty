# Architecture Documentation

## Overview

Sassy Scotty MCP Server follows a clean, modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Server Layer                      │
│  (index.ts - JSON-RPC over stdin/stdout)                │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│   MCP Tools    │    │   Data Models   │
│                │    │                 │
│ - syncAll      │    │ - Task          │
│ - canvasTools  │    │ - CanvasTypes   │
│ - sioTools     │    │ - SioTypes      │
│ - scottyVibe   │    │ - ScottyVibe    │
└───────┬────────┘    └─────────────────┘
        │
┌───────┴──────────────────────┐
│                              │
┌────▼──────┐        ┌─────────▼────────┐
│  Clients  │        │   Utilities      │
│           │        │                  │
│ - Canvas  │        │ - normalization  │
│ - SIO     │        │ - timeUtils      │
└───────────┘        │ - logger         │
                     │ - env            │
                     └──────────────────┘
```

## Core Components

### 1. MCP Server (`src/index.ts`)

Entry point for the MCP server. Responsibilities:
- Initialize server with `@modelcontextprotocol/sdk`
- Register all tools
- Handle `list_tools` requests
- Handle `call_tool` requests
- Error handling and logging

### 2. Data Models (`src/models/`)

#### Task.ts
Unified task model that normalizes data from multiple sources:
- Canvas assignments → Tasks
- Canvas events → Tasks
- SIO schedule entries → Tasks

**Key Design Decision:** The `kanbanStage` field is built into the Task model itself, not stored separately. This makes it easy for clients to:
- Persist tasks with their current stage
- Filter/group tasks by stage
- Update stages via simple field updates

#### CanvasTypes.ts
TypeScript interfaces matching Canvas LMS REST API responses:
- `CanvasCourse`
- `CanvasAssignment`
- `CanvasCalendarEvent`
- `CanvasSubmission`

#### SioTypes.ts
Models for CMU SIO schedule data:
- `SioScheduleEntry` - Single class meeting pattern
- `SioSchedule` - Full semester schedule
- Day parsing utilities

#### ScottyVibeTypes.ts
Structured context for AI coaching:
- `ScottyVibeContext` - Main output
- `DayLoadLevel` - "chill" | "normal" | "busy" | "cooked"
- `FocusBlock` - Recommended work sessions
- `BreakIdea` - Break suggestions
- `RiskyTaskSummary` - Tasks needing attention

### 3. External Clients (`src/clients/`)

#### canvasClient.ts
Wrapper around Canvas LMS REST API:
- Authentication via Bearer token
- Methods for courses, assignments, events
- Pagination handling
- Error handling with graceful degradation

**Design Pattern:** Client uses constructor injection for credentials, but defaults to environment variables. This makes it easy to:
- Test with mock credentials
- Support multi-user scenarios in the future

#### sioClient.ts
Web scraper for CMU SIO using Playwright:
- Headless browser automation
- Login flow
- Schedule page parsing
- Mock mode for development

**Implementation Note:** SIO doesn't have a public API, so we scrape the HTML. The selectors in `scrapeSchedule()` are placeholders and need to be updated based on actual SIO HTML structure.

### 4. MCP Tools (`src/tools/`)

Each tool follows a consistent pattern:

```typescript
{
  name: string;
  description: string;
  inputSchema: ZodSchema;
  handler: async (args: T) => Promise<Result>;
}
```

#### syncAllTool.ts
Orchestrates data fetching from all sources:
1. Fetch Canvas assignments
2. Fetch Canvas events
3. Fetch SIO schedule
4. Merge into unified task list
5. Return to caller

**Design Decision:** `sync_all` doesn't deduplicate by default. Deduplication logic can be added to `mergeTasks()` in `normalization.ts` if needed.

#### scottyVibeTool.ts
Most complex tool - generates structured coaching context:

**Algorithm:**
1. **Filter tasks** - Separate today's tasks, due today, overdue
2. **Compute load** - Score based on due tasks, events, exams
3. **Find risky tasks** - Flag tasks due soon or overdue
4. **Calculate free time** - Subtract occupied blocks from day
5. **Generate focus blocks** - Suggest work sessions in free time
6. **Generate break ideas** - Suggest breaks based on preferences
7. **Suggest task order** - Sort by risk, type, due date
8. **Create coaching notes** - Neutral hints for LLM

**Why neutral notes?** The tool generates factual context like "Student has 3 exams this week" rather than sassy text. This lets the LLM (Claude) in the front-end app transform it into Sassy Scotty's voice, maintaining separation of concerns.

### 5. Utilities (`src/utils/`)

#### normalization.ts
Converts source-specific data to unified Task model:
- `canvasAssignmentToTask()` - Canvas → Task
- `canvasCalendarEventToTask()` - Canvas → Task
- `sioScheduleEntryToTasks()` - SIO → Task[] (recurring)
- `determineKanbanStage()` - Auto-assign stage based on due date
- `determineTaskStatus()` - Compute status from due date & submission

**Kanban Stage Logic:**
- Due within 48h → `kinda_urgent`
- Due later / no due date → `brain_dump`
- Submitted → `done`
- Never auto-assign `in_progress` (user sets that manually)

#### timeUtils.ts
Comprehensive time/date utilities:
- Date comparisons (`isToday`, `isPast`, etc.)
- Time calculations (`hoursUntil`, `daysUntil`)
- Time parsing (`parseTimeToMinutes`)
- Recurring dates (`getRecurringDates`)
- Free time calculation (`calculateFreeTime`)

**Design:** All functions accept an optional `now` parameter for testability.

#### logger.ts
Simple logging with levels:
- Respects `LOG_LEVEL` environment variable
- Redacts sensitive fields
- Structured logging (JSON where appropriate)

#### env.ts
Environment variable validation:
- Loads `.env` file via `dotenv`
- Validates required variables at startup
- Exports typed `env` object
- Throws clear errors for missing config

**Security:** Never logs credentials or API tokens.

## Data Flow

### Example: sync_all Tool Execution

```
1. Client calls MCP tool: sync_all
   ↓
2. index.ts receives CallToolRequest
   ↓
3. Routes to syncAllTool.handler()
   ↓
4. syncAllTool calls:
   ├─ canvasTools.fetchCanvasAssignments
   │  └─ canvasClient.getAllAssignments()
   │     └─ Canvas API: GET /api/v1/courses/.../assignments
   ├─ canvasTools.fetchCanvasCalendarEvents
   │  └─ canvasClient.getUpcomingCalendarEvents()
   │     └─ Canvas API: GET /api/v1/calendar_events
   └─ sioTools.fetchSioSchedule
      └─ sioClient.fetchCurrentSchedule()
         └─ Playwright: Login → Scrape schedule
   ↓
5. Each fetcher normalizes data:
   ├─ canvasAssignmentToTask()
   ├─ canvasCalendarEventToTask()
   └─ sioScheduleEntryToTasks()
   ↓
6. mergeTasks() combines all Task[]
   ↓
7. Return to client via MCP response
```

### Example: scotty_vibe_context Tool Execution

```
1. Client provides:
   - tasks: Task[]
   - now: ISO timestamp
   - preferences: UserPreferences
   ↓
2. scottyVibeTool.handler() processes:
   ├─ Filter tasks (today, due, overdue)
   ├─ Compute dayLoad (chill/normal/busy/cooked)
   ├─ Find risky tasks
   ├─ Calculate free time using timeUtils
   ├─ Generate focus blocks
   ├─ Generate break ideas
   ├─ Suggest task order
   └─ Create coaching notes
   ↓
3. Return ScottyVibeContext
   ↓
4. Client (LLM) transforms neutral notes
   into Sassy Scotty voice
```

## Design Patterns

### 1. Single Responsibility
Each module has one job:
- Clients fetch data
- Normalizers transform data
- Tools orchestrate and return results
- Utilities provide reusable functions

### 2. Dependency Injection
Clients accept credentials in constructor:
```typescript
new CanvasClient(baseUrl?, token?)
```
Defaults to environment variables, but allows override for testing.

### 3. Fail-Safe Defaults
- Canvas client returns `[]` on error for robustness
- SIO client has mock mode
- Normalization handles missing fields gracefully

### 4. Immutable Data Transformations
All normalization functions return new objects, never mutate inputs.

### 5. Testability
- Utils accept `now` parameter for time-dependent logic
- Clients can be mocked
- Pure functions where possible

## Future Enhancements

### Multi-User Support
Current: Single set of credentials from `.env`

Future approach:
1. Tools accept optional `credentials` parameter
2. Clients initialized per-request with user credentials
3. MCP server maintains credential cache

### Persistent Storage
Current: Stateless - all data fetched on demand

Future approach:
1. Add database layer (SQLite/PostgreSQL)
2. Cache Canvas/SIO data
3. Track user-modified Kanban stages
4. Enable offline mode

### Enhanced Deduplication
Current: Simple task concatenation

Future approach:
1. Detect duplicate events (same title + time)
2. Prefer Canvas events over SIO for conflicts
3. Merge metadata from multiple sources

### AI Task Suggestions
Current: Basic sorting by due date

Future approach:
1. ML model for task difficulty estimation
2. Learning user work patterns
3. Suggesting prep tasks before exams
4. Recommending task breakdowns

## Testing Strategy

### Unit Tests
- `timeUtils.test.ts` - Pure time functions
- `normalization.test.ts` - Data transformations

### Integration Tests (Future)
- Mock Canvas API responses
- Mock SIO HTML pages
- Test full tool execution

### E2E Tests (Future)
- Real Canvas API calls (test course)
- Real MCP protocol communication

## Performance Considerations

### Canvas API Rate Limiting
Canvas has rate limits (typically 3000 requests/hour). Current approach:
- Batch assignment fetching by course
- Cache not implemented yet (future enhancement)

### SIO Scraping Time
Playwright scraping can take 5-10 seconds:
- Use `MOCK_SIO=true` in development
- Consider caching schedule (changes infrequently)

### MCP Response Size
Large task lists can exceed MCP message limits:
- Current: No pagination
- Future: Implement pagination in tools

## Security Considerations

1. **Credentials**
   - Never logged
   - Never included in error messages
   - Loaded from environment only

2. **Input Validation**
   - All tool inputs validated with Zod schemas
   - Date parsing uses built-in `Date` (no eval)

3. **HTML Scraping**
   - SIO client runs in headless browser (sandboxed)
   - No arbitrary code execution

4. **Output Sanitization**
   - Task descriptions from Canvas/SIO trusted
   - No user-generated content (yet)

---

**Last Updated:** 2025-01-15
