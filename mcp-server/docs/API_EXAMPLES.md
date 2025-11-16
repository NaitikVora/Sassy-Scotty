# API Examples

This document provides example requests and responses for all MCP tools.

## sync_all

Fetch all data from Canvas and SIO in one call.

### Request

```json
{
  "name": "sync_all",
  "arguments": {
    "timeWindowDays": 14,
    "includeCompletedAssignments": false,
    "weeksOfSchedule": 4
  }
}
```

### Response

```json
{
  "tasks": [
    {
      "id": "canvas-assignment-12345-1736956800000",
      "source": "canvas",
      "title": "Homework 3: Recursion",
      "description": "Complete problems 1-5 on recursion",
      "courseCode": "15-112",
      "courseName": "Fundamentals of Programming",
      "dueAt": "2025-01-20T23:59:00Z",
      "type": "assignment",
      "priority": "medium",
      "status": "pending",
      "kanbanStage": "brain_dump",
      "rawSourceId": "12345",
      "metadata": {
        "canvasUrl": "https://canvas.cmu.edu/courses/1/assignments/12345",
        "pointsPossible": 100
      }
    },
    {
      "id": "sio-15112-lecture-1-2025-01-16",
      "source": "sio",
      "title": "15-112 Lecture",
      "description": "Fundamentals of Programming",
      "courseCode": "15-112",
      "courseName": "Fundamentals of Programming",
      "startAt": "2025-01-16T10:00:00Z",
      "endAt": "2025-01-16T10:50:00Z",
      "location": "DH 2210",
      "type": "lecture",
      "status": "pending",
      "kanbanStage": "brain_dump",
      "metadata": {
        "instructor": "David Kosbie",
        "section": "A"
      }
    }
  ]
}
```

## fetch_canvas_courses

Get all active Canvas courses.

### Request

```json
{
  "name": "fetch_canvas_courses",
  "arguments": {
    "includeCompleted": false
  }
}
```

### Response

```json
{
  "courses": [
    {
      "id": 1001,
      "name": "15-112 Fundamentals of Programming",
      "courseCode": "15-112",
      "workflowState": "available",
      "startAt": "2025-01-08T00:00:00Z",
      "endAt": "2025-05-10T23:59:59Z"
    },
    {
      "id": 1002,
      "name": "21-127 Concepts of Mathematics",
      "courseCode": "21-127",
      "workflowState": "available"
    }
  ]
}
```

## fetch_canvas_assignments

Fetch assignments, optionally filtered.

### Request (All Assignments)

```json
{
  "name": "fetch_canvas_assignments",
  "arguments": {
    "includeCompleted": false
  }
}
```

### Request (Single Course)

```json
{
  "name": "fetch_canvas_assignments",
  "arguments": {
    "courseId": 1001,
    "includeCompleted": true,
    "dueAfter": "2025-01-01T00:00:00Z",
    "dueBefore": "2025-01-31T23:59:59Z"
  }
}
```

### Response

```json
{
  "tasks": [
    {
      "id": "canvas-assignment-12345-1736956800000",
      "source": "canvas",
      "title": "Homework 3: Recursion",
      "courseCode": "15-112",
      "courseName": "Fundamentals of Programming",
      "dueAt": "2025-01-20T23:59:00Z",
      "type": "assignment",
      "status": "pending",
      "kanbanStage": "brain_dump"
    },
    {
      "id": "canvas-assignment-12346-1737043200000",
      "source": "canvas",
      "title": "Midterm Exam",
      "courseCode": "15-112",
      "courseName": "Fundamentals of Programming",
      "dueAt": "2025-02-15T14:00:00Z",
      "type": "exam",
      "status": "pending",
      "kanbanStage": "brain_dump"
    }
  ]
}
```

## fetch_canvas_calendar_events

Get calendar events from Canvas.

### Request

```json
{
  "name": "fetch_canvas_calendar_events",
  "arguments": {
    "daysAhead": 7
  }
}
```

### Response

