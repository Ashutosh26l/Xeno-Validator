// src/config/env.js
// Validates that all required environment variables are present
// and exports them as a typed object for the rest of the app.

const REQUIRED = [
  "PORT",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET"
];

/**
 * Call once at startup. Throws if any required var is missing.
 */
export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables:\n  ${missing.join("\n  ")}`
    );
  }
}

/**
 * Convenience accessors so the rest of the code doesn't touch process.env directly.
 */
export const env = {
  get port()                  { return parseInt(process.env.PORT, 10) || 8000; },
  get nodeEnv()               { return process.env.NODE_ENV || "development"; },
  get jwtSecret()             { return process.env.JWT_SECRET; },
  get jwtExpiresIn()          { return process.env.JWT_EXPIRES_IN || "24h"; },
  get supabaseUrl()           { return process.env.SUPABASE_URL; },
  get supabaseServiceKey()    { return process.env.SUPABASE_SERVICE_ROLE_KEY; },
  get supabaseStorageBucket() { return process.env.SUPABASE_STORAGE_BUCKET; },
  get geminiApiKey()          { return process.env.GEMINI_API_KEY; },
  get chunkSize()             { return parseInt(process.env.CHUNK_SIZE, 10) || 10000; },
};
