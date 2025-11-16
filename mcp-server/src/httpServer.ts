/**
 * Lightweight HTTP API that exposes Canvas-driven tasks for the UI
 */

import http, { type ServerResponse } from "node:http";
import { fetchCanvasAssignments } from "./tools/canvasTools.js";
import * as logger from "./utils/logger.js";

const PORT = Number(process.env.PORT || 3001);
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "*";

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
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

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  logger.info(`HTTP Canvas API listening on port ${PORT}`);
});

server.on("error", (error) => {
  logger.error("HTTP server error", error);
});
