/**
 * Simple logger utility
 * Avoids logging sensitive information
 */

import { env, type LogLevel } from "./env.js";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  error: 2,
};

/**
 * Current log level from environment
 */
const currentLevel = LOG_LEVELS[env.logLevel] || LOG_LEVELS.info;

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLevel;
}

/**
 * Format log message with timestamp
 */
function formatMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

/**
 * Log debug message
 */
export function debug(message: string, data?: unknown): void {
  if (shouldLog("debug")) {
    console.log(formatMessage("debug", message));
    if (data !== undefined) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

/**
 * Log info message
 */
export function info(message: string, data?: unknown): void {
  if (shouldLog("info")) {
    console.log(formatMessage("info", message));
    if (data !== undefined) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

/**
 * Log error message
 */
export function error(message: string, err?: unknown): void {
  if (shouldLog("error")) {
    console.error(formatMessage("error", message));
    if (err instanceof Error) {
      console.error(err.stack || err.message);
    } else if (err !== undefined) {
      console.error(JSON.stringify(err, null, 2));
    }
  }
}

/**
 * Redact sensitive information from objects
 */
export function redact<T extends Record<string, unknown>>(
  obj: T,
  sensitiveKeys: string[] = ["password", "token", "apiKey", "secret"]
): T {
  const redacted = { ...obj } as Record<string, unknown>;
  for (const key of sensitiveKeys) {
    if (key in redacted) {
      redacted[key] = "***REDACTED***";
    }
  }
  return redacted as T;
}
