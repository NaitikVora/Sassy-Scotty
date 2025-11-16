#!/usr/bin/env node

/**
 * Sassy Scotty MCP Server
 * Entry point for the Model Context Protocol server
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import * as logger from "./utils/logger.js";
import { env } from "./utils/env.js";

// Import tools
import { fetchCanvasCourses, fetchCanvasAssignments, fetchCanvasCalendarEvents } from "./tools/canvasTools.js";
import { fetchSioSchedule } from "./tools/sioTools.js";
import { syncAll } from "./tools/syncAllTool.js";
import { scottyVibeContext } from "./tools/scottyVibeTool.js";

/**
 * All available MCP tools
 */
const tools = [
  syncAll,
  fetchCanvasCourses,
  fetchCanvasAssignments,
  fetchCanvasCalendarEvents,
  fetchSioSchedule,
  scottyVibeContext,
];

/**
 * Create and configure the MCP server
 */
async function main() {
  logger.info("Starting Sassy Scotty MCP Server...");
  logger.debug("Environment config", {
    canvasBaseUrl: env.canvasApiBaseUrl,
    mockSio: env.mockSio,
    logLevel: env.logLevel,
  });

  const server = new Server(
    {
      name: "sassy-scotty-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * Handle tool listing requests
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug("Received list_tools request");

    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema.shape
          ? {
              type: "object" as const,
              properties: Object.entries(tool.inputSchema.shape).reduce(
                (acc, [key, value]) => {
                  acc[key] = (value as any)._def;
                  return acc;
                },
                {} as Record<string, any>
              ),
            }
          : { type: "object" as const },
      })),
    };
  });

  /**
   * Handle tool execution requests
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info(`Executing tool: ${name}`);
    logger.debug(`Tool arguments`, args);

    const tool = tools.find((t) => t.name === name);

    if (!tool) {
      logger.error(`Unknown tool: ${name}`);
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      // Validate arguments with Zod schema
      const validatedArgs = tool.inputSchema.parse(args || {});

      // Execute tool handler
      const result = await tool.handler(validatedArgs as any);

      logger.debug(`Tool ${name} completed successfully`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error(`Tool ${name} failed`, error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                error: errorMessage,
                tool: name,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });

  /**
   * Start the server
   */
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("Sassy Scotty MCP Server is running");
}

// Run the server
main().catch((error) => {
  logger.error("Fatal error starting MCP server", error);
  process.exit(1);
});
