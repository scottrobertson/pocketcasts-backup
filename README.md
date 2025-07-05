# Pocketcasts Backup - Cloudflare Workers

A TypeScript Cloudflare Workers app that backs up your Pocketcasts listen history to a D1 database with a web interface to view your history.

## Features

- **Automated Backups** - Runs daily at midnight UTC via cron job
- **D1 Database Storage** - Stores all episode data with proper indexing
- **Manual Backup** - Trigger backup via HTTP endpoint
- **History Viewer** - Password-protected web interface to browse listen history
- **TypeScript** - Full type safety and IntelliSense support
- **Progress Tracking** - Visual progress bars showing listen completion

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

3. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

4. **Create D1 database:**
   ```bash
   wrangler d1 create pocketcasts-history
   ```

5. **Update `wrangler.toml`** with your database ID from the previous command

6. **Create the database schema:**
   ```bash
   wrangler d1 execute pocketcasts-history --file=./schema.sql
   ```

7. **Set environment variables:**
   ```bash
   wrangler secret put EMAIL
   wrangler secret put PASS
   ```

8. **Deploy:**
   ```bash
   npm run deploy
   ```

## Usage

### Automatic Backup
The worker runs automatically every day at midnight UTC to sync your latest listen history.

### Manual Backup
Trigger a backup manually:
```
https://your-worker-domain.workers.dev/backup
```

### View History
Access your listen history with password protection:
```
https://your-worker-domain.workers.dev/history?password=your-password
```

The history page shows:
- Total episode count
- Episode titles and podcast names
- Listen progress with visual progress bars
- Duration and played time
- Published dates

## Development

**Start development server:**
```bash
npm run dev
```

**Type checking:**
```bash
npm run typecheck
```

**Deploy to production:**
```bash
npm run deploy
```

## Environment Variables

- `EMAIL`: Your Pocketcasts email address
- `PASS`: Your Pocketcasts password (also used for history page access)

## Database Schema

The D1 database stores episode data with the following fields:
- Episode metadata (title, podcast, duration, etc.)
- Listen progress (played time, completion percentage)
- Raw API response for future extensibility
- Proper indexing for efficient queries