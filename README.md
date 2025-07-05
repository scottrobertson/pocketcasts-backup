# Pocketcasts Backup - Cloudflare Workers

A Cloudflare Workers app that backs up your Pocketcasts listen history to a D1 database.

## Features

- Automatically syncs your Pocketcasts listen history
- Stores data in Cloudflare D1 database
- Runs on a scheduled cron job (daily at midnight)
- Manual backup trigger via HTTP endpoint

## Setup

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Create D1 database:
   ```bash
   wrangler d1 create pocketcasts-backup
   ```

4. Update `wrangler.toml` with your database ID from the previous command

5. Create the database schema:
   ```bash
   wrangler d1 execute pocketcasts-backup --file=./schema.sql
   ```

6. Set environment variables:
   ```bash
   wrangler secret put EMAIL
   wrangler secret put PASS
   ```

7. Deploy:
   ```bash
   wrangler deploy
   ```

## Usage

The worker will automatically run daily at midnight UTC to backup your history.

You can also trigger a manual backup by visiting:
```
https://your-worker-domain.workers.dev/backup
```

## Environment Variables

- `EMAIL`: Your Pocketcasts email address
- `PASS`: Your Pocketcasts password