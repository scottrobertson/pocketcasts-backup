import { describe, it, expect, vi, beforeEach } from "vitest";
import { getListenHistory } from "../src/history";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getListenHistory", () => {
  it("returns parsed history on success", async () => {
    const mockHistory = { episodes: [{ uuid: "ep-1", title: "Test" }] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      })
    );

    const result = await getListenHistory("my-token");
    expect(result).toEqual(mockHistory);
  });

  it("sends the token as a Bearer header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ episodes: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await getListenHistory("my-token");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.pocketcasts.com/user/history?limit=200",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer my-token",
          "Content-Type": "application/json",
        },
      }
    );
  });

  it("throws when the API returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        text: () => Promise.resolve("Unauthorized"),
      })
    );

    await expect(getListenHistory("bad-token")).rejects.toThrow(
      "Failed to fetch listen history"
    );
  });
});
