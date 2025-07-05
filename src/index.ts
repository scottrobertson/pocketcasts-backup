/// <reference types="@cloudflare/workers-types" />

import { login } from "./login";
import { getListenHistory } from "./history";
import { saveHistory, initDatabase, getEpisodes } from "./db";
import type { Env, BackupResult, ExportedHandler, StoredEpisode } from "./types";

const worker: ExportedHandler<Env> = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/backup":
        return handleBackup(env);
      case "/history":
        return handleHistory(request, env);
      default:
        return new Response("Pocketcasts Backup Worker", { status: 200 });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleBackup(env));
  },
};

export default worker;

async function handleBackup(env: Env): Promise<Response> {
  try {
    validateEnvironment(env);
    await initDatabase(env.DB);

    const token = await login(env.EMAIL, env.PASS);
    const history = await getListenHistory(token);
    const savedHistory = await saveHistory(env.DB, history);

    const response: BackupResult = {
      success: true,
      message: "History saved successfully",
      synced: history.episodes.length,
      total: savedHistory.total,
    };

    return createJsonResponse(response);
  } catch (error) {
    console.error("Backup failed:", error);
    return createErrorResponse(error);
  }
}

async function handleHistory(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const password = url.searchParams.get("password");

  if (!isAuthorized(password, env.PASS)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const episodes = await getEpisodes(env.DB);
    const html = generateHistoryHtml(episodes);
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("History failed:", error);
    return new Response("Error loading history", { status: 500 });
  }
}

// Utility functions
function validateEnvironment(env: Env): void {
  if (!env.EMAIL || !env.PASS) {
    throw new Error("EMAIL and PASS environment variables are required");
  }
}

function isAuthorized(password: string | null, expectedPassword: string): boolean {
  return password === expectedPassword;
}

function createJsonResponse(data: BackupResult): Response {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

function createErrorResponse(error: unknown): Response {
  const errorResponse: BackupResult = {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function calculateProgress(playedTime: number, duration: number): number {
  return Math.round((playedTime / duration) * 100);
}

function generateHistoryHtml(episodes: StoredEpisode[]): string {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Pocketcasts Listen History</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .episode { 
            border: 1px solid #ddd; 
            margin: 10px 0; 
            padding: 15px; 
            border-radius: 5px; 
        }
        .title { font-weight: bold; font-size: 1.1em; }
        .podcast { color: #666; margin: 5px 0; }
        .meta { color: #999; font-size: 0.9em; }
        .progress { 
            background: #f0f0f0; 
            height: 5px; 
            border-radius: 3px; 
            margin: 5px 0; 
        }
        .progress-bar { 
            background: #4CAF50; 
            height: 100%; 
            border-radius: 3px; 
        }
        .stats { 
            background: #f5f5f5; 
            padding: 10px; 
            border-radius: 5px; 
            margin-bottom: 20px; 
        }
    </style>
</head>
<body>
    <h1>Pocketcasts Listen History</h1>
    <div class="stats">
        <strong>Total Episodes:</strong> ${episodes.length}
    </div>
    ${episodes.map(episode => generateEpisodeHtml(episode)).join('')}
</body>
</html>`;
}

function generateEpisodeHtml(episode: StoredEpisode): string {
  const progress = calculateProgress(episode.played_up_to, episode.duration);
  const publishedDate = new Date(episode.published).toLocaleDateString();

  return `
    <div class="episode">
        <div class="title">${episode.title}</div>
        <div class="podcast">${episode.podcast_title}</div>
        <div class="meta">
            Duration: ${formatDuration(episode.duration)} | 
            Played: ${formatDuration(episode.played_up_to)} | 
            Progress: ${progress}%
        </div>
        <div class="progress">
            <div class="progress-bar" style="width: ${progress}%"></div>
        </div>
        <div class="meta">Published: ${publishedDate}</div>
    </div>`;
}
