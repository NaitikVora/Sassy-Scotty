/**
 * Lightweight HTTP API that exposes Canvas-driven tasks for the UI
 */

import http, { type ServerResponse, type IncomingMessage } from "node:http";
import { fetchCanvasAssignments } from "./tools/canvasTools.js";
import * as logger from "./utils/logger.js";
import { promises as fs } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.PORT || 3001);
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "*";
const DATA_DIR = join(process.cwd(), "data");

// Ensure data directory exists
await fs.mkdir(DATA_DIR, { recursive: true });

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
