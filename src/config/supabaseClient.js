import { createClient } from "@supabase/supabase-js";
import ws from "ws";

let _client = null;

export default function getSupabaseClient() {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        realtime: { transport: ws },
      }
    );
  }
  return _client;
}
