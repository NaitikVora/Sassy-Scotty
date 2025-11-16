/**
 * Environment variable validation and loading
 */

import { config } from "dotenv";

// Load .env file
config();

export type LogLevel = "debug" | "info" | "error";

/**
 * Validated environment configuration
 */
export interface EnvConfig {
  // Canvas API
  canvasApiBaseUrl: string;
  canvasApiToken: string;

  // CMU SIO
  sioUsername: string;
  sioPassword: string;

  // Optional flags
  mockSio: boolean;
  logLevel: LogLevel;
}

/**
 * Get a required environment variable
 * @throws Error if variable is not set
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get an optional environment variable with default
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Get a boolean environment variable
 */
function getBooleanEnv(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Load and validate all environment variables
 */
export function loadEnv(): EnvConfig {
  try {
    const mockSio = getBooleanEnv("MOCK_SIO", false);

    const sioUsername = mockSio
      ? getOptionalEnv("SIO_USERNAME", "mock_sio_user")
      : getRequiredEnv("SIO_USERNAME");

    const sioPassword = mockSio
      ? getOptionalEnv("SIO_PASSWORD", "mock_sio_password")
      : getRequiredEnv("SIO_PASSWORD");

    return {
      canvasApiBaseUrl: getRequiredEnv("CANVAS_API_BASE_URL"),
      canvasApiToken: getRequiredEnv("CANVAS_API_TOKEN"),
      sioUsername,
      sioPassword,
      mockSio,
      logLevel: getOptionalEnv("LOG_LEVEL", "info") as LogLevel,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Environment configuration error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Global environment configuration
 * Loaded once at startup
 */
export const env = loadEnv();
