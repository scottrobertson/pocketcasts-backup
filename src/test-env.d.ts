/// <reference types="@cloudflare/vitest-pool-workers" />

import type { Env } from "./types";

declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {}
}
