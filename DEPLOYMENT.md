# Deployment Guide

## The Problem

When you deploy just the frontend to Vercel, the `/api/*` routes return 404 because there's no backend server. The backend (`mcp-server`) needs to be deployed separately.

## Solution: Deploy Backend + Frontend

### Option 1: Deploy Backend to Railway (Recommended)

**1. Deploy Backend to Railway:**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Navigate to backend directory
cd mcp-server

# Initialize Railway project
railway init

# Add environment variables
railway variables set ACCESS_CODES="CMU2025,SCOTTY,TARTAN"
railway variables set CANVAS_API_URL="https://canvas.cmu.edu"
railway variables set PORT="3001"

# Optional: Add webhook URL
railway variables set ADMIN_WEBHOOK_URL="your-webhook-url"

# Deploy
railway up
```

**2. Get your Railway URL:**
After deployment, Railway will give you a URL like: `https://your-app.railway.app`

**3. Update `vercel.json`:**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-app.railway.app/api/:path*"
    }
  ],
  "routes": [
    {
      "src": "/[^.]+",
      "dest": "/",
      "status": 200
    }
  ]
}
```

**4. Redeploy Frontend to Vercel:**
```bash
cd ../sassy-scotty-ui
vercel --prod
```

### Option 2: Deploy Backend to Render

**1. Create a new Web Service on Render:**
- Go to https://render.com
- Click "New +" → "Web Service"
- Connect your GitHub repo
- Set Root Directory: `mcp-server`
- Build Command: `npm install`
- Start Command: `npm start`

**2. Add Environment Variables in Render:**
- `ACCESS_CODES` = `CMU2025,SCOTTY,TARTAN`
- `CANVAS_API_URL` = `https://canvas.cmu.edu`
- `PORT` = `3001`
- `ADMIN_WEBHOOK_URL` = (optional)

**3. Get your Render URL:**
After deployment: `https://your-app.onrender.com`

**4. Update `vercel.json` with your Render URL and redeploy**

### Option 3: All-Vercel (Serverless Functions)

This requires restructuring your backend as Vercel serverless functions.

**Create `sassy-scotty-ui/api` directory structure:**
```
sassy-scotty-ui/
└── api/
    ├── auth/
    │   ├── validate-code.ts
    │   ├── register.ts
    │   └── profile/[userId].ts
    ├── user/[userId]/data.ts
    ├── assignments.ts
    └── campus-events.ts
```

Each file exports a handler function. This is more complex and requires refactoring your Express routes.

## Recommended Approach

**Use Railway for the backend** (easiest):
1. Deploy `mcp-server` to Railway
2. Update `vercel.json` with Railway URL
3. Keep frontend on Vercel

## Testing Your Deployment

After deploying both:

1. **Test Backend Directly:**
   ```bash
   curl https://your-backend-url.railway.app/api/auth/validate-code \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"accessCode":"CMU2025"}'
   ```

2. **Test Frontend:**
   - Visit your Vercel URL
   - Try logging in with an access code
   - Check browser DevTools Network tab to see API calls

## Common Issues

### CORS Errors
If you see CORS errors, update your backend's CORS configuration in `httpServer.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-frontend.vercel.app'
  ],
  credentials: true
}));
```

### Environment Variables Not Working
Make sure to set ALL required environment variables on your hosting platform:
- `ACCESS_CODES`
- `CANVAS_API_URL`
- `PORT` (Railway/Render)
- `ADMIN_WEBHOOK_URL` (optional)

### 404 on Frontend Routes
The `routes` section in `vercel.json` handles SPA routing. All non-API routes serve `index.html` so React Router can handle them.

## Quick Deploy Commands

```bash
# 1. Deploy backend to Railway
cd mcp-server
railway up

# 2. Update sassy-scotty-ui/vercel.json with Railway URL

# 3. Deploy frontend to Vercel
cd ../sassy-scotty-ui
vercel --prod
```

## Environment Variables Reference

**Backend (.env or hosting platform):**
```env
ACCESS_CODES=CMU2025,SCOTTY,TARTAN
CANVAS_API_URL=https://canvas.cmu.edu
CANVAS_API_KEY=optional_fallback_key
PORT=3001
ADMIN_WEBHOOK_URL=https://hooks.slack.com/...
NODE_ENV=production
```

**Frontend (Vercel):**
No environment variables needed - the `vercel.json` rewrites handle routing to the backend.

---

Need help? Contact naitikvora@cmu.edu