```json
{
  "tasks": [
    {
      "id": "canvas-event-789-1736956800000",
      "source": "canvas",
      "title": "Office Hours - Prof. Kosbie",
      "description": "Weekly office hours for 15-112",
      "startAt": "2025-01-16T15:00:00Z",
      "endAt": "2025-01-16T16:00:00Z",
      "location": "GHC 5th Floor",
      "type": "event",
      "status": "pending",
      "kanbanStage": "brain_dump"
    }
  ]
}
```

## fetch_sio_schedule

Fetch class schedule from SIO.

### Request

```json
{
  "name": "fetch_sio_schedule",
  "arguments": {
    "termCode": "S25",
    "weeksAhead": 4
  }
}
```

### Response

```json
{
  "tasks": [
    {
      "id": "sio-15112-lecture-1-2025-01-16",
      "source": "sio",
      "title": "15-112 Lecture",
      "description": "Fundamentals of Programming",
      "courseCode": "15-112",
      "courseName": "Fundamentals of Programming",
      "startAt": "2025-01-16T10:00:00-05:00",
      "endAt": "2025-01-16T10:50:00-05:00",
      "location": "DH 2210",
      "type": "lecture",
      "status": "pending",
      "kanbanStage": "brain_dump",
      "metadata": {
        "instructor": "David Kosbie",
        "section": "A",
        "meetingType": "Lecture",
        "units": 10
      }
    },
    {
      "id": "sio-15112-lecture-1-2025-01-20",
      "source": "sio",
      "title": "15-112 Lecture",
      "description": "Fundamentals of Programming",
      "courseCode": "15-112",
      "startAt": "2025-01-20T10:00:00-05:00",
      "endAt": "2025-01-20T10:50:00-05:00",
      "location": "DH 2210",
      "type": "lecture",
      "status": "pending"
    }
  ]
}
```

## scotty_vibe_context

Generate structured coaching context for a student's day.

### Request

```json
{
  "name": "scotty_vibe_context",
  "arguments": {
    "tasks": [
      {
        "id": "task-1",
        "source": "canvas",
        "title": "Homework 3",
        "courseCode": "15-112",
        "dueAt": "2025-01-16T23:59:00Z",
        "type": "assignment",
        "status": "pending"
      },
      {
        "id": "task-2",
        "source": "canvas",
        "title": "Midterm Study",
        "courseCode": "21-127",
        "dueAt": "2025-01-17T10:00:00Z",
        "type": "exam",
        "status": "pending"
      },
      {
        "id": "task-3",
        "source": "sio",
        "title": "15-112 Lecture",
        "courseCode": "15-112",
        "startAt": "2025-01-16T10:00:00Z",
        "endAt": "2025-01-16T10:50:00Z",
        "location": "DH 2210",
        "type": "lecture",
        "status": "pending"
      }
    ],
    "now": "2025-01-16T09:00:00Z",
    "preferences": {
      "wakeTime": "08:00",
      "sleepTime": "23:00",
      "socialEnergy": "medium",
      "preferredLocations": ["Hunt Library", "Gates Hillman Center"]
    }
  }
}
```

### Response

