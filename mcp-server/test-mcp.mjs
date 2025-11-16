#!/usr/bin/env node

/**
 * Quick manual test of the MCP server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');

console.log('Starting MCP server...\n');

const server = spawn('node', [serverPath], {
  env: {
    ...process.env,
    CANVAS_API_BASE_URL: 'https://canvas.cmu.edu',
    CANVAS_API_TOKEN: 'test-token',
    SIO_USERNAME: 'test',
    SIO_PASSWORD: 'test',
    MOCK_SIO: 'true',
    LOG_LEVEL: 'info'
  }
});

// Send initialize request
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

// Send list_tools request
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {}
};

// Handle server output
server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    if (line.startsWith('[')) {
      // Log line
      console.log(line);
    } else {
      try {
        const response = JSON.parse(line);
        console.log('\n📨 Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Raw output:', line);
      }
    }
  });
});

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

// Send requests
setTimeout(() => {
  console.log('\n🚀 Sending initialize request...');
  server.stdin.write(JSON.stringify(initRequest) + '\n');
}, 1000);

setTimeout(() => {
  console.log('\n🔧 Sending list_tools request...');
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 2000);

setTimeout(() => {
  console.log('\n✅ Test complete! Stopping server...');
  server.kill();
  process.exit(0);
}, 4000);
