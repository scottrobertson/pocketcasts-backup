import { describe, it, expect, vi, beforeEach } from "vitest";
import { login } from "./login";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("login", () => {
  it("returns a token on successful login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: "abc-token-123" }),
      })
    );

    const token = await login("user@example.com", "password");
    expect(token).toBe("abc-token-123");
  });

  it("sends credentials as JSON to the correct endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: "t" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await login("user@example.com", "pass123");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.pocketcasts.com/user/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", password: "pass123" }),
      }
    );
  });

  it("throws when login fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false })
    );

    await expect(login("user@example.com", "wrong")).rejects.toThrow("Login failed");
  });
});
