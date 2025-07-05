/// <reference types="@cloudflare/workers-types" />

export interface LoginResponse {
  token: string;
}

export interface Episode {
  uuid: string;
  url: string;
  published: string;
  duration: number;
  fileType: string;
  title: string;
  size: string;
  playingStatus: number;
  playedUpTo: number;
  starred: boolean;
  podcastUuid: string;
  podcastTitle: string;
  episodeType: string;
  episodeSeason: number;
  episodeNumber: number;
  isDeleted: boolean;
  author: string;
  bookmarks: unknown[];
}

export interface HistoryResponse {
  episodes: Episode[];
}

export interface Env {
  DB: D1Database;
  EMAIL: string;
  PASS: string;
  ENVIRONMENT?: string;
}

export interface BackupResult {
  success: boolean;
  message?: string;
  error?: string;
  synced?: number;
  total?: number;
}

export interface SaveHistoryResult {
  total: number;
}

export type ExportedHandler<Env = unknown> = {
  fetch?: (request: Request, env: Env, ctx: ExecutionContext) => Response | Promise<Response>;
  scheduled?: (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => void | Promise<void>;
};

export interface StoredEpisode {
  uuid: string;
  url: string;
  title: string;
  podcast_title: string;
  podcast_uuid: string;
  published: string;
  duration: number;
  file_type: string;
  size: string;
  playing_status: number;
  played_up_to: number;
  is_deleted: number;
  starred: number;
  episode_type: string;
  episode_season: number;
  episode_number: number;
  author: string;
  created_at: string;
  raw_data: string;
}