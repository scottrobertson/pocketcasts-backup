/// <reference types="@cloudflare/workers-types" />

import { Hono } from "hono";
import { login } from "./login";
import { getEpisodeSyncData, getPodcastEpisodeMetadata, getPodcastList, getBookmarks } from "./api";
import { getExistingEpisodeUuids, updateEpisodeSyncData, insertNewEpisodes, savePodcasts, saveBookmarks, getEpisodes, getEpisodeCount, getPodcastsWithStats, getBookmarksWithEpisodes, updatePodcastEpisodeCount, parseFilters, updateEpisodePlayedAt, resetBackupProgress, incrementBackupProgress } from "./db";
import type { EpisodeUpdate, NewEpisode } from "./db";
import { getListenHistory } from "./history";
import { EpisodesPage } from "./components/EpisodesPage";
import { PodcastsPage } from "./components/PodcastsPage";
import { BookmarksPage } from "./components/BookmarksPage";
import { generateCsv } from "./csv";
import type { Env, BackupResult, BackupQueueMessage, EpisodeSyncItem, CacheEpisode } from "./types";

const app = new Hono<{ Bindings: Env }>();

// Auth middleware for pages that need a password
const requireAuth = (c: any, next: any) => {
  const password = new URL(c.req.url).searchParams.get("password");
  if (password !== c.env.PASS) {
    return c.text("Unauthorized", 401);
  }
  return next();
};

app.get("/backup", async (c) => {
  try {
    validateEnvironment(c.env);
    await c.env.BACKUP_QUEUE.send({ type: "sync-podcasts" });
    return c.json({ success: true, message: "Backup queued" } satisfies BackupResult);
  } catch (error) {
    console.error("Backup failed:", error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" } satisfies BackupResult,
      500,
    );
  }
});

const EPISODES_PER_PAGE = 50;

app.get("/episodes", requireAuth, async (c) => {
  try {
    const url = new URL(c.req.url);
    const password = url.searchParams.get("password");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const filters = parseFilters(url.searchParams.getAll("filter"));
    const offset = (page - 1) * EPISODES_PER_PAGE;

    const [episodes, totalEpisodes] = await Promise.all([
      getEpisodes(c.env.DB, EPISODES_PER_PAGE, offset, filters),
      getEpisodeCount(c.env.DB, filters),
    ]);

    return c.html(
      <EpisodesPage episodes={episodes} totalEpisodes={totalEpisodes} page={page} perPage={EPISODES_PER_PAGE} password={password} filters={filters} />
    );
  } catch (error) {
    console.error("Episodes failed:", error);
    return c.text("Error loading episodes", 500);
  }
});

app.get("/podcasts", requireAuth, async (c) => {
  try {
    const password = new URL(c.req.url).searchParams.get("password");
    const podcasts = await getPodcastsWithStats(c.env.DB);
    return c.html(<PodcastsPage podcasts={podcasts} password={password} />);
  } catch (error) {
    console.error("Podcasts failed:", error);
    return c.text("Error loading podcasts", 500);
  }
});

app.get("/bookmarks", requireAuth, async (c) => {
  try {
    const password = new URL(c.req.url).searchParams.get("password");
    const bookmarks = await getBookmarksWithEpisodes(c.env.DB);
    return c.html(<BookmarksPage bookmarks={bookmarks} password={password} />);
  } catch (error) {
    console.error("Bookmarks failed:", error);
    return c.text("Error loading bookmarks", 500);
  }
});

app.get("/export", requireAuth, async (c) => {
  try {
    const url = new URL(c.req.url);
    const filters = parseFilters(url.searchParams.getAll("filter"));
    const episodes = await getEpisodes(c.env.DB, undefined, undefined, filters);
    const csv = generateCsv(episodes);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="castkeeper-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return c.text("Error exporting data", 500);
  }
});

app.get("/", (c) => c.text("castkeeper"));

// Queue and scheduled handlers

