import type { LoginResponse } from "./types";

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch("https://api.pocketcasts.com/user/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Login failed");
  const data = await res.json() as LoginResponse;
  return data.token;
}
