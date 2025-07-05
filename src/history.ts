import type { HistoryResponse } from "./types";

export async function getListenHistory(token: string): Promise<HistoryResponse> {
  const res = await fetch(
    "https://api.pocketcasts.com/user/history?limit=200",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    console.log(await res.text());
    throw new Error("Failed to fetch listen history");
  }
  return res.json() as HistoryResponse;
}
