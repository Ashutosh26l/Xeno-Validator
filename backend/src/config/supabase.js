// src/config/supabase.js
// Initialises the Supabase client with the service-role key
// so the backend has full access to DB + Storage.

import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { env } from "./env.js";

export const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
  realtime: {
    transport: ws
  }
});
