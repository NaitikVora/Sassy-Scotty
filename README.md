# scotty szn

> cmu productivity hits different

A Gen Z-styled productivity app built for CMU students. Manage tasks, sync with Canvas, track sprints, and stay organized with a vibe coach that keeps you motivated.

## Features

### Authentication & Access Control
- **Access Code System**: Invite-only access with customizable access codes
- **User Profiles**: Personalized experience for each user with profile management
- **Device Tracking**: Automatic device fingerprinting for admin analytics (hidden from users)
- **Admin Notifications**: Real-time webhook notifications (Slack/Discord) for new user registrations
- **Canvas API Integration**: Users can add their personal Canvas API keys for personalized course data

### Productivity Tools
- **Canvas Sync**: Automatic sync with CMU Canvas for assignments and courses
- **Kanban Board**: Drag-and-drop task management with customizable columns
- **Sprint System**: Set sprint goals and track daily/weekly progress
- **Quick Notes**: Persistent "jot it down" section with localStorage caching
- **Custom Tasks**: Add personal tasks alongside Canvas assignments
- **Vibe Coach**: Motivational messages that adapt to your productivity level

### UI/UX Features
- **Theme Switcher**: Light, dark, and auto modes with smooth transitions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dynamic Branding**: Random emoji logo that changes on each refresh
- **Accessibility**: Keyboard navigation, screen reader support, ARIA labels
- **Offline Support**: Extensive localStorage caching for offline functionality

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- CMU Canvas account
- Canvas API token (optional, for personalized sync)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/NaitikVora/Sassy-Scotty.git
cd Sassy-Scotty
```

2. **Install dependencies**
```bash
# Install UI dependencies
cd sassy-scotty-ui
npm install

# Install server dependencies
cd ../mcp-server
npm install
```

3. **Configure environment variables**
```bash
cd mcp-server
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Access codes (comma-separated)
ACCESS_CODES=ACCESS_CODES

# Admin webhook for notifications (optional)
ADMIN_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Canvas API configuration (for mock data fallback)
CANVAS_API_URL=https://canvas.cmu.edu
CANVAS_API_KEY=your_canvas_api_key_here
```

4. **Start the development servers**

Open two terminal windows:

**Terminal 1 - HTTP Server:**
```bash
cd mcp-server
npm run server:dev
```

**Terminal 2 - Vite Dev Server:**
```bash
cd sassy-scotty-ui
npm run dev
```

5. **Access the app**
- Open http://localhost:5173
- Enter an access code (default: CMU2025, SCOTTY, or TARTAN)
- Create your profile and start using the app!

## User Guide

### First Time Setup

1. **Login with Access Code**
   - Enter one of the configured access codes
   - If you're a new user, you'll be prompted to create a profile

2. **Create Your Profile**
   - Enter your name and CMU email
   - Optionally add your Canvas API key for personalized course sync
   - Your profile is saved and persists across sessions

3. **Get Your Canvas API Key** (Optional)
   - Visit https://canvas.cmu.edu/profile/settings
   - Scroll to "Approved Integrations"
   - Click "+ New Access Token"
   - Copy the token and paste it in your profile settings

### Using the App

**Managing Tasks:**
- Canvas assignments sync automatically if you've added your API key
- Add custom tasks using the "+ custom task" button
- Drag tasks between columns: "to do" → "in progress" → "done"
- Delete tasks by clicking the × button

**Sprint Planning:**
- Set your sprint goal in the Sprint Focus section
- View daily and weekly task completion stats
- Get motivational messages from the vibe coach

**Quick Notes:**
- Use "jot it down" for quick thoughts and reminders
- Notes persist automatically with localStorage

**Profile Management:**
- Click your initial in the top-right corner
- Edit name, email, or Canvas API key
- View account info (member since, last active)
- Log out when done

**Theme Switching:**
- Click the theme toggle button (sun/moon icon)
- Choose: light, dark, or auto (system preference)
- Theme preference is saved per user

## Configuration

### Access Codes
Access codes are configured in `mcp-server/.env`:
```env
ACCESS_CODES=CODE1,CODE2,CODE3
```

You can add or remove codes at any time. Users with existing accounts can continue to log in even if their original code is removed.

### Admin Notifications
Set up webhook notifications for user activity:

**Slack:**
1. Create a Slack app and enable Incoming Webhooks
2. Copy the webhook URL
3. Add to `.env`: `ADMIN_WEBHOOK_URL=https://hooks.slack.com/services/...`