async function processPodcastEpisodes(
  token: string,
  d1: D1Database,
  podcastUuid: string,
  podcastTitle: string,
  podcastAuthor: string,
  podcastSlug: string,
): Promise<number> {
  const [syncData, cacheData] = await Promise.all([
    getEpisodeSyncData(token, podcastUuid),
    getPodcastEpisodeMetadata(podcastUuid),
  ]);

  await updatePodcastEpisodeCount(d1, podcastUuid, cacheData.episode_count);

  const interacted = syncData.episodes.filter(
    (ep) => ep.playingStatus > 0 || ep.playedUpTo > 0
  );

  if (interacted.length === 0) {
    console.log(`[${podcastTitle}] No interacted episodes, skipping`);
    return 0;
  }

  const interactedUuids = interacted.map((ep) => ep.uuid);
  const existingUuids = await getExistingEpisodeUuids(d1, interactedUuids);

  const toUpdate: EpisodeUpdate[] = [];
  const newSyncItems: EpisodeSyncItem[] = [];

  for (const ep of interacted) {
    if (existingUuids.has(ep.uuid)) {
      toUpdate.push({
        uuid: ep.uuid,
        playing_status: ep.playingStatus,
        played_up_to: ep.playedUpTo,
        starred: ep.starred ? 1 : 0,
        is_deleted: ep.isDeleted ? 1 : 0,
      });
    } else {
      newSyncItems.push(ep);
    }
  }

  if (toUpdate.length > 0) {
    console.log(`[${podcastTitle}] Updating ${toUpdate.length} existing episodes`);
    await updateEpisodeSyncData(d1, toUpdate);
  }

  if (newSyncItems.length > 0) {
    console.log(`[${podcastTitle}] Inserting ${newSyncItems.length} new episodes`);

    const cacheMap = new Map<string, CacheEpisode>();
    for (const ep of cacheData.podcast.episodes) {
      cacheMap.set(ep.uuid, ep);
    }

    const toInsert: NewEpisode[] = [];
    for (const syncItem of newSyncItems) {
      const cached = cacheMap.get(syncItem.uuid);
      if (!cached) continue;

      toInsert.push({
        uuid: syncItem.uuid,
        url: cached.url,
        title: cached.title,
        podcast_title: podcastTitle,
        podcast_uuid: podcastUuid,
        published: cached.published,
        duration: cached.duration || syncItem.duration,
        file_type: cached.file_type || "",
        size: String(cached.file_size || "0"),
        playing_status: syncItem.playingStatus,
        played_up_to: syncItem.playedUpTo,
        is_deleted: syncItem.isDeleted ? 1 : 0,
        starred: syncItem.starred ? 1 : 0,
        episode_type: cached.type || "full",
        episode_season: cached.season || 0,
        episode_number: cached.number || 0,
        author: podcastAuthor,
        slug: cached.slug || "",
        podcast_slug: podcastSlug,
      });
    }

    if (toInsert.length > 0) {
      await insertNewEpisodes(d1, toInsert);
    }
  }

  console.log(`[${podcastTitle}] Done: ${toUpdate.length} updated, ${newSyncItems.length} new`);
  return interacted.length;
}

async function handleQueueMessage(message: BackupQueueMessage, env: Env): Promise<void> {
  switch (message.type) {
    case "sync-podcasts": {
      const token = await login(env.EMAIL, env.PASS);
      const [podcastList, bookmarkList] = await Promise.all([
        getPodcastList(token),
        getBookmarks(token),
      ]);
      await Promise.all([
        savePodcasts(env.DB, podcastList),
        saveBookmarks(env.DB, bookmarkList),
      ]);

      const total = podcastList.podcasts.length;
      await resetBackupProgress(env.DB, total);

      const messages: MessageSendRequest<BackupQueueMessage>[] = podcastList.podcasts.map((podcast) => ({
        body: {
          type: "sync-podcast" as const,
          token,
          podcastUuid: podcast.uuid,
          podcastTitle: podcast.title,
          podcastAuthor: podcast.author,
          podcastSlug: podcast.slug,
        },
      }));

      for (let i = 0; i < messages.length; i += 100) {
        await env.BACKUP_QUEUE.sendBatch(messages.slice(i, i + 100));
      }

      console.log(`[Backup] Enqueued ${total} podcast sync messages`);
      break;
    }

    case "sync-podcast": {
      await processPodcastEpisodes(
        message.token,
        env.DB,
        message.podcastUuid,
        message.podcastTitle,
        message.podcastAuthor,
        message.podcastSlug,
      );

      const progress = await incrementBackupProgress(env.DB);
      console.log(`[Backup] Progress: ${progress.completed}/${progress.total}`);

      if (progress.completed >= progress.total) {
        await env.BACKUP_QUEUE.send({ type: "sync-history", token: message.token });
        console.log("[Backup] All podcasts synced, enqueued history sync");
      }
      break;
    }

    case "sync-history": {
      console.log("[History] Fetching listen history");
      const history = await getListenHistory(message.token);
      console.log(`[History] Got ${history.length} played episodes`);
      await updateEpisodePlayedAt(env.DB, history);
      console.log("[Backup] Complete");
      break;
    }
  }
}

function validateEnvironment(env: Env): void {
  if (!env.EMAIL || !env.PASS) {
    throw new Error("EMAIL and PASS environment variables are required");
  }
}

export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      validateEnvironment(env);
      await env.BACKUP_QUEUE.send({ type: "sync-podcasts" });
    } catch (error) {
      console.error("Scheduled backup failed:", error);
    }
  },

  async queue(batch: MessageBatch<BackupQueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      await handleQueueMessage(msg.body, env);
      msg.ack();
    }
  },
};
