/**
 * Lightweight HTTP API that exposes Canvas-driven tasks for the UI
 */

import http, { type ServerResponse, type IncomingMessage } from "node:http";
import { fetchCanvasAssignments, fetchCanvasCalendarEvents } from "./tools/canvasTools.js";
import * as logger from "./utils/logger.js";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import ical from "node-ical";
import fetch from "node-fetch";

const PORT = Number(process.env.PORT || 3001);
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "*";
const DATA_DIR = join(process.cwd(), "data");
const USERS_DIR = join(DATA_DIR, "users");
const ACCESS_CODES = (process.env.ACCESS_CODES || "CMU2025,SCOTTY,TARTAN").split(",");
const ADMIN_WEBHOOK = process.env.ADMIN_WEBHOOK_URL || "";

type MaybeIcalText = string | { val?: unknown } | null | undefined;

function getIcalTextValue(value: MaybeIcalText, fallback = ""): string {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  const val = value.val;
  return typeof val === "string" ? val : fallback;
}

// Ensure data directories exist
await fs.mkdir(DATA_DIR, { recursive: true });
await fs.mkdir(USERS_DIR, { recursive: true });

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res: ServerResponse, status: number, payload: Record<string, unknown>): void {
  setCorsHeaders(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function handleOptionsRequest(res: ServerResponse): void {
  setCorsHeaders(res);
  res.writeHead(204);
  res.end();
}

function parseOptionalNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Read request body as JSON
 */
async function readRequestBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Get user data file path
 */
function getUserDataPath(userId: string): string {
  return join(DATA_DIR, `user_${userId}.json`);
}

/**
 * Load user data
 */
async function loadUserData(userId: string): Promise<any> {
  try {
    const data = await fs.readFile(getUserDataPath(userId), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Return empty data if file doesn't exist
    return {
      customTasks: [],
      kanbanState: {},
      settings: {},
    };
  }
}

/**
 * Save user data
 */
async function saveUserData(userId: string, data: any): Promise<void> {
  await fs.writeFile(getUserDataPath(userId), JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Get user profile path
 */
function getUserProfilePath(userId: string): string {
  return join(USERS_DIR, `${userId}.json`);
}

/**
 * Load user profile
 */
async function loadUserProfile(userId: string): Promise<any | null> {
  try {
    const data = await fs.readFile(getUserProfilePath(userId), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

/**
 * Save user profile
 */
async function saveUserProfile(userId: string, profile: any): Promise<void> {
  await fs.writeFile(getUserProfilePath(userId), JSON.stringify(profile, null, 2), 'utf-8');
}

/**
 * Find user by access code
 */
async function findUserByAccessCode(accessCode: string): Promise<any | null> {
  try {
    const files = await fs.readdir(USERS_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(join(USERS_DIR, file), 'utf-8');
        const profile = JSON.parse(data);
        if (profile.accessCode === accessCode) {
          return profile;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Send admin notification
 */
async function sendAdminNotification(user: any, action: string): Promise<void> {
  if (!ADMIN_WEBHOOK) return;

  try {
    const message = {
      text: `🔔 New User ${action}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${action === 'registered' ? '✨ New User Registration' : '🔄 User Login'}*`
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Name:*\n${user.name}` },
            { type: "mrkdwn", text: `*Email:*\n${user.email}` },
            { type: "mrkdwn", text: `*Device:*\n${user.deviceInfo.deviceType}` },
            { type: "mrkdwn", text: `*OS:*\n${user.deviceInfo.os}` },
            { type: "mrkdwn", text: `*Browser:*\n${user.deviceInfo.browser}` },
            { type: "mrkdwn", text: `*Time:*\n${new Date().toLocaleString()}` }
          ]
        }
      ]
    };

    await fetch(ADMIN_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  } catch (error) {
    logger.error('Failed to send admin notification', error);
  }
}

/**
 * Handle POST /api/auth/validate-code
 */
async function handleValidateCode(res: ServerResponse, req: IncomingMessage): Promise<void> {
  try {
    const data = await readRequestBody(req);
    const { accessCode } = data;

    if (!accessCode || !ACCESS_CODES.includes(accessCode)) {
      sendJson(res, 401, { valid: false, error: 'Invalid access code' });
      return;
    }

    // Check if user already exists with this code
    const existingUser = await findUserByAccessCode(accessCode);

    if (existingUser) {
      // Update last access
      existingUser.lastAccess = new Date().toISOString();
      await saveUserProfile(existingUser.id, existingUser);
      await sendAdminNotification(existingUser, 'login');
      sendJson(res, 200, { valid: true, existingUser: true, user: existingUser });
    } else {
      sendJson(res, 200, { valid: true, existingUser: false });
    }
  } catch (error) {
    logger.error('Failed to validate access code', error);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle POST /api/auth/register
 */
async function handleRegister(res: ServerResponse, req: IncomingMessage): Promise<void> {
  try {
    const user = await readRequestBody(req);

    // Save user profile
    await saveUserProfile(user.id, user);

    // Send admin notification
    await sendAdminNotification(user, 'registered');

    logger.info(`New user registered: ${user.name} (${user.email})`);
    sendJson(res, 200, { success: true, user });
  } catch (error) {
    logger.error('Failed to register user', error);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle GET /api/auth/profile/:userId
 */
async function handleGetProfile(res: ServerResponse, userId: string): Promise<void> {
  try {
    const profile = await loadUserProfile(userId);
    if (profile) {
      sendJson(res, 200, profile);
    } else {
      sendJson(res, 404, { error: 'Profile not found' });
    }
  } catch (error) {
    logger.error(`Failed to load profile for ${userId}`, error);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle PUT /api/auth/profile/:userId
 */
async function handleUpdateProfile(res: ServerResponse, userId: string, req: IncomingMessage): Promise<void> {
  try {
    const updates = await readRequestBody(req);
    const profile = await loadUserProfile(userId);

    if (!profile) {
      sendJson(res, 404, { error: 'Profile not found' });
      return;
    }

    const updatedProfile = { ...profile, ...updates, lastAccess: new Date().toISOString() };
    await saveUserProfile(userId, updatedProfile);

    sendJson(res, 200, { success: true, user: updatedProfile });
  } catch (error) {
    logger.error(`Failed to update profile for ${userId}`, error);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle GET /api/user/:userId/data
 */
async function handleGetUserData(res: ServerResponse, userId: string): Promise<void> {
  try {
    const data = await loadUserData(userId);
    sendJson(res, 200, data);
  } catch (error) {
    logger.error(`Failed to load user data for ${userId}`, error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Failed to load user data',
    });
  }
}

/**
 * Handle POST /api/user/:userId/data
 */
async function handleSaveUserData(res: ServerResponse, userId: string, req: IncomingMessage): Promise<void> {
  try {
    const data = await readRequestBody(req);
    await saveUserData(userId, data);
    sendJson(res, 200, { success: true });
  } catch (error) {
    logger.error(`Failed to save user data for ${userId}`, error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Failed to save user data',
    });
  }
}

async function handleAssignmentsRequest(res: ServerResponse, url: URL): Promise<void> {
  const courseIdParam = url.searchParams.get("courseId");
  const courseId = parseOptionalNumber(courseIdParam);

  if (courseIdParam && courseId === undefined) {
    sendJson(res, 400, { error: "Invalid courseId parameter" });
    return;
  }

  const includeCompleted = url.searchParams.get("includeCompleted") === "true";
  const dueAfter = url.searchParams.get("dueAfter") || undefined;
  const dueBefore = url.searchParams.get("dueBefore") || undefined;

  try {
    const assignments = await fetchCanvasAssignments.handler({
      courseId,
      includeCompleted,
      dueAfter,
      dueBefore,
    });
    sendJson(res, 200, { tasks: assignments.tasks });
  } catch (error) {
    logger.error("Failed to fetch Canvas assignments via HTTP", error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Failed to fetch assignments",
    });
  }
}

async function handleCalendarEventsRequest(res: ServerResponse, url: URL): Promise<void> {
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;
  const daysAheadParam = url.searchParams.get("daysAhead");
  const daysAhead = daysAheadParam ? parseOptionalNumber(daysAheadParam) : 7;

  try {
    const events = await fetchCanvasCalendarEvents.handler({
      startDate,
      endDate,
      daysAhead,
    });
    sendJson(res, 200, { events: events.tasks });
  } catch (error) {
    logger.error("Failed to fetch Canvas calendar events via HTTP", error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Failed to fetch calendar events",
    });
  }
}

async function handleCampusEventsRequest(res: ServerResponse, url: URL): Promise<void> {
  const icalUrl = url.searchParams.get("icalUrl") || "https://tartanconnect.cmu.edu/ical/tepper/ical_tepper.ics";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseOptionalNumber(limitParam) || 10 : 10;

  try {
    logger.info(`Fetching campus events from iCal: ${icalUrl}`);

    // Fetch the iCal file
    const response = await fetch(icalUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal feed: ${response.status}`);
    }

    const icalData = await response.text();
    const events = await ical.async.parseICS(icalData);

    const now = new Date();
    const upcomingEvents: any[] = [];

    // Parse and filter events
    for (const event of Object.values(events)) {
      if (event.type !== 'VEVENT') continue;

      const startDate = event.start ? new Date(event.start) : null;
      if (!startDate || startDate < now) continue;

      // Only include events in the next 7 days
      const daysUntil = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntil > 7) continue;

      // Handle summary/description which can be string or { val }
      const title = getIcalTextValue(event.summary, 'Untitled Event');
      const description = getIcalTextValue(event.description, '');

      // Clean up location - remove "Sign in to download the location" text
      let location = getIcalTextValue(event.location, 'TBD');
      if (location.toLowerCase().includes('sign in to download')) {
        location = 'Location TBD';
      }

      upcomingEvents.push({
        id: event.uid || `event-${Math.random()}`,
        title,
        description,
        location,
        start: startDate.toISOString(),
        end: event.end ? new Date(event.end).toISOString() : startDate.toISOString(),
        url: event.url || '',
      });
    }

    // Sort by start date and limit
    upcomingEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const limitedEvents = upcomingEvents.slice(0, limit);

    logger.info(`Returning ${limitedEvents.length} campus events`);
    sendJson(res, 200, { events: limitedEvents });
  } catch (error) {
    logger.error("Failed to fetch campus events via HTTP", error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Failed to fetch campus events",
    });
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: "Invalid request" });
    return;
  }

  if (req.method === "OPTIONS") {
    handleOptionsRequest(res);
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && parsedUrl.pathname === "/api/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/assignments") {
    await handleAssignmentsRequest(res, parsedUrl);
    return;
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/calendar-events") {
    await handleCalendarEventsRequest(res, parsedUrl);
    return;
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/campus-events") {
    await handleCampusEventsRequest(res, parsedUrl);
    return;
  }

  // Auth endpoints
  if (req.method === "POST" && parsedUrl.pathname === "/api/auth/validate-code") {
    await handleValidateCode(res, req);
    return;
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/auth/register") {
    await handleRegister(res, req);
    return;
  }

  const profileMatch = parsedUrl.pathname.match(/^\/api\/auth\/profile\/([^/]+)$/);
  if (profileMatch) {
    const userId = profileMatch[1];

    if (req.method === "GET") {
      await handleGetProfile(res, userId);
      return;
    }

    if (req.method === "PUT") {
      await handleUpdateProfile(res, userId, req);
      return;
    }
  }

  // User data endpoints
  const userDataMatch = parsedUrl.pathname.match(/^\/api\/user\/([^/]+)\/data$/);
  if (userDataMatch) {
    const userId = userDataMatch[1];

    if (req.method === "GET") {
      await handleGetUserData(res, userId);
      return;
    }

    if (req.method === "POST") {
      await handleSaveUserData(res, userId, req);
      return;
    }
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  logger.info(`HTTP Canvas API listening on port ${PORT}`);
});

server.on("error", (error) => {
  logger.error("HTTP server error", error);
});