**Discord:**
1. Go to Server Settings → Integrations → Webhooks
2. Create a webhook and copy the URL
3. Add to `.env`: `ADMIN_WEBHOOK_URL=https://discord.com/api/webhooks/...`

Notifications are sent when:
- New user registers
- Existing user logs in
- User updates their profile

### Canvas API Configuration
The app supports two modes:

**User-Specific Canvas Sync** (Recommended):
- Each user adds their own Canvas API key in their profile
- Data is personalized to their courses and assignments
- More secure and scalable

**Global Canvas API** (Fallback):
- Configure `CANVAS_API_KEY` in `.env`
- Used for mock data generation
- All users see the same data

## Development

### Project Structure
```
Sassy-Scotty/
├── sassy-scotty-ui/           # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ProfileModal.tsx
│   │   │   ├── KanbanBoard.tsx
│   │   │   └── ...
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   └── App.tsx           # Main app component
│   └── vite.config.ts        # Vite configuration
│
├── mcp-server/               # Express backend
│   ├── src/
│   │   └── httpServer.ts     # Main server file
│   ├── data/
│   │   └── users/           # User profiles (auto-generated)
│   └── .env                 # Environment variables
│
├── AUTH_SETUP.md            # Authentication documentation
└── README.md                # This file
```

### Scripts

**Frontend (sassy-scotty-ui):**
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend (mcp-server):**
- `npm run server:dev` - Start HTTP server on port 3001
- `npm start` - Start server (production)

### API Endpoints

**Authentication:**
- `POST /api/auth/validate-code` - Validate access code
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile/:userId` - Get user profile
- `PUT /api/auth/profile/:userId` - Update user profile

**Canvas Integration:**
- `GET /api/canvas/courses` - Get user's Canvas courses
- `GET /api/canvas/assignments` - Get assignments for selected courses
- Canvas requests use user's personal API key from their profile

## Deployment

### Deploy to Vercel

**Frontend:**
```bash
cd sassy-scotty-ui
npm run build
vercel --prod
```

**Backend:**
You'll need to deploy the Express server separately (Vercel, Railway, Render, etc.)

Set environment variables in your hosting platform:
- `ACCESS_CODES`
- `ADMIN_WEBHOOK_URL` (optional)
- `CANVAS_API_URL`
- `CANVAS_API_KEY` (optional)

Update the Vite proxy configuration in `vite.config.ts` to point to your deployed backend URL in production.

### Environment Variables for Production

Create a `.env.production` file or set directly in your hosting platform:
```env
NODE_ENV=production
ACCESS_CODES=your,production,codes
ADMIN_WEBHOOK_URL=https://hooks.slack.com/services/...
CANVAS_API_URL=https://canvas.cmu.edu
PORT=3001
```

## Troubleshooting

### "Canvas sync paused: local Canvas gateway is offline"
**Problem:** The HTTP server on port 3001 isn't running.

**Solution:**
1. Make sure the server is running: `cd mcp-server && npm run server:dev`
2. Restart the Vite dev server (Vite checks port 3001 on startup)
3. Check that port 3001 isn't being used by another process

### Blank screen after login/logout
**Problem:** This is expected behavior - the app reloads to ensure clean state.

**How it works:** The app calls `window.location.reload()` after login/logout to:
- Clear cached state
- Reinitialize with new user data
- Prevent cross-user data contamination

### Tasks not persisting
**Problem:** localStorage might be disabled or cleared.

**Solution:**
1. Check browser settings allow localStorage
2. Don't use private/incognito mode (localStorage is session-only)
3. Check browser console for errors

### Canvas sync not working
**Problem:** Missing or invalid Canvas API key.

**Solution:**
1. Open your profile (click initial in top-right)
2. Click "edit profile"
3. Add your Canvas API key from https://canvas.cmu.edu/profile/settings
4. Save changes and refresh the page

### Admin webhooks not sending
**Problem:** Invalid webhook URL or network issues.

**Solution:**
1. Verify webhook URL is correct in `.env`
2. Test webhook manually with curl:
   ```bash
   curl -X POST YOUR_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test message"}'
   ```
3. Check server logs for error messages

## Credits

Built by [Naitik Vora](https://www.linkedin.com/in/naitikvora) for CMU students.

Contact: [naitikvora@cmu.edu](mailto:naitikvora@cmu.edu)

## License

MIT License - feel free to use and modify for your own projects!

---

**scotty szn** - cmu productivity hits different 🎯
