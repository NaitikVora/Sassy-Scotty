import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import net from 'node:net';

async function isProxyReachable(target: string): Promise<boolean> {
  try {
    const url = new URL(target);
    const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));

    return await new Promise((resolve) => {
      const socket = net.connect({ host: url.hostname, port, timeout: 700 }, () => {
        socket.end();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

export default defineConfig(async ({ command }) => {
  const proxyTarget = process.env.VITE_CANVAS_PROXY ?? 'http://localhost:3001';
  let proxy: Record<string, string | ProxyOptions> | undefined;
  let canvasProxyEnabled = true;

  if (command === 'serve') {
    const forceProxy = process.env.VITE_FORCE_CANVAS_PROXY === 'true';
    let enableProxy = true;

    if (!forceProxy) {
      enableProxy = await isProxyReachable(proxyTarget);
      if (!enableProxy) {
        console.warn(`\n[vite] Canvas proxy disabled – ${proxyTarget} is unreachable. Serving mock data locally.\n`);
      }
    }

    canvasProxyEnabled = enableProxy;

    if (enableProxy) {
      proxy = {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      };
    }
  } else {
    proxy = {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    };
    canvasProxyEnabled = true;
  }

  return {
    plugins: [react()],
    define: {
      __CANVAS_PROXY_ENABLED__: JSON.stringify(canvasProxyEnabled),
    },
    server: proxy
      ? {
          proxy,
        }
      : undefined,
  };
});
