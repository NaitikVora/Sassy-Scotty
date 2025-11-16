# vibemaxxing @CMU

## Quick Start

From the repo root you can now launch the Canvas API bridge without manually `cd`ing:

```bash
npm run server:dev          # runs mcp-server npm run dev:http
npm run server:start        # runs the compiled server (npm run start:http)
npm run server:dev:mock     # dev server with PORT=3001, CORS_ORIGIN=http://localhost:5173, MOCK_SIO=true
```

Adjust `PORT`, `CORS_ORIGIN`, or `MOCK_SIO` by overriding them inline if you need different values.

## Hooking up the UI to Canvas

1. **Configure server env** – Fill out `mcp-server/.env` with `CANVAS_API_BASE_URL`, `CANVAS_API_TOKEN`, and optionally `MOCK_SIO=true` if you only want mock schedule data.
2. **Run the HTTP bridge** – `npm run server:dev` (or `server:dev:mock`) exposes `GET /api/assignments` on port 3001 by default.
3. **Start the UI** – `cd sassy-scotty-ui && npm run dev`. The React app will:
   - Try `VITE_CANVAS_API_URL` if you set it (e.g. `http://localhost:3001/api/assignments`).
   - Fall back to `/api/assignments`, which Vite proxies to `http://localhost:3001` automatically (override with `VITE_CANVAS_PROXY` if needed).
   - Display mock data with a warning if the HTTP bridge is unreachable.

When building for production, host the UI behind the same origin as the HTTP bridge or set `VITE_CANVAS_API_URL` to the deployed gateway URL (never point it directly at `https://canvas.cmu.edu`, since Canvas blocks browser requests).
