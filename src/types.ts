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