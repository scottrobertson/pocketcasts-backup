import { describe, it, expect } from "vitest";
import { generateCsv } from "../src/csv";
import type { StoredEpisode } from "../src/types";

function makeEpisode(overrides: Partial<StoredEpisode> = {}): StoredEpisode {
  return {
    uuid: "abc-123",
    url: "https://example.com/ep.mp3",
    title: "Test Episode",
    podcast_title: "Test Podcast",
    podcast_uuid: "pod-123",
    published: "2024-01-15",
    duration: 600,
    file_type: "audio/mp3",
    size: "1000000",
    playing_status: 3,
    played_up_to: 600,
    is_deleted: 0,
    starred: 0,
    episode_type: "full",
    episode_season: 1,
    episode_number: 5,
    author: "Test Author",
    created_at: "2024-01-15T00:00:00Z",
    raw_data: "{}",
    ...overrides,
  };
}

describe("generateCsv", () => {
  it("returns only headers for an empty array", () => {
    const csv = generateCsv([]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(
      "Episode Title,Podcast Title,Duration (seconds),Played Up To (seconds),Progress (%),Published Date,Episode Type,Season,Episode Number,Author,Starred,Deleted"
    );
  });

  it("produces correct column values for a basic episode", () => {
    const csv = generateCsv([makeEpisode()]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(
      "Test Episode,Test Podcast,600,600,100,2024-01-15,full,1,5,Test Author,No,No"
    );
  });

  it("quotes fields that contain commas", () => {
    const csv = generateCsv([makeEpisode({ title: "Hello, World" })]);
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"Hello, World"');
  });

  it("doubles quotes inside fields that contain quotes", () => {
    const csv = generateCsv([makeEpisode({ title: 'Say "hello"' })]);
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"Say ""hello"""');
  });

  it("quotes fields that contain newlines", () => {
    const csv = generateCsv([makeEpisode({ title: "Line1\nLine2" })]);
    const firstRow = csv.split("\n").slice(1).join("\n");
    expect(firstRow).toContain('"Line1\nLine2"');
  });

  it("shows Yes for starred episodes", () => {
    const csv = generateCsv([makeEpisode({ starred: 1 })]);
    const lines = csv.split("\n");
    expect(lines[1]).toContain(",Yes,No");
  });

  it("shows Yes for deleted episodes", () => {
    const csv = generateCsv([makeEpisode({ is_deleted: 1 })]);
    const lines = csv.split("\n");
    expect(lines[1]).toContain(",No,Yes");
  });

  it("produces one row per episode", () => {
    const episodes = [
      makeEpisode({ uuid: "a", title: "First" }),
      makeEpisode({ uuid: "b", title: "Second" }),
      makeEpisode({ uuid: "c", title: "Third" }),
    ];
    const csv = generateCsv(episodes);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(4);
  });

  it("uses empty string for missing season and episode number", () => {
    const csv = generateCsv([makeEpisode({ episode_season: 0, episode_number: 0 })]);
    const lines = csv.split("\n");
    // season and episode number columns should be empty
    expect(lines[1]).toBe(
      "Test Episode,Test Podcast,600,600,100,2024-01-15,full,,,Test Author,No,No"
    );
  });

  it("calculates progress correctly in CSV output", () => {
    const csv = generateCsv([makeEpisode({ duration: 1000, played_up_to: 250 })]);
    const lines = csv.split("\n");
    const fields = lines[1].split(",");
    expect(fields[4]).toBe("25");
  });
});
