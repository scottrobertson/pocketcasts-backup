export interface HistoryEntry {
  uuid: string;
  played_at: string;
}

interface HistoryYearChange {
  action: number;
  episode: string;
  modifiedAt: string;
}

interface HistoryYearResponse {
  count?: number;
  history?: {
    changes: HistoryYearChange[];
  };
}

async function fetchHistoryYear(token: string, year: number, count: boolean): Promise<HistoryYearResponse> {
  const res = await fetch("https://api.pocketcasts.com/history/year", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ version: "1", count, year }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch history for ${year}: ${res.status}`);
  }

  return await res.json() as HistoryYearResponse;
}

export async function getListenHistory(token: string): Promise<HistoryEntry[]> {
  const currentYear = new Date().getFullYear();
  const seen = new Map<string, string>();

  for (let year = currentYear; year >= 2010; year--) {
    const countRes = await fetchHistoryYear(token, year, true);
    const total = countRes.count ?? 0;

    if (total === 0) {
      console.log(`[History] ${year}: no episodes, stopping`);
      break;
    }

    const fullRes = await fetchHistoryYear(token, year, false);
    const changes = fullRes.history?.changes ?? [];

    let newCount = 0;
    for (const change of changes) {
      if (change.action !== 1) continue;

      const existing = seen.get(change.episode);
      if (existing === undefined) {
        seen.set(change.episode, change.modifiedAt);
        newCount++;
      }
    }

    console.log(`[History] ${year}: ${changes.length} entries (${newCount} new, ${seen.size} unique episodes)`);
  }

  const entries: HistoryEntry[] = [];
  for (const [uuid, modifiedAt] of seen) {
    entries.push({
      uuid,
      played_at: new Date(Number(modifiedAt)).toISOString(),
    });
  }
  return entries;
}
