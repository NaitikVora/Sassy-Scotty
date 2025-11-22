# 🔐 Authentication & User Management Setup

## Overview

Your app now has a complete authentication system with:
- ✅ Access code authentication
- ✅ User profiles with device tracking
- ✅ Profile management UI
- ✅ Admin notifications (Slack/Discord)
- ✅ Personalized data per user

## Quick Start

### 1. Configure Access Codes

Edit `mcp-server/.env`:
```env
ACCESS_CODES=CMU2025,SCOTTY,TARTAN
```

Add any codes you want. Users must enter one of these to access the app.

### 2. Set Up Admin Notifications (Optional)

Get notified via Slack or Discord when users register/login:

#### Slack Webhook:
1. Go to https://api.slack.com/messaging/webhooks
2. Create a webhook for your workspace
3. Add to `.env`:
```env
ADMIN_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### Discord Webhook:
1. Server Settings → Integrations → Webhooks → New Webhook
2. Copy the webhook URL
3. Add to `.env`:
```env
ADMIN_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/TOKEN
```

### 3. Start the Server

```bash
npm run server:dev
```

## Features

### User Flow

1. **First Visit**: User enters access code
2. **Profile Setup**: User provides name and CMU email
3. **Personalized Dashboard**: Custom data per user
4. **Profile Management**: Click avatar to edit profile or logout

### Admin Notifications

When users register or login, you'll receive a notification with:
- Name & email
- Device type (mobile/tablet/desktop)
- Operating system
- Browser
- Timezone
- Timestamp

### Data Storage

**User Profiles**: `mcp-server/data/users/{userId}.json`
```json
{
  "id": "user_1234567890_abc123",
  "name": "John Doe",
  "email": "jdoe@andrew.cmu.edu",
  "accessCode": "CMU2025",
  "deviceInfo": {
    "deviceType": "desktop",
    "os": "macOS",
    "browser": "Chrome"
  },
  "firstAccess": "2025-01-15T10:30:00.000Z",
  "lastAccess": "2025-01-15T14:45:00.000Z"
}
```

**User Data**: `mcp-server/data/user_{userId}.json`
- Custom tasks
- Focus notes
- Kanban state
- Preferences

## API Endpoints

### Authentication
- `POST /api/auth/validate-code` - Validate access code
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile/:userId` - Get user profile
- `PUT /api/auth/profile/:userId` - Update user profile

## Vercel Deployment

### Environment Variables in Vercel

1. Go to your Vercel project settings
2. Add these environment variables:

```
ACCESS_CODES=CMU2025,SCOTTY,TARTAN
ADMIN_WEBHOOK_URL=your_webhook_url_here
PORT=3001
```

### Build Settings

```json
{
  "buildCommand": "cd mcp-server && npm install && npm run build",
  "outputDirectory": "mcp-server/dist",
  "installCommand": "npm install"
}
```

## Security Best Practices

1. **Rotate Access Codes**: Change codes periodically
2. **Limit Codes**: Only share with authorized users
3. **Monitor Notifications**: Keep track of who accesses
4. **Secure Webhooks**: Keep webhook URLs private
5. **HTTPS Only**: Always use HTTPS in production

## Customization

### Add More Access Codes
Just update the `.env` file:
```env
ACCESS_CODES=CMU2025,SCOTTY,TARTAN,NEWCODE,ANOTHERCODE
```

### Change Notification Format
Edit `sendAdminNotification()` in `mcp-server/src/httpServer.ts`

### Custom User Fields
Add fields to `UserProfile` type in `sassy-scotty-ui/src/types/user.ts`

## Troubleshooting

### "Invalid access code"
- Check that code is in ACCESS_CODES list
- Codes are case-sensitive
- No spaces in codes

### Notifications not working
- Verify webhook URL is correct
- Check server logs for errors
- Test webhook URL directly

### Profile not saving
- Ensure `mcp-server/data/users/` directory exists
- Check file permissions
- Verify server is running

## Demo Access Codes

For testing, use any of these:
- `CMU2025`
- `SCOTTY`
- `TARTAN`

---

Built with 💙 for CMU students