```json
{
  "context": {
    "summary": {
      "date": "2025-01-16",
      "dayLoad": "busy",
      "totalTasksToday": 3,
      "totalDueToday": 1,
      "totalOverdue": 0,
      "freeBlockMinutes": 420,
      "firstDueAt": "2025-01-16T23:59:00Z"
    },
    "focusBlocks": [
      {
        "id": "focus-morning-2025-01-16",
        "startAt": "2025-01-16T09:00:00Z",
        "endAt": "2025-01-16T10:30:00Z",
        "label": "Deep work - morning focus",
        "suggestedLocation": "Hunt Library"
      },
      {
        "id": "focus-afternoon-2025-01-16",
        "startAt": "2025-01-16T14:00:00Z",
        "endAt": "2025-01-16T15:30:00Z",
        "label": "Review & practice",
        "suggestedLocation": "Gates Hillman Center"
      }
    ],
    "breakIdeas": [
      {
        "id": "break-walk-cut",
        "label": "Walk around the Cut",
        "durationMinutes": 15
      },
      {
        "id": "break-coffee",
        "label": "Coffee run (La Prima or Entropy+)",
        "durationMinutes": 20
      },
      {
        "id": "break-lunch",
        "label": "Lunch at the UC or Tartan Market",
        "durationMinutes": 45
      }
    ],
    "riskyTasks": [
      {
        "taskId": "task-1",
        "title": "Homework 3",
        "dueAt": "2025-01-16T23:59:00Z",
        "riskLevel": "medium",
        "reason": "Due within 24 hours"
      },
      {
        "taskId": "task-2",
        "title": "Midterm Study",
        "dueAt": "2025-01-17T10:00:00Z",
        "riskLevel": "medium",
        "reason": "Due within 48 hours"
      }
    ],
    "suggestedOrder": [
      "task-2",
      "task-1",
      "task-3"
    ],
    "notesForCoach": [
      "Student has 3 total active tasks",
      "3 tasks/events scheduled for today",
      "1 assignments/tasks due today",
      "Overall day load: busy",
      "🎯 1 exam(s) coming up this week",
      "Tasks are heavily clustered in next 48 hours - suggest prioritization"
    ]
  }
}
```

## Using with Claude

When integrated with Claude via MCP, you can use these tools naturally:

### Example Conversation

**User:** "What do I have due this week?"

**Claude (using MCP):**
```
<thinking>
I'll use the sync_all tool to fetch the user's tasks from Canvas and SIO.
</thinking>
```

*Calls: `sync_all` with `timeWindowDays: 7`*

**Claude:** "Looking at your Canvas assignments, you have:

1. **Homework 3: Recursion** (15-112) - Due Jan 20 at 11:59 PM
2. **Midterm Exam** (21-127) - Due Feb 15 at 2:00 PM
3. **Reading Response** (76-101) - Due Jan 18 at 11:59 PM

You also have regular lectures scheduled throughout the week. Want me to help you prioritize these?"

---

**User:** "What should I focus on today?"

**Claude (using MCP):**

*Calls: `scotty_vibe_context` with current tasks and timestamp*

**Claude:** "Okay bestie, here's the vibe check for today:

You're looking at a **busy** day with 3 assignments due and 1 exam coming up. You've got about 7 hours of free time between classes.

**Priority tasks:**
1. Start studying for that 21-127 midterm (it's an exam, no cap you should start early)
2. Knock out Homework 3 (due tonight at 11:59 PM)

**Focus blocks I'm suggesting:**
- 9:00-10:30 AM: Deep work at Hunt Library (before your lecture)
- 2:00-3:30 PM: Review session at Gates

**Break ideas:**
- Walk around the Cut (15 min)
- Coffee run to La Prima (20 min)
- Lunch at UC (45 min)

Honestly? You're lowkey cooked if you don't start that homework soon. But you got this! 💪"

---

## Error Handling

### Missing Credentials

**Request:** `sync_all`

**Response (Error):**
```json
{
  "error": "Environment configuration error: Missing required environment variable: CANVAS_API_TOKEN",
  "tool": "sync_all"
}
```

### Invalid Date Format

**Request:**
```json
{
  "name": "fetch_canvas_assignments",
  "arguments": {
    "dueAfter": "not-a-date"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid date format for dueAfter",
  "tool": "fetch_canvas_assignments"
}
```

### Canvas API Failure

**Request:** `fetch_canvas_courses`

**Response (Error):**
```json
{
  "error": "Canvas API error: 401 Unauthorized",
  "tool": "fetch_canvas_courses"
}
```

## Testing Tools Directly

You can test MCP tools using the MCP inspector:

```bash
# Install MCP inspector
npm install -g @modelcontextprotocol/inspector

# Run your MCP server with inspector
npx @modelcontextprotocol/inspector npm start
```

Then navigate to the web UI to test tools interactively.

---

**Last Updated:** 2025-01-15
