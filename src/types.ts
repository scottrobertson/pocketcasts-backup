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
  slug: string;
  podcastSlug: string;
}

export interface HistoryResponse {
  episodes: Episode[];
}

export interface Podcast {
  uuid: string;
  title: string;
  author: string;
  description: string;
  url: string;
  slug: string;
  dateAdded: string;
  folderUuid: string;
  sortPosition: number;
  isPrivate: boolean;
  autoStartFrom: number;
  autoSkipLast: number;
  episodesSortOrder: number;
  lastEpisodeUuid: string;
  lastEpisodePublished: string;
  unplayed: boolean;
  lastEpisodePlayingStatus: number;
  lastEpisodeArchived: boolean;
  descriptionHtml: string;
  settings: unknown;
}

export interface PodcastListResponse {
  podcasts: Podcast[];
  folders: unknown[];
}

export interface Bookmark {
  bookmarkUuid: string;
  podcastUuid: string;
  episodeUuid: string;
  time: number;
  title: string;
  createdAt: string;
}

export interface BookmarkListResponse {
  bookmarks: Bookmark[];
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
  podcasts?: number;
  bookmarks?: number;
}

export interface SaveHistoryResult {
  total: number;
}

export type ExportedHandler<Env = unknown> = {
  fetch?: (request: Request, env: Env, ctx: ExecutionContext) => Response | Promise<Response>;
  scheduled?: (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => void | Promise<void>;
};

