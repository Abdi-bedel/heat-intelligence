import { betterAuth } from "better-auth";
import { Pool } from "pg";

let cachedAuth: ReturnType<typeof createAuthInstance> | null = null;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function createBetterAuthPool(): Pool {
  return new Pool({
    connectionString: required("HEAT_INTELLIGENCE_DATABASE_URL"),
    ssl:
      process.env.HEAT_INTELLIGENCE_DATABASE_SSL === "false"
        ? false
        : { rejectUnauthorized: false },
  });
}

function createAuthInstance() {
  const baseURL =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    "http://localhost:8787"; // default to api port

  return betterAuth({
    appName: "Heat Intelligence",
    secret: required("BETTER_AUTH_SECRET"),
    baseURL,
    database: createBetterAuthPool(),
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
    },
    // No nextCookies here — this instance is primarily for server-to-server
    // operations (signUp during claim, getSession for status checks).
    // The portal (Next.js) can have its own BetterAuth client config if needed
    // for cookie-based sessions in the future.
  });
}

export function getHeatIntelligenceAuth() {
  if (cachedAuth) return cachedAuth;
  cachedAuth = createAuthInstance();
  return cachedAuth;
}

export async function withHeatIntelligenceBetterAuthClient<T>(
  fn: (auth: ReturnType<typeof createAuthInstance>) => Promise<T>,
) {
  const auth = getHeatIntelligenceAuth();
  return fn(auth);
}
